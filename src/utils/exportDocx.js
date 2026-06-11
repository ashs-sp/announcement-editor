import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, Header, Footer, PageNumber, NumberFormat,
  convertInchesToTwip, LevelFormat
} from 'docx'
import { saveAs } from 'file-saver'
import { computeNumberedList } from './numbering'
import { isoToROC } from './dateUtils'
import { buildOrderBody } from '../components/preview/OrderPreview'

export async function exportAsDocx(docState, orgData, templateData, filename = 'document') {
  if (templateData.docType === 'order') {
    return exportOrderAsDocx(docState, orgData, templateData, filename)
  }

  const { meta, blocks, signature, options } = docState

  const children = []

  // Header section: organization name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: orgData.name,
          size: 32, // 16pt
          bold: true,
          font: "標楷體",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  )

  // Document type
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: templateData.name,
          size: 32,
          bold: true,
          font: "標楷體",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  )

  // Meta: date and doc number
  if (meta.date) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `發文日期：${isoToROC(meta.date)}`,
            size: 24,
            font: "標楷體",
          }),
        ],
        spacing: { after: 100 },
      })
    )
  }

  if (meta.docNumber?.enabled && meta.docNumber?.number) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `發文字號：${meta.docNumber.prefix}${meta.docNumber.number}`,
            size: 24,
            font: "標楷體",
          }),
        ],
        spacing: { after: 200 },
      })
    )
  }

  // Divider
  children.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6 } },
      spacing: { after: 200 },
    })
  )

  // Recipients for 函文
  if (templateData.hasRecipients && docState.recipients) {
    const { primary = [], secondary = [] } = docState.recipients
    if (primary.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '受文者：', size: 24, bold: true, font: "標楷體" }),
            new TextRun({ text: primary.join('、'), size: 24, font: "標楷體" }),
          ],
          spacing: { after: 100 },
        })
      )
    }
    if (secondary.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '副本：', size: 24, bold: true, font: "標楷體" }),
            new TextRun({ text: secondary.join('、'), size: 24, font: "標楷體" }),
          ],
          spacing: { after: 100 },
        })
      )
    }
  }

  // Content blocks
  for (const block of blocks) {
    if (!block.content && (!block.items || block.items.length === 0)) continue

    // Block label
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${block.label}：`,
            size: 24,
            bold: true,
            font: "標楷體",
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    )

    if (block.type === 'text') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: block.content || '', size: 24, font: 'TW-Kai-98_1' }),
          ],
          indent: { left: convertInchesToTwip(0.3) },
          spacing: { after: 100 },
          alignment: AlignmentType.JUSTIFIED,
        })
      )
    } else if (block.type === 'numbered-list' && block.items) {
      const numbered = computeNumberedList(block.items)
      for (const { item, prefix } of numbered) {
        const indent = (item.level - 1) * convertInchesToTwip(0.3)
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: prefix, size: 24, font: 'TW-Kai-98_1' }),
              new TextRun({ text: item.content || '', size: 24, font: 'TW-Kai-98_1' }),
            ],
            indent: { left: indent + convertInchesToTwip(0.3) },
            spacing: { after: 60 },
            alignment: AlignmentType.JUSTIFIED,
          })
        )
      }
    }
  }

  // Signature
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [],
    })
  )

  const sigText = signature.mode === 'with-name'
    ? `${orgData.name} ${signature.title} ${signature.name}`
    : `${orgData.name} ${signature.title}`

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: sigText, size: 24, font: "標楷體" }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 100 },
    })
  )

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.0),
              right: convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left: convertInchesToTwip(1.2),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "第 ", size: 20, font: '標楷體' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 20, font: '標楷體' }),
                  new TextRun({ text: " 頁，共 ", size: 20, font: '標楷體' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, font: '標楷體' }),
                  new TextRun({ text: " 頁", size: 20, font: '標楷體' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${filename}.docx`)
}

