import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, Header, Footer, PageNumber, NumberFormat,
  convertInchesToTwip, LevelFormat
} from 'docx'
import { saveAs } from 'file-saver'
import { computeNumberedList } from './numbering'
import { isoToROC } from './dateUtils'

/**
 * Generate a Word document from the document state
 */
export async function exportAsDocx(docState, orgData, templateData, filename = 'document') {
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
