import crypto from 'crypto'

export function sign(payload: Record<string, string>, key: string): string {
  if (!key) {
    throw new Error('Require key')
  }
  const data = [
    base64urlEncode(JSON.stringify({ typ: 'JWT', alg: 'HS256' })),
    base64urlEncode(JSON.stringify(payload)),
  ]
  const signature = base64urlEscape(
    crypto.createHmac('sha256', key).update(data.join('.')).digest('base64')
  )

  return [...data, signature].join('.')
}

function base64urlEncode(str) {
  return base64urlEscape(Buffer.from(str).toString('base64'))
}

function base64urlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
