import { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react'
import { useDocument, useOrg, useTemplate } from '../../context/DocumentContext'
import { computeNumberedList, getLevelIndent } from '../../utils/numbering'
import { isoToROC, isoToROCShort } from '../../utils/dateUtils'

const LEVEL_COLORS = {
  1: 'text-[#1C2B3A]',
  2: 'text-[#2A4A6A]',
  3: 'text-[#3A6050]',
  4: 'text-[#5A5040]',
}

function NumberedListPreview({ items }) {
  if (!items || items.length === 0) return null
  const numbered = computeNumberedList(items)

  return (
    <div className="space-y-0.5">
      {numbered.map(({ item, prefix }) => (
        <div
          key={item.id}
          className="content-block flex items-start gap-0"
          style={{ paddingLeft: `${getLevelIndent(item.level)}px` }}
        >
          <span className={`flex-shrink-0 font-serif text-[16pt] ${LEVEL_COLORS[item.level] || ''}`}>
            {prefix}
          </span>
          <div className="flex-1 text-[16pt] font-serif text-[#1C2B3A] leading-relaxed whitespace-pre-wrap" style={{ textAlign: 'justify', textJustify: 'inter-ideograph', wordBreak: 'break-all' }}>
            {item.content || <span className="text-gray-300 italic">（待填入）</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

const DocumentPreview = forwardRef(function DocumentPreview({ showStamp, showSealArea, recipient }, ref) {
  const { state } = useDocument()
  const org = useOrg()
  const template = useTemplate()
  const { meta, blocks, signature, options } = state.document

  const internalRef = useRef(null)
  const [pages, setPages] = useState(1)

  useImperativeHandle(ref, () => internalRef.current)

  useEffect(() => {
    if (!internalRef.current) return
    const observer = new ResizeObserver(() => {
      if (internalRef.current) {
        const originalMinHeight = internalRef.current.style.minHeight
        internalRef.current.style.minHeight = '0px'

        // Reset margins first to calculate natural flow
        const blocks = internalRef.current.querySelectorAll('.content-block')
        blocks.forEach(b => {
          b.style.marginTop = '0px'
        })

        // Force a reflow
        void internalRef.current.offsetHeight

        const mmToPx = 96 / 25.4
        const pageHeightPx = 297 * mmToPx
        const footerHeightPx = 25 * mmToPx // Avoid the bottom 25mm

        blocks.forEach(block => {
          const rect = block.getBoundingClientRect()
          const parentRect = internalRef.current.getBoundingClientRect()
          const offsetTop = rect.top - parentRect.top

          const pageIndex = Math.floor(offsetTop / pageHeightPx)
          const pageBottom = (pageIndex + 1) * pageHeightPx

          // If block touches the footer area and it's not taller than a whole page
          if (offsetTop + rect.height > pageBottom - footerHeightPx && rect.height < pageHeightPx - footerHeightPx) {
            // Push it to the next page top (plus 18mm top margin)
            const pushAmount = pageBottom - offsetTop + (18 * mmToPx)
            block.style.marginTop = `${pushAmount}px`
          }
        })

        // Recalculate total pages based on new height
        const heightPx = internalRef.current.getBoundingClientRect().height
        const calculatedPages = Math.max(1, Math.ceil(heightPx / pageHeightPx))
        setPages(calculatedPages)

        internalRef.current.style.minHeight = originalMinHeight
      }
    })
    observer.observe(internalRef.current)
    return () => observer.disconnect()
  }, [state.document])

  if (!org || !template) return null

  const enabledBlocks = blocks.filter(b => b._enabled)

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
      }}
    >
      {/* Seam stamp overlay */}
      {showStamp && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: '-4mm',
            width: '8mm',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            writingMode: 'vertical-rl',
            fontSize: '26px',
            color: 'rgba(160,41,26,1)',
            letterSpacing: '-7px',
            fontFamily: "'MoeLI', 'Noto Serif TC', serif",
            userSelect: 'none',
            border: '2px solid rgba(160,41,26,1)',
            borderRadius: '8px',
            paddingBottom: '7px',
            boxSizing: 'border-box',
          }}>
            {org.name || org.abbr || org.shortName}電子公文系統騎縫章
          </div>
        </div>
      )}

      {/* Document outer border */}

      {/* Header: org name */}
      <h1
        className="content-block"
        style={{
          fontSize: '18pt',
          textAlign: 'center',
          marginBottom: '10pt',
        }}
      >
        {org.name}　{template.name}{/* 這裡用全形空白是刻意的 */}
      </h1>

      {/* Seal placeholder */}
      { Boolean(showSealArea) && (
        <div style={{
          position: 'absolute',
          top: '35mm',
          right: '26mm',
          width: '28mm',
          height: '28mm',
          border: '1px dashed rgba(160,41,26,0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '9px', color: 'rgba(160,41,26,0.2)', fontFamily: 'sans-serif', textAlign: 'center', lineHeight: 1.4, letterSpacing: '0.35em'}}>
            未蓋印信無效
          </span>
        </div>
        )}

      {/* Recipients (for 函文) */}
      {template.hasRecipients && (
        <div className="content-block">
          {(state.document.recipients?.primary?.length > 0) && (
            <div style={{fontSize: '16pt'}}>
              受文者：{recipient || state.document.recipients.primary.join('、')}
            </div>
          )}
        </div>
      )}


      {/* Meta row: date + doc number + attachment */}
      <div
        className="content-block pl-12" 
        style={{
          fontSize: '12pt !important',
          textIndent: '-3em',
          lineHeight: '1.15',
        }}
      >
        <div style={{fontSize: '12pt',}}>發文日期：{meta.date ? isoToROC(meta.date) : ''}</div>

        {meta.docNumber?.enabled && (
          <div style={{fontSize: '12pt',}}>發文字號：{meta.docNumber.prefix}第 {meta.docNumber.number || '　　'} 號</div>
        )}

        <div style={{fontSize: '12pt',}}>附件：{meta.attachment}</div>
      </div>

      {/* Body */}
      <div style={{ marginTop: '12px', paddingLeft: '0' }}>
        {enabledBlocks.map((block) => {
          const items = block.items || []
          const isList = block.type !== 'text'
          const hasMultipleItems = isList && items.length > 1

          if (hasMultipleItems) {
            return (
              <div key={block.id} style={{ marginBottom: '8pt' }}>
                <div className="content-block" style={{ fontSize: '16pt' }}>{block.label}：</div>
                <div style={{ paddingLeft: '16pt' }}>
                  <NumberedListPreview items={items} />
                </div>
              </div>
            )
          }

          // Single item list or text block
          const content = isList 
            ? (items[0]?.content || '') 
            : (block.content || '')

          return (
            <div key={block.id} className="content-block" style={{ marginBottom: '2pt' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
                {/* Label */}
                <span style={{
                  fontSize: '16pt',
                  flexShrink: 0,
                }}>
                  {block.label}：
                </span>
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ textAlign: 'justify', textJustify: 'inter-ideograph', fontSize: '16pt', lineHeight: '1.9', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {content || <span style={{ fontStyle: 'italic' }}>（待填入）</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Signature */}
      <div className="content-block" style={{ marginTop: '16pt', marginBottom: '16pt', paddingRight: '4px', lineHeight: '22pt' }}>
        {/* Organizations name */}
        <div style={{ fontSize: '16pt' }}>
          {signature.orgMode === 'without-org-name' && org.name ? (
            <></>
          ) : (
            <span>{org.name}</span>
          )}
        </div>
        {/* Chairperson name */}
        <div style={{ fontSize: '16pt', marginTop: '0px', marginLeft: '32pt'}}>
          {/* Title */}
          {signature.mode === 'without-title-and-name' && signature.title ? (
            <span/>
          ) : (
            <span>{signature.title}</span>
          )}
          {/* Name */}
          {signature.mode === 'with-name' && signature.name ? (
            <span style={{ marginLeft: '8px' }}>{signature.name}</span>
          ) : (
            <span/>
          )}
        </div>
      </div>

      {template.hasRecipients && (
        <div className="content-block">
          {(state.document.recipients?.primary?.length > 0) && (
            <div style={{ fontSize: '12pt' }}>
                正本：{recipient || state.document.recipients.primary.join('、')}
            </div>
          )}
          {(state.document.recipients?.secondary?.length > 0) && (
            <div style={{ fontSize: '12pt' }}>
                副本：{state.document.recipients.secondary.join('、')}
            </div>
          )}
        </div>
      )}

      {/* Page Breaks and Footers overlay */}
      {Array.from({ length: pages }).map((_, i) => (
        <div
          key={`page-overlay-${i}`}
          className="page-break-line"
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

export default DocumentPreview
