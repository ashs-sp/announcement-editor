import { forwardRef } from 'react'
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
          className="flex items-start gap-0"
          style={{ paddingLeft: `${getLevelIndent(item.level)}px` }}
        >
          <span className={`flex-shrink-0 font-serif text-[16pt] ${LEVEL_COLORS[item.level] || ''}`}>
            {prefix}
          </span>
          <span className="text-[16pt] font-serif text-[#1C2B3A] leading-relaxed whitespace-pre-wrap">
            {item.content || <span className="text-gray-300 italic">（待填入）</span>}
          </span>
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

  if (!org || !template) return null

  const enabledBlocks = blocks.filter(b => b._enabled)

  return (
    <div
      ref={ref}
      id="print-area"
      className="doc-preview bg-white"
      style={{
        width: '210mm',
        minHeight: '297mm',
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
        <>
          {(state.document.recipients?.primary?.length > 0) && (
            <div style={{fontSize: '16pt'}}>
              受文者：{recipient || state.document.recipients.primary.join('、')}
            </div>
          )}
        </>
      )}


      {/* Meta row: date + doc number + attachment */}
      <div
        className="pl-12" 
        style={{
          fontSize: '12pt !important',
          textIndent: '-3em',
          lineHeight: '1.15',
        }}
      >
        <div style={{fontSize: '12pt',}}>發文日期：{meta.date ? isoToROC(meta.date) : ''}</div>

        {meta.docNumber?.enabled && (
          <div style={{fontSize: '12pt',}}>發文字號：{meta.docNumber.prefix}{meta.docNumber.number}</div>
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
                <div style={{ fontSize: '16pt' }}>{block.label}：</div>
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
            <div key={block.id} style={{ marginBottom: '2pt' }}>
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
                  <span style={{ fontSize: '16pt', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
                    {content || <span style={{ fontStyle: 'italic' }}>（待填入）</span>}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Signature */}
      <div style={{ marginTop: '16pt', marginBottom: '16pt', paddingRight: '4px', lineHeight: '22pt' }}>
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
        <>
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
        </>
      )}
    </div>
  )
})

export default DocumentPreview
