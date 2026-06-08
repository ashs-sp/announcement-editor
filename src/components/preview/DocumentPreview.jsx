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
          className="flex items-start gap-1"
          style={{ paddingLeft: `${getLevelIndent(item.level)}px` }}
        >
          <span className={`flex-shrink-0 font-serif text-sm ${LEVEL_COLORS[item.level] || ''}`}>
            {prefix}
          </span>
          <span className="text-sm font-serif text-[#1C2B3A] leading-relaxed whitespace-pre-wrap">
            {item.content || <span className="text-gray-300 italic">（待填入）</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

const DocumentPreview = forwardRef(function DocumentPreview({ showStamp, recipient }, ref) {
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
        fontFamily: "'TW-Kai-98_1', 'Noto Serif TC', serif",
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
            fontSize: '7px',
            color: 'rgba(160,41,26,0.55)',
            letterSpacing: '1px',
            fontFamily: "'MoeLI', 'Noto Serif TC', serif",
            userSelect: 'none',
          }}>
            {org.abbr || org.shortName}騎縫章
          </div>
        </div>
      )}

      {/* Document outer border */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1.5px solid #1C2B3A',
          tableLayout: 'fixed',
          marginBottom: '0',
        }}
      >
        <tbody>
          {/* Header row: org name */}
          <tr>
            <td
              colSpan={4}
              style={{
                border: '1px solid #1C2B3A',
                padding: '6px 10px',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '2px',
              }}
            >
              {org.name}
            </td>
          </tr>

          {/* Doc type row */}
          <tr>
            <td
              colSpan={4}
              style={{
                border: '1px solid #1C2B3A',
                padding: '4px 10px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 600,
                letterSpacing: '4px',
              }}
            >
              {template.name}
            </td>
          </tr>

          {/* Meta row: date + doc number + attachment */}
          <tr>
            <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', width: '25%', fontWeight: 600 }}>
              發文日期
            </td>
            <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', width: '25%' }}>
              {meta.date ? isoToROC(meta.date) : ''}
            </td>
            <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', width: '20%', fontWeight: 600 }}>
              速別
            </td>
            <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', width: '30%' }}>
              普通件
            </td>
          </tr>

          {meta.docNumber?.enabled && (
            <tr>
              <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', fontWeight: 600 }}>
                發文字號
              </td>
              <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px' }} colSpan={3}>
                {meta.docNumber.prefix}{meta.docNumber.number}
              </td>
            </tr>
          )}

          {(meta.attachment) && (
            <tr>
              <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', fontWeight: 600 }}>
                附件
              </td>
              <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px' }} colSpan={3}>
                {meta.attachment}
              </td>
            </tr>
          )}

          {/* Recipients (for 函文) */}
          {template.hasRecipients && (
            <>
              {(state.document.recipients?.primary?.length > 0) && (
                <tr>
                  <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', fontWeight: 600, verticalAlign: 'top' }}>
                    受文者
                  </td>
                  <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px' }} colSpan={3}>
                    {recipient || state.document.recipients.primary.join('、')}
                  </td>
                </tr>
              )}
              {(state.document.recipients?.secondary?.length > 0) && (
                <tr>
                  <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px', fontWeight: 600 }}>
                    副本
                  </td>
                  <td style={{ border: '1px solid #1C2B3A', padding: '4px 8px', fontSize: '12px' }} colSpan={3}>
                    {state.document.recipients.secondary.join('、')}
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>

      {/* Body */}
      <div style={{ marginTop: '12px', paddingLeft: '2px' }}>
        {enabledBlocks.map((block) => (
          <div key={block.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{
                fontWeight: 700,
                fontSize: '13px',
                flexShrink: 0,
                minWidth: '4.5em',
              }}>
                {block.label}：
              </span>
              <div style={{ flex: 1 }}>
                {block.type === 'text' ? (
                  <span style={{ fontSize: '13px', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
                    {block.content || <span style={{ color: '#ccc', fontStyle: 'italic' }}>（待填入）</span>}
                  </span>
                ) : (
                  <NumberedListPreview items={block.items || []} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Signature */}
      <div style={{ marginTop: '32px', textAlign: 'right', paddingRight: '4px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>
          {org.name}
        </div>
        <div style={{ fontSize: '13px', marginTop: '4px' }}>
          <span style={{ fontWeight: 600 }}>{signature.title}</span>
          {signature.mode === 'with-name' && signature.name ? (
            <span style={{ marginLeft: '8px' }}>{signature.name}</span>
          ) : (
            <span style={{
              display: 'inline-block',
              width: '50px',
              borderBottom: '1px solid #999',
              marginLeft: '8px',
              verticalAlign: 'bottom',
            }} />
          )}
        </div>
      </div>

      {/* Seal placeholder */}
      <div style={{
        position: 'absolute',
        bottom: '30mm',
        right: '26mm',
        width: '28mm',
        height: '28mm',
        border: '1px dashed rgba(160,41,26,0.3)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '9px', color: 'rgba(160,41,26,0.4)', fontFamily: 'sans-serif', textAlign: 'center', lineHeight: 1.4 }}>
          印章<br/>位置
        </span>
      </div>
    </div>
  )
})

export default DocumentPreview
