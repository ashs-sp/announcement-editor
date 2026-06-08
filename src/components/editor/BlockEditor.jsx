import { useDocument } from '../../context/DocumentContext'
import NumberedList from './NumberedList'

export default function BlockEditor({ block }) {
  const { actions } = useDocument()

  return (
    <div className={`rounded-xl border transition-all ${
      block._enabled
        ? 'bg-surface border-border shadow-paper'
        : 'bg-parchment/50 border-border/50 opacity-60'
    }`}>
      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          {/* Drag handle for block */}
          <div className="drag-handle text-ink-muted/30 hover:text-ink-muted cursor-grab transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="5" cy="4" r="1.2"/>
              <circle cx="9" cy="4" r="1.2"/>
              <circle cx="5" cy="7" r="1.2"/>
              <circle cx="9" cy="7" r="1.2"/>
              <circle cx="5" cy="10" r="1.2"/>
              <circle cx="9" cy="10" r="1.2"/>
            </svg>
          </div>

          <span className="text-sm font-serif font-semibold text-ink">
            {block.label}
          </span>

          {block.required && (
            <span className="text-[10px] bg-vermillion-bg text-vermillion px-1.5 py-0.5 rounded font-sans">
              必填
            </span>
          )}
        </div>

        {/* Toggle enabled */}
        {!block.required && (
          <button
            onClick={() => actions.toggleBlock(block.id)}
            className={`text-xs font-sans px-2.5 py-1 rounded-full border transition-all ${
              block._enabled
                ? 'border-border text-ink-muted hover:text-ink hover:border-ink/30'
                : 'border-dashed border-border/60 text-ink-muted/50'
            }`}
          >
            {block._enabled ? '隱藏此區塊' : '顯示此區塊'}
          </button>
        )}
      </div>

      {/* Block content */}
      {block._enabled && (
        <div className="p-4">
          {block.type === 'text' ? (
            <textarea
              value={block.content || ''}
              onChange={e => actions.updateBlockContent(block.id, e.target.value)}
              placeholder={block.placeholder || '請輸入內容...'}
              rows={3}
              className="w-full text-sm font-serif text-ink bg-transparent border-none outline-none resize-none
                         leading-loose placeholder-ink-muted/30"
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
          ) : block.type === 'numbered-list' ? (
            <NumberedList blockId={block.id} />
          ) : null}
        </div>
      )}
    </div>
  )
}
