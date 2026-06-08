import { useState, useRef } from 'react'
import { useDocument, useOrg, useTemplate } from '../../context/DocumentContext'
import MetaPanel from '../editor/MetaPanel'
import BlockEditor from '../editor/BlockEditor'
import SignaturePanel from '../editor/SignaturePanel'
import RecipientsPanel from '../editor/RecipientsPanel'
import DocumentPreview from '../preview/DocumentPreview'
import ExportDialog from '../export/ExportDialog'

function SectionAccordion({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface rounded-xl border border-border shadow-paper overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-parchment/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-ink-muted">{icon}</span>
          <span className="text-sm font-sans font-semibold text-ink">{title}</span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/60">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

export default function DocumentEditor() {
  const { state, actions } = useDocument()
  const org = useOrg()
  const template = useTemplate()
  const previewRef = useRef(null)
  const [showExport, setShowExport] = useState(false)
  const [previewScale, setPreviewScale] = useState(1)

  const { blocks, options } = state.document

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left panel: editor */}
      <div className="w-[440px] flex-shrink-0 flex flex-col border-r border-border bg-parchment overflow-hidden">
        {/* Editor header */}
        <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={actions.goBack}
              className="text-ink-muted hover:text-ink transition-colors"
              title="返回"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <div className="text-sm font-sans font-semibold text-ink">
                {org?.shortName} · {template?.name}
              </div>
              <div className="text-[11px] text-ink-muted font-sans">
                正在編輯
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-ink text-white text-xs font-sans rounded-lg
                       hover:bg-ink-light transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v6M6 7L4 5M6 7L8 5M1 9.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            匯出
          </button>
        </div>

        {/* Scrollable editor content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {/* Meta info */}
          <SectionAccordion
            title="基本資訊"
            defaultOpen
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 5V7M7 9H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
          >
            <MetaPanel />
          </SectionAccordion>

          {/* Recipients (for 函文 only) */}
          {template?.hasRecipients && (
            <SectionAccordion
              title="受文者"
              defaultOpen
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 11.5C1 9.567 3.686 8 7 8s6 1.567 6 3.5M7 6a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            >
              <RecipientsPanel />
            </SectionAccordion>
          )}

          {/* Content blocks */}
          <div className="space-y-3">
            <p className="text-[11px] font-sans font-medium text-ink-muted uppercase tracking-wider px-1">
              內文區塊
            </p>
            {blocks.map((block) => (
              <BlockEditor key={block.id} block={block} />
            ))}
          </div>

          {/* Signature */}
          <SectionAccordion
            title="署名設定"
            defaultOpen
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10L5.5 9L11 3.5a1.5 1.5 0 00-2-2L3 7l-1 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          >
            <SignaturePanel />
          </SectionAccordion>

          {/* Options */}
          <SectionAccordion
            title="文件選項"
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v1M7 11v1M2 7H1M13 7h-1M3.757 3.757l-.707-.707M10.95 10.95l-.707-.707M10.95 3.757l.707-.707M3.05 10.95l.707-.707" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            }
          >
            <div className="space-y-3 my-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-sans text-ink">加上騎縫章</span>
                <button
                  onClick={() => actions.updateOptions({ addStamp: !options.addStamp })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    options.addStamp ? 'bg-vermillion' : 'bg-border'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    options.addStamp ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-sans text-ink">顯示「未蓋印信無效」字樣</span>
                <button
                  onClick={() => actions.updateOptions({ addSealArea: !options.addSealArea })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    options.addSealArea ? 'bg-vermillion' : 'bg-border'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    options.addSealArea ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
          </SectionAccordion>

          {/* Spacer */}
          <div className="h-4" />
        </div>
      </div>

      {/* Right panel: preview */}
      <div className="flex-1 bg-parchment-dark flex flex-col overflow-hidden">
        {/* Preview toolbar */}
        <div className="px-4 py-2.5 border-b border-border bg-parchment flex items-center justify-between">
          <span className="text-xs font-sans text-ink-muted">文件預覽</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))}
              className="w-6 h-6 rounded bg-surface border border-border text-ink-muted hover:text-ink
                         flex items-center justify-center text-sm transition-all"
            >
              −
            </button>
            <span className="text-xs font-mono text-ink-muted w-10 text-center">
              {Math.round(previewScale * 100)}%
            </span>
            <button
              onClick={() => setPreviewScale(s => Math.min(1, s + 0.1))}
              className="w-6 h-6 rounded bg-surface border border-border text-ink-muted hover:text-ink
                         flex items-center justify-center text-sm transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-8">
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
          >
            <DocumentPreview
              ref={previewRef}
              showStamp={options.addStamp}
              showSealArea={options.addSealArea}
            />
          </div>
        </div>
      </div>

      {/* Export dialog */}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  )
}