async function exportOrderAsDocx(docState, orgData, templateData, filename) {
  const { meta, order } = docState
  const {
    sessionNumber, orderNumber, doDelete, doEnact, doAmend,
    signatureTitle, signatureName,
    appendixEnabled, appendixEntries
  } = order

  const children = []

  const orgFullName = orgData.name || '（機關名稱）'
  const rocDate = meta.date ? isoToROC(meta.date) : '（日期）'
  const sessionStr = sessionNumber || '○○'
  const orderNumStr = orderNumber || 'XXXXXXX'
  const bodyText = (doDelete || doEnact || doAmend) ? buildOrderBody(order) : '茲（請選擇動作）《（法規名稱）》，公布之。'

  // 1. 機關全名 + 會長令
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: orgFullName, size: 28, bold: true, font: "標楷體" })
      ],
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, space: 1 } },
      spacing: { before: 100, after: 100 }
    })
  )
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "會長令", size: 48, bold: true, font: "標楷體" })
      ],
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1 } },
      spacing: { before: 100, after: 300 }
    })
  )

  // 2. 標題: 會長令 + 日期/令字號
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "會長令", size: 40, bold: true, font: "標楷體" })]
                })
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `中華民國 ${rocDate}`, size: 22, font: "標楷體" })],
                  alignment: AlignmentType.RIGHT,
                }),
                new Paragraph({
                  children: [new TextRun({ text: `（${sessionStr}）令字第 ${orderNumStr} 號`, size: 22, font: "標楷體" })],
                  alignment: AlignmentType.RIGHT,
                })
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            })
          ]
        })
      ]
    })
  )

  children.push(new Paragraph({ spacing: { after: 300 } }))

  // 3. Body
  children.push(
    new Paragraph({
      children: [new TextRun({ text: bodyText, size: 28, font: "TW-Kai-98_1" })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 },
    })
  )

  // 4. Signature
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: signatureTitle || '', size: 28, font: "標楷體" }),
        new TextRun({ text: signatureName ? `  ${signatureName}` : '', size: 28, font: "標楷體" })
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 },
    })
  )

  // 5. Appendix
  if (appendixEnabled && appendixEntries && appendixEntries.length > 0) {
    for (const entry of appendixEntries) {
      if (entry.scopeType === 'title') {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: entry.title ? `《${entry.title}》` : '《法規標題》', size: 28, font: "標楷體" }),
              new TextRun({ text: entry.articlesRef ? ` ${entry.articlesRef}` : '', size: 28, font: "標楷體" })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 200, after: 100 }
          })
        )
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: entry.articlesRef || '（條文參照）', size: 28, font: "標楷體" })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 200, after: 100 }
          })
        )
      }

      if (entry.content) {
        const lines = entry.content.split('\n')
        for (const line of lines) {
          let indentConfig = {}
          let prefix = ''
          let mainContent = line
          
          if (/^第\s*[一二三四五六七八九十百千0-9０-９]+\s*條/.test(line)) {
            indentConfig = { left: 0 }
          } else {
            let match = line.match(/^([（(][一二三四五六七八九十百千0-9０-９]+[）)])\s*/)
            if (match) {
              indentConfig = { left: convertInchesToTwip(1.2), hanging: convertInchesToTwip(0.4) }
              prefix = match[1]
              mainContent = line.slice(match[0].length)
            } else {
              match = line.match(/^([一二三四五六七八九十百千]+、|[0-9０-９]+)[\s\t　]*/)
              if (match) {
                indentConfig = { left: convertInchesToTwip(0.8), hanging: convertInchesToTwip(0.4) }
                prefix = match[1]
                mainContent = line.slice(match[0].length)
              } else {
                indentConfig = { firstLine: convertInchesToTwip(0.4) }
              }
            }
          }

          const runs = []
          if (prefix) {
            runs.push(new TextRun({ text: prefix + '\t', size: 28, font: "TW-Kai-98_1" }))
          }
          runs.push(new TextRun({ text: mainContent, size: 28, font: "TW-Kai-98_1" }))

          children.push(
            new Paragraph({
              children: runs,
              indent: indentConfig,
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 100 } // roughly matching minHeight 1.9em
            })
          )
        }
      }
    }
  }

  // Generate doc
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.0),
              right: convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left: convertInchesToTwip(1.2),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "第 ", size: 20, font: '標楷體' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 20, font: '標楷體' }),
                  new TextRun({ text: " 頁，共 ", size: 20, font: '標楷體' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, font: '標楷體' }),
                  new TextRun({ text: " 頁", size: 20, font: '標楷體' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${filename}.docx`)
}
