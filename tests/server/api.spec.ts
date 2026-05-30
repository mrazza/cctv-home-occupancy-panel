import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '../../server/api/[...path]'
import { proxyRequest, createError } from 'h3'

// Mock h3 imports
vi.mock('h3', () => {
  return {
    defineEventHandler: (fn: any) => fn,
    proxyRequest: vi.fn(),
    createError: vi.fn((opts: any) => opts)
  }
})

describe('Nitro catch-all API server proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('correctly proxy requests by extracting the prefix', async () => {
    const mockEvent = {
      path: '/api/status'
    } as any

    vi.mocked(proxyRequest).mockResolvedValue({ success: true } as any)

    const result = await handler(mockEvent)

    expect(proxyRequest).toHaveBeenCalledWith(mockEvent, 'http://localhost:8000/status')
    expect(result).toEqual({ success: true })
  })

  it('correctly proxy requests with nested paths', async () => {
    const mockEvent = {
      path: '/api/snapshot/crop_123.jpg'
    } as any

    vi.mocked(proxyRequest).mockResolvedValue({ bytes: [] } as any)

    const result = await handler(mockEvent)

    expect(proxyRequest).toHaveBeenCalledWith(mockEvent, 'http://localhost:8000/snapshot/crop_123.jpg')
    expect(result).toEqual({ bytes: [] })
  })

  it('handles proxy connection failures by raising 502 Bad Gateway errors', async () => {
    const mockEvent = {
      path: '/api/status'
    } as any

    const testError = new Error('Connection refused')
    vi.mocked(proxyRequest).mockRejectedValue(testError)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      await handler(mockEvent)
      // If handler doesn't throw, fail the test
      expect(true).toBe(false)
    } catch (e: any) {
      expect(proxyRequest).toHaveBeenCalledWith(mockEvent, 'http://localhost:8000/status')
      expect(createError).toHaveBeenCalledWith({
        statusCode: 502,
        statusMessage: 'CCTV Monitoring Daemon at http://localhost:8000 is unreachable.'
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})
