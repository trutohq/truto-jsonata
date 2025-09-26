import { get } from 'lodash-es'
import { Lexer, Token } from 'marked'
import { jsPDF } from 'jspdf'

type PdfOptions = {
  title?: string
  pageSize?: string
  embedImages?: boolean
  pageMargins?: number[]
  defaultStyle?: any
}

type RenderContext = {
  doc: jsPDF
  marginLeft: number
  textWidth: number
  pageHeight: number
  marginBottom: number
  options: PdfOptions
}

function convertMdToPdf(markdown: string, options: PdfOptions = {}): Blob {
  const defaultOptions: PdfOptions = {
    title: '',
    pageSize: 'a4',
    embedImages: false,
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      fontSize: 12,
      lineHeight: 1.4,
    },
  }

  const opts = { ...defaultOptions, ...options }

  try {
    const safeMarkdown = typeof markdown === 'string' ? markdown : ''
    const tokens = Lexer.lex(safeMarkdown)

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: opts.pageSize,
    })

    doc.setProperties({
      title: opts.title,
      subject: 'Generated from Markdown',
      author: 'Truto',
      creator: 'Truto PDF Generator',
    })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(opts.defaultStyle!.fontSize)

    let currentY = opts.pageMargins![1]
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginLeft = opts.pageMargins![0]
    const marginRight = opts.pageMargins![2]
    const marginBottom = opts.pageMargins![3]
    const textWidth = pageWidth - marginLeft - marginRight

    if (opts.title && opts.title !== 'Document') {
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(opts.title, textWidth)
      doc.text(titleLines, marginLeft, currentY)
      currentY += titleLines.length * 24 + 20
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(opts.defaultStyle!.fontSize)
    }

    const ctx: RenderContext = {
      doc,
      marginLeft,
      textWidth,
      pageHeight,
      marginBottom,
      options: opts,
    }

    currentY = renderTokens(ctx, tokens, currentY)

    return doc.output('blob')
  } catch (error) {
    const errorMessage = `PDF Generation Error: ${
      error instanceof Error ? error.message : String(error)
    }`
    return new Blob([errorMessage], { type: 'text/plain' })
  }
}

function renderTokens(
  ctx: RenderContext,
  tokens: Token[],
  startY: number
): number {
  let currentY = startY
  for (const token of tokens) {
    if (currentY > ctx.pageHeight - ctx.marginBottom - 60) {
      ctx.doc.addPage()
      currentY = ctx.options.pageMargins![1]
    }
    const type = (token as any).type as string
    const renderer = tokenRenderers[type]
    if (renderer) {
      currentY = renderer(token as any, currentY, ctx)
      continue
    }
    const tokenAny = token as any
    if (get(tokenAny, 'tokens')) {
      currentY = renderTokens(ctx, tokenAny.tokens, currentY)
      continue
    }
    if (get(tokenAny, 'text')) {
      const text = cleanText(tokenAny.text)
      if (text.trim()) {
        const lines = ctx.doc.splitTextToSize(text, ctx.textWidth)
        ctx.doc.text(lines, ctx.marginLeft, currentY)
        currentY +=
          lines.length *
            ctx.options.defaultStyle!.fontSize *
            ctx.options.defaultStyle!.lineHeight +
          5
      }
    }
  }
  return currentY
}

const tokenRenderers: Record<
  string,
  (token: any, currentY: number, ctx: RenderContext) => number
