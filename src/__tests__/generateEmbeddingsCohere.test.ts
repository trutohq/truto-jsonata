import { describe, it, expect } from 'vitest'
import generateEmbeddingsCohere from '../functions/generateEmbeddingsCohere'

describe('generateEmbeddingsCohere', async () => {
  it('should return the embeddings', async () => {
    const response = await generateEmbeddingsCohere(
      {
        model: 'embed-multilingual-v3.0',
        texts: ['hello', 'goodbye'],
        input_type: 'classification',
        embedding_types: ['float'],
      },
      'snfPPHgEY71rRZsxRj81jr8Ku2uXlRM8C5dMR1h3'
    )
    expect(response).toHaveProperty('id')
  })
})
