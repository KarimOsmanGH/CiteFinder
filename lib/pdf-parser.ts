// Wrapper around pdf-parse to handle initialization issues

/**
 * Parse PDF buffer and extract text content
 * Uses dynamic import to avoid build-time issues with pdf-parse
 */
export async function parsePDF(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  // Dynamic import to avoid build-time issues with pdf-parse
  const pdfParse = (await import('pdf-parse')).default
  
  const result = await pdfParse(buffer)
  
  return {
    text: result.text,
    numpages: result.numpages
  }
}
