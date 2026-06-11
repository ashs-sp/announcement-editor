import { useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useDocument } from '../../context/DocumentContext'

const inputCls = `
  w-full text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
  placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-vermillion/20
  focus:border-vermillion/50 transition-all
`.trim()

const labelCls = 'block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5'

const INDENT_HELP = `縮排規則：
• 條號、括號開頭（全/半形）→ 不縮排
• 數字+空格開頭 → 整體縮排 4字元、首行凸排 2字元
• (數字) 開頭 → 整體縮排 6字元、首行凸排 2字元
• 其餘 → 首行縮排 2字元
行內 LaTeX：以 $公式$ 包裹`

export default function OrderAppendixPanel() {
  const { state, actions } = useDocument()
  const { order } = state.document
  const { appendixEnabled, appendixEntries, images } = order
  const fileInputRef = useRef(null)

  function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        actions.addOrderImage({
          id: uuidv4(),
          name: file.name,
          dataUrl: ev.target.result,
        })
      }
      reader.readAsDataURL(file)
    })
    // reset so same file can be re-added
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      {/* 啟用開關 */}
      <div>
        <label className="flex items-center justify-between">
          <span className="text-sm font-sans font-medium text-ink">啟用法規附件</span>
          <button
            type="button"
            onClick={() => actions.updateOrder({ appendixEnabled: !appendixEnabled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              appendixEnabled ? 'bg-vermillion' : 'bg-border'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              appendixEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
            }`} />
          </button>
        </label>
      </div>

      {appendixEnabled && (
        <>
          {/* 附件條目 */}
          <div className="space-y-4">
            {appendixEntries.map((entry, idx) => (
              <div key={entry.id} className="rounded-lg border border-border bg-surface/50 p-3 space-y-3">
                {/* 標題列 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-semibold text-ink-muted uppercase tracking-wide">
                    附件 {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => actions.deleteAppendixEntry(entry.id)}
                    className="text-ink-muted hover:text-vermillion transition-colors"
                    title="刪除此附件"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5.5 3.5V2h3v1.5M6 6v4M8 6v4M3 3.5l.7 8h6.6l.7-8"
                        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* 範圍類型 */}
                <div>
                  <label className={labelCls}>類型</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'title', label: '法規標題' },
                      // { value: 'articles', label: '條文參照' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={entry.scopeType === opt.value}
                          onChange={() => actions.updateAppendixEntry(entry.id, { scopeType: opt.value })}
                          className="accent-vermillion"
                        />
                        <span className="text-xs font-sans text-ink">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 標題欄位 */}
                {entry.scopeType === 'title' && (
                  <div>
                    <label className={labelCls}>法規標題</label>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={e => actions.updateAppendixEntry(entry.id, { title: e.target.value })}
                      placeholder="輸入法規名稱（不含《》）"
                      className={inputCls}
                    />
                  </div>
                )}

                {/* 條文參照 */}
                <div>
                  <label className={labelCls}>
                    {entry.scopeType === 'title' ? '條文號（選填，顯示於標題後）' : '條文號'}
                  </label>
                  <input
                    type="text"
                    value={entry.articlesRef}
                    onChange={e => actions.updateAppendixEntry(entry.id, { articlesRef: e.target.value })}
                    placeholder="如：第 1 條、第 5 條至第 8 條"
                    className={inputCls}
                  />
                </div>

                {/* 條文內容 */}
                <div>
                  <label className={labelCls}>條文內容</label>
                  <textarea
                    value={entry.content}
                    onChange={e => actions.updateAppendixEntry(entry.id, { content: e.target.value })}
                    placeholder={`逐行輸入條文，${INDENT_HELP}`}
                    rows={8}
                    className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
                    style={{ whiteSpace: 'pre' }}
                  />
                  <details className="mt-1">
                    <summary className="text-[11px] text-ink-muted cursor-pointer font-sans select-none">
                      縮排規則說明
                    </summary>
                    <pre className="text-[11px] text-ink-muted mt-1 whitespace-pre-wrap font-sans leading-relaxed">
                      {INDENT_HELP}
                    </pre>
                  </details>
                </div>
              </div>
            ))}

            {/* 新增附件按鈕 */}
            <button
              type="button"
              onClick={actions.addAppendixEntry}
              className="w-full py-2.5 rounded-lg border border-dashed border-border text-xs font-sans
                         text-ink-muted hover:text-ink hover:border-ink-muted transition-colors
                         flex items-center justify-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              新增附件條目
            </button>
          </div>

          {/* 附圖 */}
          <div className="pt-2 border-t border-border space-y-3">
            <label className={labelCls}>附圖（每頁一張，按順序排列）</label>

            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div key={img.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 p-2">
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-sans text-ink truncate">
                        圖 {idx + 1}：{img.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => actions.deleteOrderImage(img.id)}
                      className="text-ink-muted hover:text-vermillion transition-colors flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5.5 3.5V2h3v1.5M6 6v4M8 6v4M3 3.5l.7 8h6.6l.7-8"
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-lg border border-dashed border-border text-xs font-sans
                         text-ink-muted hover:text-ink hover:border-ink-muted transition-colors
                         flex items-center justify-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v6M6 1L4 3M6 1L8 3M1 9.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              上傳圖片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </>
      )}
    </div>
  )
}
