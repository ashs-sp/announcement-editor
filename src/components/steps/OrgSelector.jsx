import { useDocument } from '../../context/DocumentContext'

const ORG_COLORS = {
  student_council: { bg: '#EEF3FF', accent: '#3B6FCA', icon: '🎓' },
  student_parliament: { bg: '#FFF5EE', accent: '#C47A35', icon: '⚖️' },
  election_commission: { bg: '#F0FFF4', accent: '#2D7A4F', icon: '🗳️' },
  admin_center: { bg: '#F5F0FF', accent: '#6B4FA0', icon: '🏛️' },
}

export default function OrgSelector() {
  const { state, actions } = useDocument()

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-14">
        <p className="text-xs font-mono text-ink-muted uppercase tracking-[0.2em] mb-4">
          Step 01
        </p>
        <h1 className="text-3xl font-serif font-semibold text-ink mb-3">
          選擇發文機關
        </h1>
        <p className="text-ink-muted text-sm font-sans">
          請選擇要發布此份公告文件的機關單位
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.organizations.map((org) => {
          const style = ORG_COLORS[org.id] || { bg: '#F5F5F5', accent: '#666', icon: '📋' }
          return (
            <button
              key={org.id}
              onClick={() => actions.selectOrg(org.id)}
              className="group relative text-left p-6 bg-surface rounded-xl border border-border shadow-paper
                         hover:shadow-lift hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-200 cursor-pointer"
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ background: style.accent }}
              />

              <div className="flex items-start gap-4 mt-1">
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: style.bg }}
                >
                  {style.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-semibold text-ink text-base mb-0.5">
                    {org.shortName}
                  </div>
                  <div className="text-ink-muted text-xs font-sans leading-relaxed line-clamp-2">
                    {org.name}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {(org.leaders || []).slice(0, 3).map((leader, i) => (
                      <span
                        key={i}
                        className="inline-block text-[10px] px-2 py-0.5 rounded-full font-sans"
                        style={{ background: style.bg, color: style.accent }}
                      >
                        {leader.title}
                      </span>
                    ))}
                    {(org.leaders || []).length > 3 && (
                      <span className="text-[10px] text-ink-muted font-sans">
                        +{org.leaders.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-ink-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all mt-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs text-ink-muted font-sans mt-10">
        機關資訊可在 <code className="bg-parchment-dark px-1.5 py-0.5 rounded font-mono text-[11px]">public/data/organizations.json</code> 中維護與新增
      </p>
    </div>
  )
}