> = {
  heading: (token, currentY, ctx) => {
    const headingSize = Math.max(16, 24 - token.depth * 2)
    ctx.doc.setFont('helvetica', 'bold')
    ctx.doc.setFontSize(headingSize)
    const text = cleanText(token.text)
    const lines = ctx.doc.splitTextToSize(text, ctx.textWidth)
    ctx.doc.text(lines, ctx.marginLeft, currentY)
    currentY += lines.length * headingSize * 1.2 + 10
    ctx.doc.setFont('helvetica', 'normal')
    ctx.doc.setFontSize(ctx.options.defaultStyle!.fontSize)
    return currentY
  },
  paragraph: (token, currentY, ctx) => {
    const text = cleanText(token.text)
    if (text.trim()) {
      const lines = ctx.doc.splitTextToSize(text, ctx.textWidth)
      ctx.doc.text(lines, ctx.marginLeft, currentY)
      currentY +=
        lines.length *
          ctx.options.defaultStyle!.fontSize *
          ctx.options.defaultStyle!.lineHeight +
        8
    }
    return currentY
  },
  blockquote: (token, currentY, ctx) => {
    ctx.doc.setFont('helvetica', 'italic')
    const text = '> ' + cleanText(token.text)
    const lines = ctx.doc.splitTextToSize(text, ctx.textWidth - 20)
    ctx.doc.text(lines, ctx.marginLeft + 20, currentY)
    currentY +=
      lines.length *
        ctx.options.defaultStyle!.fontSize *
        ctx.options.defaultStyle!.lineHeight +
      8
    ctx.doc.setFont('helvetica', 'normal')
    return currentY
  },
  code: (token, currentY, ctx) => {
    ctx.doc.setFont('courier', 'normal')
    ctx.doc.setFontSize(ctx.options.defaultStyle!.fontSize - 1)
    const text = cleanText(token.text)
    const lines = ctx.doc.splitTextToSize(text, ctx.textWidth - 20)
    const codeHeight =
      lines.length * (ctx.options.defaultStyle!.fontSize - 1) * 1.2 + 8
    ctx.doc.setFillColor(248, 248, 248)
    ctx.doc.rect(
      ctx.marginLeft,
      currentY - (ctx.options.defaultStyle!.fontSize - 1),
      ctx.textWidth,
      codeHeight,
      'F'
    )
    ctx.doc.text(lines, ctx.marginLeft + 10, currentY)
    currentY += codeHeight + 5
    ctx.doc.setFont('helvetica', 'normal')
    ctx.doc.setFontSize(ctx.options.defaultStyle!.fontSize)
    return currentY
  },
  hr: (_token, currentY, ctx) => {
    currentY += 10
    ctx.doc.setLineWidth(1)
    ctx.doc.setDrawColor(200, 200, 200)
    ctx.doc.line(
      ctx.marginLeft,
      currentY,
      ctx.marginLeft + ctx.textWidth,
      currentY
    )
    currentY += 10
    return currentY
  },
  list: (token, currentY, ctx) => {
    return processListForPdf(
      ctx.doc,
      token,
      ctx.marginLeft,
      currentY,
      ctx.textWidth,
      ctx.options
    )
  },
  table: (token, currentY, ctx) => {
    return processTableForPdf(
      ctx.doc,
      token,
      ctx.marginLeft,
      currentY,
      ctx.textWidth,
      ctx.options
    )
  },
  image: (token, currentY, ctx) => {
    const altText = token.alt || 'Image'
    ctx.doc.setFont('helvetica', 'italic')
    const text = `[Image: ${altText}]`
    const lines = ctx.doc.splitTextToSize(text, ctx.textWidth)
    ctx.doc.text(lines, ctx.marginLeft, currentY)
    currentY +=
      lines.length *
        ctx.options.defaultStyle!.fontSize *
        ctx.options.defaultStyle!.lineHeight +
      8
    ctx.doc.setFont('helvetica', 'normal')
    return currentY
  },
  text: (token, currentY, ctx) => {
    const text = cleanText(token.text)
    if (text.trim()) {
      const lines = ctx.doc.splitTextToSize(text, ctx.textWidth)
      ctx.doc.text(lines, ctx.marginLeft, currentY)
      currentY +=
        lines.length *
          ctx.options.defaultStyle!.fontSize *
          ctx.options.defaultStyle!.lineHeight +
        5
    }
    return currentY
  },
}

function processListForPdf(
  doc: jsPDF,
  token: any,
  marginLeft: number,
  startY: number,
  textWidth: number,
  options: PdfOptions
): number {
  let currentY = startY
  token.items.forEach((item: any, index: number) => {
    const prefix = token.ordered ? `${index + 1}. ` : '• '
    let itemText = ''
    if (get(item, 'tokens')) {
      itemText = item.tokens
        .map((subToken: any) => cleanText(subToken.text || ''))
        .join(' ')
    } else {
      itemText = cleanText(item.text || '')
    }
    const fullText = prefix + itemText
    const lines = doc.splitTextToSize(fullText, textWidth - 20)
    doc.text(lines, marginLeft + 20, currentY)
    currentY +=
      lines.length *
        options.defaultStyle!.fontSize *
        options.defaultStyle!.lineHeight +
      3
  })
  return currentY + 5
}

function processTableForPdf(
  doc: jsPDF,
  token: any,
  marginLeft: number,
  startY: number,
  textWidth: number,
  options: PdfOptions
): number {
  let currentY = startY
  if (token.header && token.header.length > 0) {
    const headerTexts = token.header.map((cell: any) =>
      cleanText(cell.text || '')
    )
    const headerText = headerTexts.join(' | ')
    doc.setFont('helvetica', 'bold')
    const headerLines = doc.splitTextToSize(headerText, textWidth)
    doc.text(headerLines, marginLeft, currentY)
    currentY +=
      headerLines.length *
        options.defaultStyle!.fontSize *
        options.defaultStyle!.lineHeight +
      5
    doc.setLineWidth(0.5)
    doc.setDrawColor(150, 150, 150)
    doc.line(marginLeft, currentY, marginLeft + textWidth, currentY)
    currentY += 5
    doc.setFont('helvetica', 'normal')
  }
  if (token.rows && token.rows.length > 0) {
    token.rows.forEach((row: any[]) => {
      const rowTexts = row.map((cell: any) => cleanText(cell.text || ''))
      const rowText = rowTexts.join(' | ')
      const rowLines = doc.splitTextToSize(rowText, textWidth)
      doc.text(rowLines, marginLeft, currentY)
      currentY +=
        rowLines.length *
          options.defaultStyle!.fontSize *
          options.defaultStyle!.lineHeight +
        3
    })
  }
  return currentY + 10
}

function cleanText(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export default convertMdToPdf
