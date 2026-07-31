export const resumePdfUrl = 'https://local.andy.uno/Andy-Anderson-Resume.pdf'

let resumePdfBufferPromise: Promise<ArrayBuffer> | null = null

function loadResumePdfBuffer() {
  if (!resumePdfBufferPromise) {
    resumePdfBufferPromise = fetch(resumePdfUrl, {
      cache: 'force-cache',
      credentials: 'omit',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Resume PDF request failed with status ${response.status}.`)
        }

        return response.arrayBuffer()
      })
      .catch((reason) => {
        resumePdfBufferPromise = null
        throw reason
      })
  }

  return resumePdfBufferPromise
}

export async function preloadResumePdf() {
  await loadResumePdfBuffer()
}

export async function getResumePdfData() {
  const buffer = await loadResumePdfBuffer()
  return new Uint8Array(buffer.slice(0))
}
