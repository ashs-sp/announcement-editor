import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Export a DOM element as a PDF.
 * @param {HTMLElement} element - The element to export
 * @param {string} filename - Output filename (without extension)
 * @param {object} options
 */
export async function exportElementAsPDF(element, filename = 'document', options = {}) {
  const {
    scale = 2,
    pageSize = 'a4',
    orientation = 'portrait',
  } = options

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (doc) => {
      const elements = doc.querySelectorAll('.page-break-line')
      elements.forEach(el => el.style.borderBottom = 'none')
    }
  })

  const imgData = canvas.toDataURL('image/png')

  // A4 dimensions in mm
  const pageWidth = 210
  const pageHeight = 297

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  })

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  // Add more pages if content is longer than one page
  while (heightLeft >= 1) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`${filename}.pdf`)
  return pdf
}

/**
 * Export multiple elements as separate PDFs (for 正本/副本 in 函文)
 * @param {Array<{element: HTMLElement, filename: string}>} pages
 */
export async function exportMultiplePDFs(pages, options = {}) {
  for (const { element, filename } of pages) {
    await exportElementAsPDF(element, filename, options)
    // Small delay between exports
    await new Promise(r => setTimeout(r, 300))
  }
}

/**
 * Merge multiple elements into a single PDF
 */
export async function exportMergedPDF(elements, filename = 'document', options = {}) {
  const { scale = 2 } = options

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297

  let isFirstPage = true

  for (const element of elements) {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (doc) => {
        const elements = doc.querySelectorAll('.page-break-line')
        elements.forEach(el => el.style.borderBottom = 'none')
      }
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * pageWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    if (!isFirstPage) pdf.addPage()

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    isFirstPage = false

    while (heightLeft >= 1) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
  }

  pdf.save(`${filename}.pdf`)
}
