import { useDocument, useOrg } from '../../context/DocumentContext'

const TEMPLATE_ICONS = {
  announcement: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5.882V19.24a1.76 1.76 0 0 1-3.417.592l-2.147-6.15M18 13a3 3 0 0 0 0-6M5.436 13.683A4.001 4.001 0 0 0 7 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 0 1-1.564-.317z"/>
    </svg>
  ),
  letter: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
    </svg>
  ),
  notice: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
    </svg>
  ),
  resolution: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
    </svg>
  ),
}

export default function TemplateSelector() {
  const { state, actions } = useDocument()
  const org = useOrg()

  const availableTemplates = state.templates.filter(
    t => !org || (org.templateIds || []).includes(t.id)
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Back button */}
      <button
        onClick={actions.goBack}
        className="flex items-center gap-2 text-ink-muted hover:text-ink text-sm font-sans mb-10 transition-colors group"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
          <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        返回選擇機關
      </button>

      {/* Hero */}
      <div className="text-center mb-14">
        <p className="text-xs font-mono text-ink-muted uppercase tracking-[0.2em] mb-4">
          Step 02
        </p>
        <h1 className="text-3xl font-serif font-semibold text-ink mb-2">
          選擇公告範本
        </h1>
        {org && (
          <p className="text-ink-muted text-sm font-sans">
            <span className="text-vermillion font-medium">{org.shortName}</span>
            　可用的公告文件類型
          </p>
        )}
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => actions.selectTemplate(template.id)}
            className="group text-left p-6 bg-surface rounded-xl border border-border shadow-paper
                       hover:shadow-lift hover:border-ink/20 hover:-translate-y-0.5 active:translate-y-0
                       transition-all duration-200"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-lg bg-parchment text-ink-muted group-hover:bg-ink group-hover:text-white flex items-center justify-center transition-all duration-200 flex-shrink-0">
                {TEMPLATE_ICONS[template.id] || TEMPLATE_ICONS.announcement}
              </div>
              <div>
                <div className="font-sans font-semibold text-ink text-lg">
                  {template.name}
                </div>
                {template.hasRecipients && (
                  <span className="text-[10px] bg-vermillion-bg text-vermillion px-1.5 py-0.5 rounded font-sans font-medium">
                    需填受文者
                  </span>
                )}
              </div>
            </div>

            <p className="text-ink-muted text-sm font-sans mb-4">
              {template.description}
            </p>

            {/* Block preview */}
            <div className="flex flex-wrap gap-1.5">
              {template.blocks.map((block) => (
                <span
                  key={block.id}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-parchment text-ink-muted font-sans"
                >
                  {block.required && (
                    <span className="w-1 h-1 rounded-full bg-vermillion flex-shrink-0" />
                  )}
                  {block.label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-ink-muted font-sans mt-10">
        範本可在 <code className="bg-parchment-dark px-1.5 py-0.5 rounded font-mono text-[11px]">public/data/templates.json</code> 中維護與新增
      </p>
    </div>
  )
}
