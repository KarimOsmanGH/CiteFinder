import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers'

let embeddingPipelinePromise: Promise<FeatureExtractionPipeline> | null = null

const embeddingCache = new Map<string, Promise<number[]>>()

async function loadEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!embeddingPipelinePromise) {
    embeddingPipelinePromise = pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2', {
      quantized: true
    }) as Promise<FeatureExtractionPipeline>
  }

  return embeddingPipelinePromise
}

export async function embedText(text: string): Promise<number[]> {
  const normalized = text.trim()

  if (!normalized) {
    return []
  }

  let cached = embeddingCache.get(normalized)

  if (!cached) {
    cached = (async () => {
      const extractor = await loadEmbeddingPipeline()
      const output = await extractor(normalized, {
        pooling: 'mean',
        normalize: true
      })

      const data = Array.isArray(output) ? output : output.data

      // Ensure we always return a number[]
      if (Array.isArray(data)) {
        return data as number[]
      }

      if ('length' in data) {
        return Array.from(data as ArrayLike<number>)
      }

      return []
    })()

    cached.catch(() => {
      embeddingCache.delete(normalized)
    })

    embeddingCache.set(normalized, cached)
  }

  return cached
}

export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length === 0 || vectorB.length === 0 || vectorA.length !== vectorB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vectorA.length; i++) {
    const a = vectorA[i]
    const b = vectorB[i]

    dotProduct += a * b
    normA += a * a
    normB += b * b
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear()
}
