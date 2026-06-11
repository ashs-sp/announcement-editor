import { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react'
import { useDocument, useOrg } from '../../context/DocumentContext'
import { isoToROC } from '../../utils/dateUtils'

// ── 公告段落文字生成 ─────────────────────────────────────────────────────────
export function buildOrderBody(order) {
  const { regulationName, doDelete, doEnact, doAmend,
    deleteArticles, enactArticles, amendArticles } = order

  const regName = regulationName || '（法規名稱）'
  const actions = []

  if (doDelete) actions.push({ verb: '刪除', arts: deleteArticles || '（條文）' })
  if (doEnact) actions.push({ verb: '制定', arts: enactArticles || '（條文）' })
  if (doAmend) actions.push({ verb: '修正', arts: amendArticles || '（條文）' })

  if (actions.length === 0) return `茲（請選擇動作）《${regName}》，公布之。`

  // 第一個動作帶法規名稱
  const first = actions[0]
  if (actions.length === 1) {
    return `茲${first.verb}《${regName}》第 ${first.arts} 條條文，公布之。`
  }
  if (actions.length === 2) {
    return `茲${first.verb}《${regName}》第 ${first.arts} 條條文；並${actions[1].verb}第 ${actions[1].arts} 條條文，公布之。`
  }
  // 三個動作
  return (
    `茲${first.verb}《${regName}》第 ${first.arts} 條條文；` +
    `${actions[1].verb}第 ${actions[1].arts} 條條文；` +
    `並${actions[2].verb}第 ${actions[2].arts} 條條文，公布之。`
  )
}

// ── 條文縮排規則 ─────────────────────────────────────────────────────────────
// 格式：14pt，justify，支援行內 LaTeX（以 $ 包裹）

const EM = 14 // 14pt = 1em base

// 將行內 LaTeX $...$ 轉為 <span> 佔位（preview 用純文字略過）
function renderLineText(text) {
  // Split by $ to handle LaTeX inline
  const parts = text.split(/(\$[^$]+\$)/)
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const latex = part.slice(1, -1)
      return (
        <span key={i} style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
          {latex}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function classifyLine(line) {
  // 「第x條」開頭者：不縮排
  if (/^第\s*[一二三四五六七八九十百千0-9０-９]+\s*條/.test(line)) {
    return { indent: 0, firstLine: 0, prefix: '', content: line }
  }
  
  // 括號包裹數字或中文數字（如 (1), （一））→ 整體縮排 6字元、首行凸排 2字元
  let match = line.match(/^([（(][一二三四五六七八九十百千0-9０-９]+[）)])\s*/);
  if (match) {
    return { indent: 6 * EM, firstLine: -2 * EM, prefix: match[1], content: line.slice(match[0].length) }
  }
  
  // 中文數字後接頓號（如 一、）或者阿拉伯數字後接空白（全半形或 tab）→ 整體縮排 4字元、首行凸排 2字元
  match = line.match(/^([一二三四五六七八九十百千]+、|[0-9０-９]+)[\s\t　]*/);
  if (match) {
    return { indent: 4 * EM, firstLine: -2 * EM, prefix: match[1], content: line.slice(match[0].length) }
  }
  
  // 其餘：首行縮排 2字元
  return { indent: 0, firstLine: 2 * EM, prefix: '', content: line }
}

function AppendixContent({ content }) {
  if (!content) return <span style={{ color: '#999', fontStyle: 'italic' }}>（待填入）</span>
  const lines = content.split('\n')
  return (
    <div>
      {lines.map((line, idx) => {
        const { indent, firstLine, prefix, content: mainContent } = classifyLine(line)
        const paddingLeft = indent
        const textIndent = firstLine
        return (
          <div
            key={idx}
            style={{
              paddingLeft: `${paddingLeft}pt`,
              textIndent: `${textIndent}pt`,
              textAlign: 'justify',
              wordBreak: 'break-all',
              minHeight: '1.9em',
            }}
          >
            {prefix && (
              <span style={{ display: 'inline-block', width: `${Math.abs(textIndent)}pt`, textIndent: 0 }}>
                {prefix}
              </span>
            )}
            {renderLineText(mainContent)}
          </div>
        )
      })}
    </div>
  )
}

// ── 主元件 ───────────────────────────────────────────────────────────────────

const OrderPreview = forwardRef(function OrderPreview(_, ref) {
  const { state } = useDocument()
  const org = useOrg()
  const { meta, order } = state.document
  const {
    sessionNumber, orderNumber, doDelete, doEnact, doAmend,
    signatureTitle, signatureName,
    appendixEnabled, appendixEntries, images,
  } = order

  const internalRef = useRef(null)
  const lastLayoutRef = useRef('')
  const [pages, setPages] = useState(1)

  useImperativeHandle(ref, () => internalRef.current)

  // 頁數計算（同 DocumentPreview 邏輯）
  useEffect(() => {
    if (!internalRef.current) return
    const observer = new ResizeObserver(() => {
      if (internalRef.current) {
        const originalMinHeight = internalRef.current.style.minHeight
        internalRef.current.style.minHeight = '0px'

        // 1. Temporarily remove all adjustments to measure natural flow
        const existingAvoids = internalRef.current.querySelectorAll('.avoid-zone')
        const hadAvoids = existingAvoids.length > 0
        existingAvoids.forEach(el => el.style.display = 'none')

        const blocks = internalRef.current.querySelectorAll('.content-block')
        const originalMargins = []
        let hadMargins = false
        blocks.forEach(b => {
          originalMargins.push(b.style.marginTop)
          if (b.style.marginTop && b.style.marginTop !== '0px') {
            hadMargins = true
          }
          b.style.marginTop = '0px'
        })

        // Force reflow
        void internalRef.current.offsetHeight

        const mmToPx = 96 / 25.4
        const pageHeightPx = 297 * mmToPx
        const footerHeightPx = 25 * mmToPx
        const topMarginPx = 18 * mmToPx

        let newLayoutSignature = ''
        const layoutActions = []

        blocks.forEach((block, index) => {
          const rect = block.getBoundingClientRect()
          const parentRect = internalRef.current.getBoundingClientRect()
          const offsetTop = rect.top - parentRect.top

          const pageIndex = Math.floor(offsetTop / pageHeightPx)
          const pageBottom = (pageIndex + 1) * pageHeightPx

          if (offsetTop + rect.height > pageBottom - footerHeightPx) {
            if (rect.height < 120) {
              const pushAmount = pageBottom - offsetTop + topMarginPx
              layoutActions.push(() => block.style.marginTop = `${pushAmount}px`)
              newLayoutSignature += `M${index}:${pushAmount}|`
            } else {
              let currentBottom = pageBottom
              let currentHeight = rect.height
              const avoidZones = []
              
              while (offsetTop + currentHeight > currentBottom - footerHeightPx) {
                const avoidStart = currentBottom - footerHeightPx - offsetTop
                const avoidHeight = footerHeightPx + topMarginPx
                avoidZones.push({ start: avoidStart, height: avoidHeight })
                currentHeight += avoidHeight
                currentBottom += pageHeightPx
              }

              if (avoidZones.length > 0) {
                let polygonPoints = []
                let maxEnd = 0
                avoidZones.forEach(zone => {
                  const end = zone.start + zone.height
                  polygonPoints.push(`0 ${zone.start}px, 100% ${zone.start}px, 100% ${end}px, 0 ${end}px`)
                  if (end > maxEnd) maxEnd = end
                })
                
                const polygonStr = `polygon(${polygonPoints.join(', ')})`
                newLayoutSignature += `A${index}:${maxEnd}:${polygonStr}|`
                
                layoutActions.push(() => {
                  let textContainer = block.querySelector('.flex-1') || block
                  
                  // Check if we already have an avoid-zone here
                  let avoidEl = textContainer.querySelector('.avoid-zone')
                  if (!avoidEl) {
                    avoidEl = document.createElement('div')
                    avoidEl.className = 'avoid-zone'
                    avoidEl.style.float = 'left'
                    avoidEl.style.width = '100%'
                    avoidEl.style.margin = '0'
                    avoidEl.style.padding = '0'
                    textContainer.insertBefore(avoidEl, textContainer.firstChild)
                  }
                  avoidEl.style.display = 'block'
                  avoidEl.style.height = `${maxEnd}px`
                  avoidEl.style.shapeOutside = polygonStr
                })
              }
            }
          }
        })

        const heightPx = internalRef.current.getBoundingClientRect().height
        const calculatedPages = Math.max(1, Math.ceil(heightPx / pageHeightPx))
        newLayoutSignature += `P${calculatedPages}`

        const needsAvoids = newLayoutSignature.includes('A')
        const needsMargins = newLayoutSignature.includes('M')
        
        // Detect if React re-rendered and wiped out our manual DOM adjustments
        let domWiped = false
        if (needsAvoids && !hadAvoids) domWiped = true
        if (needsMargins && !hadMargins) domWiped = true

        // 2. Only apply if something changed OR if React wiped out our nodes
        if (newLayoutSignature !== lastLayoutRef.current || domWiped) {
          lastLayoutRef.current = newLayoutSignature
          // Actually apply the actions
          existingAvoids.forEach(el => el.remove()) // clean up to start fresh
          blocks.forEach(b => b.style.marginTop = '0px')
          layoutActions.forEach(action => action())
          
          setPages(calculatedPages)
        } else {
          // Revert our temporary removals since nothing changed
          existingAvoids.forEach(el => el.style.display = 'block')
          blocks.forEach((b, i) => b.style.marginTop = originalMargins[i])
        }

        internalRef.current.style.minHeight = originalMinHeight
      }
    })
    observer.observe(internalRef.current)
    return () => observer.disconnect()
  }, [state.document])

  if (!org) return null

  const orgFullName = org.name || '（機關名稱）'
  const rocDate = meta.date ? isoToROC(meta.date) : '（日期）'
  const sessionStr = sessionNumber || '○○'
  const orderNumStr = orderNumber || 'XXXXXXX'
  const bodyText = buildOrderBody(order)
  const hasActions = doDelete || doEnact || doAmend

  // ── 右欄兩行：日期 + 令字號，兩行等寬對齊 ──────────────────────────────
  const dateStr = `${rocDate}`
  const numStr = `（${sessionStr}）令字第 ${orderNumStr} 號`

  return (
    <div
      ref={internalRef}
      id="print-area"
      className="doc-preview bg-white"
      style={{
        width: '210mm',
        minHeight: `${pages * 297}mm`,
        padding: '18mm 22mm 22mm 28mm',
        fontFamily: "'PT Serif', 'TW-Kai-98_1', 'Noto Serif TC', serif",
        lineHeight: '1.9',
        color: '#1C2B3A',
        position: 'relative',
        boxShadow: '0 4px 30px rgba(28,43,58,0.15)',
        boxSizing: 'border-box',
      }}
    >
      {/* ── 標題區塊（雙框線）────────────────────────────────────────────── */}
      <div
        className="content-block"
        style={{
          borderTop: '3px solid #1C2B3A',
          borderBottom: '3px solid #1C2B3A',
          padding: '4px 0',
          marginBottom: '2rem',
        }}
      >
        <div 
          style={{
            display: 'block',
            borderTop: '1px solid #1C2B3A', 
            borderBottom: '1px solid #1C2B3A', 
            padding: '20px 12px 32px 12px'
          }}>
          {/* 第一行：機關全名 */}
          <div style={{
            fontSize: '16pt',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '1',
            marginBottom: '24px'
          }}>
            {orgFullName}
          </div>
          {/* 第二行：會長令 */}
          <div style={{
            fontSize: '32pt',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '1',
            paddingBottom: '8px'
          }}>
            會長令
          </div>
        </div>
      </div>

      {/* ── 小標題：左欄「會長令」+ 右欄日期/令字號 ─────────────────────── */}
      <div
        className="content-block"
        style={{
          display: 'flex',
          alignItems: 'stretch',
          marginBottom: '1rem',
        }}
      >
        {/* 左欄 */}
        <div style={{
          fontSize: '20pt',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          paddingRight: '1rem',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          會長令
        </div>

        {/* 右欄：兩行對齊 */}
        <div style={{
          fontSize: '11pt',
          fontWeight: 'normal',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
        }}>
          {/* 使用等寬容器讓兩行文字從相同起點開始 */}
          <div style={{ display: 'table', borderCollapse: 'collapse', width: 'max-content' }}>
            <div style={{ display: 'table-row' }}>
              <div style={{ 
                display: 'table-cell', 
                whiteSpace: 'nowrap', 
                lineHeight: '1.6',
                width: '100%',
                textAlign: 'justify',
                textAlignLast: 'justify',
              }}>
                {dateStr}
              </div>
            </div>
            <div style={{ display: 'table-row' }}>
              <div style={{ 
                display: 'table-cell', 
                whiteSpace: 'nowrap', 
                lineHeight: '1.6',
                width: '100%',
                textAlign: 'justify',
                textAlignLast: 'justify',
              }}>
                {numStr}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 公告段落 ──────────────────────────────────────────────────────── */}
      <div
        className="content-block"
        style={{
          fontSize: '14pt',
          fontWeight: 'normal',
          textAlign: 'justify',
          wordBreak: 'break-all',
          marginBottom: '1rem',
        }}
      >
        {hasActions
          ? bodyText
          : <span style={{ color: '#999', fontStyle: 'italic' }}>（請在左側選擇動作並填寫資訊）</span>
        }
      </div>

      {/* ── 署名 ──────────────────────────────────────────────────────────── */}
      <div
        className="content-block"
        style={{
          fontSize: '14pt',
          fontWeight: 'normal',
          textAlign: 'justify',
          marginBottom: '1rem',
        }}
      >
        {signatureTitle || <span style={{ color: '#999', fontStyle: 'italic' }}>（職銜）</span>}
        {signatureName && (
          <span style={{ marginLeft: '1em' }}>{signatureName}</span>
        )}
      </div>

      {/* ── 法規附件 ──────────────────────────────────────────────────────── */}
      {appendixEnabled && appendixEntries.length > 0 && appendixEntries.map((entry) => (
        <div key={entry.id} style={{ marginBottom: '1rem' }}>
          {/* 標題行 */}
          {entry.scopeType === 'title' ? (
            <div
              className="content-block"
              style={{
                fontSize: '14pt',
                textAlign: 'justify',
                marginBottom: '0.5rem',
              }}
            >
              {entry.title
                ? `《${entry.title}》`
                : <span style={{ color: '#999', fontStyle: 'italic' }}>《法規標題》</span>
              }
              {entry.articlesRef && ` ${entry.articlesRef}`}
            </div>
          ) : (
            <div
              className="content-block"
              style={{
                fontSize: '14pt',
                textAlign: 'justify',
                marginBottom: '0.5rem',
              }}
            >
              {entry.articlesRef || <span style={{ color: '#999', fontStyle: 'italic' }}>（條文參照）</span>}
            </div>
          )}

          {/* 條文內容 */}
          <div
            className="content-block"
            style={{ fontSize: '14pt', lineHeight: '1.9' }}
          >
            <AppendixContent content={entry.content} />
          </div>
        </div>
      ))}

      {/* ── 附圖 ──────────────────────────────────────────────────────────── */}
      {images && images.length > 0 && images.map((img) => (
        <div
          key={img.id}
          className="content-block"
          style={{
            width: '100%',
            marginBottom: '1rem',
            pageBreakBefore: 'always',
          }}
        >
          <img
            src={img.dataUrl}
            alt={img.name || '附圖'}
            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      ))}

      {/* ── 頁碼覆蓋層 ────────────────────────────────────────────────────── */}
      {Array.from({ length: pages }).map((_, i) => (
        <div
          key={`page-overlay-${i}`}
          style={{
            position: 'absolute',
            top: `${i * 297}mm`,
            left: 0,
            width: '210mm',
            height: '297mm',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            zIndex: 10,
          }}
        >
          {pages > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '15mm',
              width: '100%',
              textAlign: 'center',
              fontSize: '10pt',
              fontFamily: "'PT Serif', 'TW-Kai-98_1', 'Noto Serif TC', serif",
              color: '#1C2B3A',
            }}>
              第 {i + 1} 頁，共 {pages} 頁
            </div>
          )}
        </div>
      ))}
    </div>
  )
})

export default OrderPreview
