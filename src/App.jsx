import { useEffect } from 'react'
import { DocumentProvider, useDocument } from './context/DocumentContext'
import OrgSelector from './components/steps/OrgSelector'
import TemplateSelector from './components/steps/TemplateSelector'
import DocumentEditor from './components/steps/DocumentEditor'

function AppInner() {
  const { state, actions } = useDocument()

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}data/organizations.json`).then(r => r.json()),
      fetch(`${base}data/templates.json`).then(r => r.json()),
    ]).then(([orgs, templates]) => {
      actions.setOrganizations(orgs)
      actions.setTemplates(templates)
    }).catch(err => {
      console.error('Failed to load data:', err)
    })
  }, [])

  return (
    <div className="min-h-screen bg-parchment">
      {/* Top bar */}
      <header className="bg-ink border-b border-ink-light/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-vermillion rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold font-serif leading-none">公</span>
            </div>
            <span className="text-white font-sans text-sm font-medium tracking-wide">
              公告文件編輯系統
            </span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {['選擇機關', '選擇範本', '編輯文件'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`step-dot ${i === state.step ? 'active' : i < state.step ? 'done' : ''}`} />
                <span className={`text-xs font-sans hidden sm:block transition-colors ${
                  i === state.step ? 'text-white' :
                  i < state.step ? 'text-gold' : 'text-ink-muted'
                }`}>
                  {label}
                </span>
                {i < 2 && <div className="w-4 h-px bg-ink-light/30 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {state.step === 0 && <OrgSelector />}
        {state.step === 1 && <TemplateSelector />}
        {state.step === 2 && <DocumentEditor />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <DocumentProvider>
      <AppInner />
    </DocumentProvider>
  )
}
