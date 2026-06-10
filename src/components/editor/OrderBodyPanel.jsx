import { useDocument } from '../../context/DocumentContext'
import { buildOrderBody } from '../preview/OrderPreview'

const inputCls = `
  w-full text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
  placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-vermillion/20
  focus:border-vermillion/50 transition-all
`.trim()

const labelCls = 'block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5'

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-vermillion' : 'bg-border'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4.5' : 'translate-x-0.5'
      }`} />
    </button>
  )
}

export default function OrderBodyPanel() {
  const { state, actions } = useDocument()
  const { order } = state.document
  const {
    regulationName, doDelete, doEnact, doAmend,
    deleteArticles, enactArticles, amendArticles,
    signatureTitle, signatureName,
  } = order

  const previewBody = buildOrderBody(order)

  return (
    <div className="space-y-5">
      {/* 法規名稱 */}
      <div>
        <label className={labelCls}>法規名稱</label>
        <input
          type="text"
          value={regulationName}
          onChange={e => actions.updateOrder({ regulationName: e.target.value })}
          placeholder="如：國立高雄師範大學附屬高級中學學生會組織規程"
          className={inputCls}
        />
        <p className="text-[11px] text-ink-muted mt-1 font-sans">
          將以《》包裹顯示
        </p>
      </div>

      {/* 動作組合 */}
      <div>
        <label className={labelCls}>動作（可複選，依刪除→制定→修正順序排列）</label>
        <div className="space-y-3">

          {/* 刪除 */}
          <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm font-sans font-medium text-ink">刪除條文</span>
              <Toggle
                checked={doDelete}
                onChange={v => actions.updateOrder({ doDelete: v })}
              />
            </label>
            {doDelete && (
              <div>
                <label className={`${labelCls} mt-2`}>刪除的條文</label>
                <input
                  type="text"
                  value={deleteArticles}
                  onChange={e => actions.updateOrder({ deleteArticles: e.target.value })}
                  placeholder="如：1、5至8、10之1"
                  className={inputCls}
                />
                <p className="text-[11px] text-ink-muted mt-1 font-sans">
                  輸入條號，系統自動補上「第 … 條條文」
                </p>
              </div>
            )}
          </div>

          {/* 制定 */}
          <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm font-sans font-medium text-ink">制定條文</span>
              <Toggle
                checked={doEnact}
                onChange={v => actions.updateOrder({ doEnact: v })}
              />
            </label>
            {doEnact && (
              <div>
                <label className={`${labelCls} mt-2`}>制定的條文</label>
                <input
                  type="text"
                  value={enactArticles}
                  onChange={e => actions.updateOrder({ enactArticles: e.target.value })}
                  placeholder="如：3之1至3之3"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* 修正 */}
          <div className="rounded-lg border border-border bg-surface/50 p-3 space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm font-sans font-medium text-ink">修正條文</span>
              <Toggle
                checked={doAmend}
                onChange={v => actions.updateOrder({ doAmend: v })}
              />
            </label>
            {doAmend && (
              <div>
                <label className={`${labelCls} mt-2`}>修正的條文</label>
                <input
                  type="text"
                  value={amendArticles}
                  onChange={e => actions.updateOrder({ amendArticles: e.target.value })}
                  placeholder="如：16、17之4至17之6"
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 預覽公告段落 */}
      {(doDelete || doEnact || doAmend) && (
        <div className="rounded-lg border border-border bg-parchment p-3">
          <p className="text-[11px] text-ink-muted mb-1 font-sans uppercase tracking-wide">公告段落預覽</p>
          <p className="text-sm font-serif text-ink leading-relaxed">{previewBody}</p>
        </div>
      )}

      {/* 署名 */}
      <div className="space-y-3 pt-2 border-t border-border">
        <p className={labelCls}>署名</p>
        <div>
          <label className={`${labelCls}`}>職銜</label>
          <input
            type="text"
            value={signatureTitle}
            onChange={e => actions.updateOrder({ signatureTitle: e.target.value })}
            placeholder="如：學生會會長"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>姓名（選填）</label>
          <input
            type="text"
            value={signatureName}
            onChange={e => actions.updateOrder({ signatureName: e.target.value })}
            placeholder="如：王小明"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  )
}
