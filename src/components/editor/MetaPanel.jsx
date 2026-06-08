import { useDocument, useOrg } from '../../context/DocumentContext'
import { isoToROC } from '../../utils/dateUtils'

export default function MetaPanel() {
  const { state, actions } = useDocument()
  const org = useOrg()
  const { meta } = state.document

  return (
    <div className="space-y-5">
      {/* Date */}
      <div>
        <label className="block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5">
          發文日期
        </label>
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

      {/* Document number */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-sans font-medium text-ink-muted uppercase tracking-wide">
            發文字號
          </label>
          <button
            onClick={() => actions.updateDocNumber({ enabled: !meta.docNumber.enabled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              meta.docNumber.enabled ? 'bg-vermillion' : 'bg-border'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              meta.docNumber.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {meta.docNumber.enabled && (
          <div className="flex items-center gap-2">
            {/* Prefix selector */}
            <select
              value={meta.docNumber.prefix}
              onChange={e => actions.updateDocNumber({ prefix: e.target.value })}
              className="text-sm font-sans border border-border rounded-lg px-2 py-2 bg-surface text-ink
                         focus:outline-none focus:ring-2 focus:ring-vermillion/20 focus:border-vermillion/50
                         transition-all flex-shrink-0"
            >
              {(org?.docNumberPrefixes || []).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="text"
              value={meta.docNumber.number}
              onChange={e => actions.updateDocNumber({ number: e.target.value })}
              placeholder="第 0001 號"
              className="flex-1 text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
                         placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-vermillion/20
                         focus:border-vermillion/50 transition-all"
            />
          </div>
        )}
      </div>

      {/* Attachment */}
      <div>
        <label className="block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5">
          附件
        </label>
        <input
          type="text"
          value={meta.attachment}
          onChange={e => actions.updateMeta({ attachment: e.target.value })}
          placeholder="如：如文 / 無"
          className="w-full text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
                     placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-vermillion/20
                     focus:border-vermillion/50 transition-all"
        />
      </div>
    </div>
  )
}
