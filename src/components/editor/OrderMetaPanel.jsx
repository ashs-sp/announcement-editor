import { useDocument } from '../../context/DocumentContext'
import { isoToROC } from '../../utils/dateUtils'

const inputCls = `
  w-full text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
  placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-vermillion/20
  focus:border-vermillion/50 transition-all
`.trim()

const labelCls = 'block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5'

export default function OrderMetaPanel() {
  const { state, actions } = useDocument()
  const { meta, order } = state.document
  const { sessionNumber, orderNumber } = order

  return (
    <div className="space-y-5">
      {/* 日期 */}
      <div>
        <label className={labelCls}>日期</label>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={meta.date}
            onChange={e => actions.updateMeta({ date: e.target.value })}
            className="text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
                       focus:outline-none focus:ring-2 focus:ring-vermillion/20 focus:border-vermillion/50
                       transition-all"
          />
          <span className="text-xs text-ink-muted font-sans">
            {isoToROC(meta.date)}
          </span>
        </div>
      </div>

      {/* 屆次 */}
      <div>
        <label className={labelCls}>屆次（國字大寫）</label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-sans text-ink-muted flex-shrink-0">（</span>
          <input
            type="text"
            value={sessionNumber}
            onChange={e => actions.updateOrder({ sessionNumber: e.target.value })}
            placeholder="如：玖、拾、拾壹"
            className={inputCls}
          />
          <span className="text-sm font-sans text-ink-muted flex-shrink-0">）令字第</span>
        </div>
        <p className="text-[11px] text-ink-muted mt-1 font-sans">
          預覽：（{sessionNumber || '○○'}）令字第 {orderNumber || 'XXXXXXX'} 號
        </p>
      </div>

      {/* 令字號碼 */}
      <div>
        <label className={labelCls}>令字號碼</label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-sans text-ink-muted flex-shrink-0">第</span>
          <input
            type="text"
            value={orderNumber}
            onChange={e => actions.updateOrder({ orderNumber: e.target.value })}
            placeholder="如：1140001"
            className={inputCls}
          />
          <span className="text-sm font-sans text-ink-muted flex-shrink-0">號</span>
        </div>
      </div>
    </div>
  )
}
