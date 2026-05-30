import { defineEventHandler, proxyRequest, createError } from 'h3'

export default defineEventHandler(async (event) => {
  let config: any
  try {
    config = useRuntimeConfig()
  } catch (e) {
    config = { apiBaseUrl: 'http://localhost:8000' }
  }
  
  // Extract target subpath by removing the '/api' prefix (e.g. '/api/status' -> '/status')
  const subpath = event.path.replace(/^\/api/, '')
  
  // Construct the target URL on the remote Python daemon
  const targetUrl = `${config.apiBaseUrl}${subpath}`
  
  try {
    return await proxyRequest(event, targetUrl)
  } catch (error: any) {
    console.error(`[Proxy Error] Failed to forward request to ${targetUrl}:`, error)
    
    throw createError({
      statusCode: 502,
      statusMessage: `CCTV Monitoring Daemon at ${config.apiBaseUrl} is unreachable.`
    })
  }
})
