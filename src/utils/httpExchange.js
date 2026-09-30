const HTTP_START = /^(GET|POST|PUT|HEAD|DELETE|OPTIONS|PATCH|TRACE|CONNECT|HTTP\/)/i
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/
const STATUS_LINE = /\n(HTTP\/\d(?:\.\d)?\s+\d{3})/

function tryBase64Decode(value) {
  if (value.length < 40 || value.length % 4 !== 0) return null
  if (!BASE64.test(value)) return null
  try {
    const decoded = atob(value)
    if (!/^[\x09\x0a\x0d\x20-\x7e]*$/.test(decoded)) return null
    return decoded
  } catch {
    return null
  }
}

export function normalizeRequest(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const raw = value.trim()
  if (HTTP_START.test(raw)) return raw
  return tryBase64Decode(raw) || raw
}

export function splitHttpExchange(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return { request: '', response: '' }
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const match = text.match(STATUS_LINE)
  if (!match) return { request: '', response: text.trim() }
  return {
    request: text.slice(0, match.index).trim(),
    response: text.slice(match.index + 1).trim(),
  }
}

export function buildHttpExchange(rawText, vuln) {
  const split = splitHttpExchange(rawText)
  const request = split.request || normalizeRequest(vuln?.request) || ''
  const response = split.response || (vuln?.response_info ? String(vuln.response_info) : '')
  return { request, response, hasData: Boolean(request || response) }
}
