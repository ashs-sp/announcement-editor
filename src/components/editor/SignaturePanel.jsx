import { useDocument, useOrg } from '../../context/DocumentContext'

export default function SignaturePanel() {
  const { state, actions } = useDocument()
  const org = useOrg()
  const { signature } = state.document

  return (
    <div className="space-y-4">
      {/* Title selector */}
      <div>
        <label className="block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5">
          首長職銜
        </label>
        <select
          value={signature.title}
          onChange={e => actions.updateSignature({ title: e.target.value })}
          className="w-full text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
                     focus:outline-none focus:ring-2 focus:ring-vermillion/20 focus:border-vermillion/50 transition-all"
        >
          {(org?.leaders || []).map(leader => (
            <option key={leader.title} value={leader.title}>
              {leader.title}
            </option>
          ))}
        </select>
      </div>

      {/* Signature mode */}
      <div>
        <label className="block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-2">
          署名方式
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => actions.updateSignature({ mode: 'title-only' })}
            className={`p-3 rounded-lg border text-left transition-all ${
              signature.mode === 'title-only'
                ? 'border-ink bg-ink text-white'
                : 'border-border bg-surface text-ink hover:border-ink/30'
            }`}
          >
            <div className="text-xs font-sans font-semibold mb-1">
              僅職銜
            </div>
            <div className="text-[11px] font-sans opacity-70">
              留空供手動簽名
            </div>
          </button>
          <button
            onClick={() => actions.updateSignature({ mode: 'with-name' })}
            className={`p-3 rounded-lg border text-left transition-all ${
              signature.mode === 'with-name'
                ? 'border-ink bg-ink text-white'
                : 'border-border bg-surface text-ink hover:border-ink/30'
            }`}
          >
            <div className="text-xs font-sans font-semibold mb-1">
              職銜 + 姓名
            </div>
            <div className="text-[11px] font-sans opacity-70">
              直接列印姓名
            </div>
          </button>
        </div>
      </div>

      {/* Name input (if with-name mode) */}
      {signature.mode === 'with-name' && (
        <div>
          <label className="block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5">
            首長姓名
          </label>
          <input
            type="text"
            value={signature.name}
            onChange={e => actions.updateSignature({ name: e.target.value })}
            placeholder="請輸入姓名"
            className="w-full text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
                       placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-vermillion/20
                       focus:border-vermillion/50 transition-all"
          />
        </div>
      )}

      {/* Preview */}
      <div className="bg-parchment rounded-lg px-4 py-3 border border-border/60">
        <p className="text-[10px] text-ink-muted font-sans uppercase tracking-wide mb-2">預覽</p>
        <div className="text-right text-sm font-serif text-ink">
          <div>{org?.name}</div>
          <div className="mt-1">
            <span>{signature.title}</span>
            {signature.mode === 'with-name' && signature.name && (
              <span className="ml-2">{signature.name}</span>
            )}
            {signature.mode === 'title-only' && (
              <span className="ml-3 inline-block w-12 border-b border-dashed border-ink-muted/50 align-bottom" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
