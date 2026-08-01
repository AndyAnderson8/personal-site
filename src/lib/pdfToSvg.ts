type Glyph = {
  fontChar: string
  isSpace: boolean
  width: number
}

type Font = {
  loadedName: string
}

type FontPath = {
  path?: ArrayLike<number>
}

type GraphicsState = {
  charSpacing: number
  fill: string
  fontId: string
  fontSize: number
  textMatrix: number[]
}

function svgPath(values: ArrayLike<number>) {
  const path: (string | number)[] = []
  for (let index = 0; index < values.length;) {
    const operation = values[index++]
    const argumentCount = operation === 0 || operation === 1 ? 2 : operation === 2 ? 6 : 4
    const command = operation === 0 ? 'M' : operation === 1 ? 'L' : operation === 2 ? 'C' : 'Q'

    if (operation === 4) {
      path.push('Z')
      continue
    }
    path.push(command)
    for (let argument = 0; argument < argumentCount; argument++) path.push(values[index++]!)
  }
  return path.join(' ')
}

export async function pdfToSvg(pdf: ArrayBuffer, signal?: AbortSignal) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  if (typeof window !== 'undefined') {
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdf),
    disableFontFace: true,
    fontExtraProperties: true,
  })
  const abort = () => void loadingTask.destroy()
  signal?.addEventListener('abort', abort, { once: true })

  try {
    signal?.throwIfAborted()
    const document = await loadingTask.promise
    const page = await document.getPage(1)
    const operators = await page.getOperatorList()
    signal?.throwIfAborted()

    const [left, bottom, right, top] = page.view
    const width = right - left
    const height = top - bottom
    const state: GraphicsState = {
      charSpacing: 0,
      fill: '#000',
      fontId: '',
      fontSize: 0,
      textMatrix: [1, 0, 0, 1, 0, 0],
    }
    const stack: GraphicsState[] = []
    const glyphIds = new Map<string, string>()
    const glyphs: string[] = []
    const rules: string[] = []
    const uses: string[] = []

    for (let index = 0; index < operators.fnArray.length; index++) {
      const operation = operators.fnArray[index]
      const args = operators.argsArray[index] as unknown[]

      if (operation === pdfjs.OPS.save) {
        stack.push({ ...state, textMatrix: [...state.textMatrix] })
      } else if (operation === pdfjs.OPS.restore) {
        Object.assign(state, stack.pop())
      } else if (operation === pdfjs.OPS.setFillRGBColor) {
        state.fill = String(args[0])
      } else if (operation === pdfjs.OPS.setCharSpacing) {
        state.charSpacing = Number(args[0])
      } else if (operation === pdfjs.OPS.setFont) {
        state.fontId = String(args[0])
        state.fontSize = Number(args[1])
      } else if (operation === pdfjs.OPS.setTextMatrix) {
        state.textMatrix = Array.from(args[0] as ArrayLike<number>)
      } else if (operation === pdfjs.OPS.constructPath) {
        const paint = Number(args[0])
        if (paint !== pdfjs.OPS.fill && paint !== pdfjs.OPS.eoFill) continue
        const [x1, y1, x2, y2] = args[2] as number[]
        rules.push(
          `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="${state.fill}"/>`,
        )
      } else if (operation === pdfjs.OPS.showText) {
        const font = page.commonObjs.get(state.fontId) as Font
        const [a, b, c, d, e, f] = state.textMatrix
        let x = 0

        for (const item of args[0] as (Glyph | number)[]) {
          if (typeof item === 'number') {
            x -= (item * state.fontSize) / 1000
          } else {
            if (!item.isSpace) {
              const key = `${state.fontId}:${item.fontChar}`
              let glyphId = glyphIds.get(key)
              if (!glyphId) {
                const outline = page.commonObjs.get(
                  `${font.loadedName}_path_${item.fontChar}`,
                ) as FontPath
                if (outline.path) {
                  glyphId = `glyph-${glyphIds.size}`
                  glyphIds.set(key, glyphId)
                  glyphs.push(`<path id="${glyphId}" d="${svgPath(outline.path)}"/>`)
                }
              }
              if (glyphId) {
                const size = state.fontSize
                uses.push(
                  `<use href="#${glyphId}" fill="${state.fill}" transform="matrix(${a * size} ${-b * size} ${c * size} ${-d * size} ${a * x + e - left} ${top - (b * x + f)})"/>`,
                )
              }
            }
            x += (item.width * state.fontSize) / 1000 + state.charSpacing
          }
        }
      }
    }

    return new Blob(
      [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
        `<defs>${glyphs.join('')}</defs>`,
        `<g transform="matrix(1 0 0 -1 ${-left} ${top})">${rules.join('')}</g>`,
        uses.join(''),
        '</svg>',
      ],
      { type: 'image/svg+xml' },
    )
  } catch (reason) {
    if (signal?.aborted) throw signal.reason
    throw reason
  } finally {
    signal?.removeEventListener('abort', abort)
    await loadingTask.destroy()
  }
}
