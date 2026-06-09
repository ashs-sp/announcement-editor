import html2canvas from 'html2canvas'

/**
 * Export a DOM element as an image (PNG by default).
 * @param {HTMLElement} element - The element to export
 * @param {string} filename - Output filename (without extension)
 * @param {object} options
 */
export async function exportElementAsImage(element, filename = 'document', options = {}) {
  const {
    scale = 2,
    format = 'image/png', // 'image/png' or 'image/jpeg'
    quality = 1.0, // Used if format is image/jpeg
  } = options

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (doc) => {
      // Remove page break lines for image export
      const elements = doc.querySelectorAll('.page-break-line')
      elements.forEach(el => el.style.borderBottom = 'none')
    }
  })

  const imgData = canvas.toDataURL(format, quality)
  
  // Create a download link
  const link = document.createElement('a')
  const extension = format === 'image/jpeg' ? 'jpg' : 'png'
  link.download = `${filename}.${extension}`
  link.href = imgData
  
  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
