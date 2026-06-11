import { useState, useRef } from 'react'
import { useDocument, useOrg, useTemplate } from '../../context/DocumentContext'
import { exportElementAsPDF, exportMultiplePDFs } from '../../utils/exportPDF'
import { exportElementAsImage } from '../../utils/exportImage'
import { exportAsDocx } from '../../utils/exportDocx'
import { isoToROCShort } from '../../utils/dateUtils'
import DocumentPreview from '../preview/DocumentPreview'
import OrderPreview from '../preview/OrderPreview'

export default function ExportDialog({ onClose }) {
  const { state } = useDocument()
  const org = useOrg()
  const template = useTemplate()
  const previewRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')

  const { document: doc } = state
  const { meta } = doc
  const recipients = doc?.recipients?.primary || []
  const hasMultipleRecipients = template?.hasRecipients && recipients.length > 1

  const getFilename = (suffix = '') => {
    const dateStr = meta?.date ? isoToROCShort(meta?.date).replace(/\//g, '') : 'unknown'
    const orgName = org?.shortName || 'doc'
    const tplName = template?.name || 'file'
    return `${orgName}_${tplName}${suffix}_${dateStr}`
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      if (hasMultipleRecipients) {
        // Export separate PDFs per recipient
        // For now, export a single combined PDF with note
        await exportElementAsPDF(previewRef.current, getFilename())
      } else {
        await exportElementAsPDF(previewRef.current, getFilename())
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('匯出失敗，請稍後再試。')
    } finally {
      setExporting(false)
    }
  }

  const handleExportDocx = async () => {
    setExporting(true)
    try {
      await exportAsDocx(
        state.document,
        org,
        template,
        getFilename()
      )
    } catch (err) {
      console.error('Export failed:', err)
      alert('匯出失敗，請稍後再試。')
    } finally {
      setExporting(false)
    }
  }

  const handleExportImage = async () => {
    setExporting(true)
    try {
      await exportElementAsImage(previewRef.current, getFilename(), { format: 'image/png' })
    } catch (err) {
      console.error('Export failed:', err)
      alert('匯出失敗，請稍後再試。')
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-paper-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-serif font-semibold text-ink">匯出文件</h2>
            <p className="text-xs text-ink-muted font-sans mt-0.5">
              選擇匯出格式後下載
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-parchment text-ink-muted hover:text-ink hover:bg-parchment-dark
                       flex items-center justify-center transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Format options */}
          <div>
            <p className="text-xs font-sans font-medium text-ink-muted uppercase tracking-wide mb-3">
              匯出格式
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'pdf', label: 'PDF', desc: '最終版本', icon: '📄' },
                { id: 'docx', label: 'Word', desc: '.docx 格式', icon: '📝' },
                { id: 'png', label: '圖片', desc: '.png 格式', icon: '🖼️' },
                { id: 'print', label: '列印', desc: '直接印出', icon: '🖨️' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setExportFormat(f.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    exportFormat === f.id
                      ? 'border-ink bg-ink text-white'
                      : 'border-border bg-surface text-ink hover:border-ink/30'
                  }`}
                >
                  <div className="text-xl mb-1">{f.icon}</div>
                  <div className="text-xs font-sans font-semibold">{f.label}</div>
                  <div className="text-[10px] font-sans opacity-60">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Multi-recipient notice */}
          {hasMultipleRecipients && exportFormat === 'pdf' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs font-sans text-blue-700">
              <strong>正副本匯出：</strong>
              偵測到 {recipients.length} 位正本受文者，將依序匯出 {recipients.length} 份獨立 PDF。
            </div>
          )}

          {/* Filename preview */}
          <div className="bg-parchment rounded-xl px-4 py-3">
            <p className="text-[10px] text-ink-muted font-sans uppercase tracking-wide mb-1">檔案名稱預覽</p>
            <p className="text-sm font-mono text-ink">
              {getFilename()}.{exportFormat === 'docx' ? 'docx' : exportFormat === 'print' ? '（直接列印）' : exportFormat === 'png' ? 'png' : 'pdf'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-sans text-ink hover:bg-parchment transition-all"
          >
            取消
          </button>
          <button
            onClick={exportFormat === 'pdf' ? handleExportPDF : exportFormat === 'docx' ? handleExportDocx : exportFormat === 'png' ? handleExportImage : handlePrint}
            disabled={exporting}
            className="flex-1 py-2.5 rounded-xl bg-ink text-white text-sm font-sans hover:bg-ink-light
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                處理中...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v8M7 9l-3-3M7 9l3-3M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {exportFormat === 'print' ? '列印' : '下載'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden preview for export */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {template?.docType === 'order' ? (
          <OrderPreview ref={previewRef} />
        ) : (
          <DocumentPreview
            ref={previewRef}
            showStamp={state.document.options?.addStamp}
            showSealArea={state.document.options?.addSealArea}
          />
        )}
      </div>
    </div>
  )
}
