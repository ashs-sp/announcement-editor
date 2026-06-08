import { useRef, useCallback } from 'react'
import { useDocument } from '../../context/DocumentContext'
import { computeNumberedList, getLevelIndent } from '../../utils/numbering'

const LEVEL_LABELS = { 1: '一、', 2: '（一）', 3: '1.', 4: '(1)' }
const LEVEL_COLORS = { 1: '#1C2B3A', 2: '#3A5F7A', 3: '#5A7A6A', 4: '#7A6A5A' }

function ListItem({ blockId, item, prefix, onKeyDown, onFocus }) {
  const { actions } = useDocument()
  const inputRef = useRef(null)
  const indent = getLevelIndent(item.level)

  const handleChange = useCallback((e) => {
    actions.updateListItem(blockId, item.id, { content: e.target.value })
  }, [blockId, item.id, actions])

  const handleKeyDown = useCallback((e) => {
    onKeyDown(e, item, inputRef)
  }, [onKeyDown, item])

  return (
    <div
      className="block-row group flex items-start gap-1 py-1 rounded hover:bg-parchment/60 pr-2 transition-colors"
      style={{ paddingLeft: `${indent + 4}px` }}
    >
      {/* Drag handle */}
      <div className="drag-handle mt-2 flex-shrink-0 text-ink-muted/30 cursor-grab active:cursor-grabbing select-none">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="4" cy="3" r="1"/>
          <circle cx="8" cy="3" r="1"/>
          <circle cx="4" cy="6" r="1"/>
          <circle cx="8" cy="6" r="1"/>
          <circle cx="4" cy="9" r="1"/>
          <circle cx="8" cy="9" r="1"/>
        </svg>
      </div>

      {/* Number prefix */}
      <span
        className="flex-shrink-0 font-serif text-sm mt-1.5 leading-none select-none min-w-[2rem]"
        style={{ color: LEVEL_COLORS[item.level] || '#1C2B3A' }}
      >
        {prefix}
      </span>

      {/* Content textarea */}
      <textarea
        ref={inputRef}
        value={item.content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => onFocus(item.id)}
        rows={1}
        className="flex-1 text-sm font-serif text-ink bg-transparent border-none outline-none resize-none
                   leading-relaxed py-1 placeholder-ink-muted/30"
        style={{ minHeight: '1.8em', overflowY: 'hidden' }}
        onInput={e => {
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
      />

      {/* Level controls */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 mt-1 flex-shrink-0 transition-opacity">
        <button
          onClick={() => item.level > 1 && actions.updateListItem(blockId, item.id, { level: item.level - 1 })}
          disabled={item.level <= 1}
          title="減少縮排 (Shift+Tab)"
          className="p-0.5 rounded text-ink-muted hover:text-ink hover:bg-parchment-dark disabled:opacity-20 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7 2L3 6L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-[9px] font-mono text-ink-muted/60 w-3 text-center">
          {item.level}
        </span>
        <button
          onClick={() => item.level < 4 && actions.updateListItem(blockId, item.id, { level: item.level + 1 })}
          disabled={item.level >= 4}
          title="增加縮排 (Tab)"
          className="p-0.5 rounded text-ink-muted hover:text-ink hover:bg-parchment-dark disabled:opacity-20 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M5 2L9 6L5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => actions.deleteListItem(blockId, item.id)}
          title="刪除此項目"
          className="p-0.5 ml-1 rounded text-ink-muted hover:text-vermillion hover:bg-vermillion-bg transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function NumberedList({ blockId }) {
  const { state, actions } = useDocument()
  const block = state.document.blocks.find(b => b.id === blockId)
  const items = block?.items || []
  const numbered = computeNumberedList(items)
  const focusedItemId = useRef(null)

  const handleFocus = useCallback((itemId) => {
    focusedItemId.current = itemId
  }, [])

  const handleKeyDown = useCallback((e, item, inputRef) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      actions.addListItem(blockId, item.id, item.level)
      // Focus next item after React re-render
      setTimeout(() => {
        const items = document.querySelectorAll(`[data-block="${blockId}"] textarea`)
        const idx = Array.from(items).findIndex(el => el === inputRef.current)
        if (idx >= 0 && items[idx + 1]) items[idx + 1].focus()
      }, 50)
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        if (item.level > 1) actions.updateListItem(blockId, item.id, { level: item.level - 1 })
      } else {
        if (item.level < 4) actions.updateListItem(blockId, item.id, { level: item.level + 1 })
      }
    }

    if (e.key === 'Backspace' && item.content === '') {
      e.preventDefault()
      actions.deleteListItem(blockId, item.id)
      // Focus previous item
      setTimeout(() => {
        const allItems = document.querySelectorAll(`[data-block="${blockId}"] textarea`)
        const idx = Array.from(allItems).findIndex(el => el === inputRef.current)
        if (idx > 0) allItems[idx - 1].focus()
      }, 50)
    }
  }, [blockId, actions])

  return (
    <div data-block={blockId} className="space-y-0.5">
      {numbered.map(({ item, prefix }) => (
        <ListItem
          key={item.id}
          blockId={blockId}
          item={item}
          prefix={prefix}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
        />
      ))}

      {/* Add item button */}
      <button
        onClick={() => actions.addListItem(blockId, null, 1)}
        className="mt-2 flex items-center gap-2 text-xs font-sans text-ink-muted hover:text-ink
                   hover:bg-parchment px-3 py-1.5 rounded-lg transition-all w-full text-left group"
      >
        <span className="w-4 h-4 rounded border border-dashed border-ink-muted/40 group-hover:border-ink/50
                         flex items-center justify-center flex-shrink-0 text-[10px] transition-colors">
          +
        </span>
        新增項目
      </button>

      {/* Level hint */}
      {items.length === 0 && (
        <p className="text-xs text-ink-muted/50 font-sans px-2 py-1">
          按上方按鈕新增項目，或直接點擊「新增項目」。
          使用 <kbd className="px-1 bg-parchment-dark rounded text-[10px]">Tab</kbd> / <kbd className="px-1 bg-parchment-dark rounded text-[10px]">Shift+Tab</kbd> 調整縮排層級。
        </p>
      )}
    </div>
  )
}
