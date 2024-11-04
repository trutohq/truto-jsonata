import { describe, expect, it } from 'vitest'

import convertMarkdownToSlack from '../functions/convertMarkdownToSlack'

describe('convertMarkdownToSlack', () => {
  describe('convertMarkdownToSlack', () => {
    it('should convert strikethrough markdown to Slack format', () => {
      describe('convertMarkdownToSlack', () => {
        it('should convert bold markdown to Slack format', () => {
          const input = '**bold text**'
          const expectedOutput = '*bold text*'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert italic markdown to Slack format', () => {
          const input = '_italic text_'
          const expectedOutput = '_italic text_'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert strikethrough markdown to Slack format', () => {
          const input = '~~strikethrough text~~'
          const expectedOutput = '~strikethrough text~'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert links markdown to Slack format', () => {
          const input = '[example](http://example.com)'
          const expectedOutput = '<http://example.com|example>'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should handle mixed markdown correctly', () => {
          const input = '**bold** and _italic_ and ~~strikethrough~~'
          const expectedOutput = '*bold* and _italic_ and ~strikethrough~'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should return plain text unchanged', () => {
          const input = 'plain text'
          const expectedOutput = 'plain text'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should handle empty string', () => {
          const input = ''
          const expectedOutput = ''
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert nested bold and italic markdown to Slack format', () => {
          const input = '**bold and _italic_**'
          const expectedOutput = '*bold and _italic_*'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert nested italic and bold markdown to Slack format', () => {
          const input = '_italic and **bold**_'
          const expectedOutput = '_italic and *bold*_'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert code markdown to Slack format', () => {
          const input = '`code`'
          const expectedOutput = '`code`'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert blockquote markdown to Slack format', () => {
          const input = '> blockquote'
          const expectedOutput = '> blockquote'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert unordered list markdown to Slack format', () => {
          const input = '- item1\n- item2'
          const expectedOutput = '• item1\n• item2'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert ordered list markdown to Slack format', () => {
          const input = '1. item1\n2. item2'
          const expectedOutput = '1. item1\n2. item2'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should convert headers markdown to Slack format', () => {
          const input = '# Header 1\n## Header 2'
          const expectedOutput = '*Header 1*\n*Header 2*'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })

        it('should handle complex nested markdown correctly', () => {
          const input = '**bold _italic_ and ~~strikethrough~~**'
          const expectedOutput = '*bold _italic_ and ~strikethrough~*'
          expect(convertMarkdownToSlack(input)).toBe(expectedOutput)
        })
      })
    })
  })
})
