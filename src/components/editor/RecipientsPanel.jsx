import { useState } from 'react'
import { useDocument } from '../../context/DocumentContext'

function TagInput({ label, values, onChange, placeholder }) {
  const [inputVal, setInputVal] = useState('')

  const addTag = () => {
    const trimmed = inputVal.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setInputVal('')
  }

  const removeTag = (i) => {
    onChange(values.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <label className="block text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 text-xs font-sans px-2.5 py-1
                       bg-ink text-white rounded-full"
          >
            {v}
            <button
              onClick={() => removeTag(i)}
              className="hover:text-white/60 transition-colors ml-0.5"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addTag() }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm font-sans border border-border rounded-lg px-3 py-2 bg-surface text-ink
                     placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-vermillion/20
                     focus:border-vermillion/50 transition-all"
        />
        <button
          onClick={addTag}
          className="px-3 py-2 bg-ink text-white text-sm font-sans rounded-lg hover:bg-ink-light transition-colors"
        >
          新增
        </button>
      </div>
    </div>
  )
}

export default function RecipientsPanel() {
  const { state, actions } = useDocument()
  const { recipients } = state.document

  return (
    <div className="space-y-5">
      <TagInput
        label="正本受文者"
        values={recipients.primary || []}
        onChange={vals => actions.updateRecipients({ primary: vals })}
        placeholder="輸入機關名稱，按 Enter 新增"
      />
      <TagInput
        label="副本抄送"
        values={recipients.secondary || []}
        onChange={vals => actions.updateRecipients({ secondary: vals })}
        placeholder="輸入機關名稱，按 Enter 新增"
      />
      {(recipients.primary?.length > 1 || recipients.secondary?.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs font-sans text-amber-700">
          <strong>提醒：</strong>匯出 PDF 時，系統將依正本受文者數量分別匯出獨立的 PDF 檔案。
        </div>
      )}
    </div>
  )
}
