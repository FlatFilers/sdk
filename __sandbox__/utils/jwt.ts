export function sign(payload: Record<string, string>, key: string): Promise<string> {
  if (!key) {
    throw new Error('Key is required.')
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const cryptoSubtle: SubtleCrypto =
    (window.crypto && crypto.subtle) ||
    (window.crypto && (crypto as any).webkitSubtle) ||
    ((window as any).msCrypto && (window as any).msCrypto.Subtle)
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (!cryptoSubtle) {
    throw new Error('Could not generate JWT (crypto.subtle is not found).')
  }

  const importAlgorithm = {
    name: 'HMAC',
    hash: {
      name: 'SHA-256',
    },
  }

  let payloadAsJSON: string

  try {
    payloadAsJSON = JSON.stringify(payload)
  } catch (err) {
    throw err
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const headerAsJSON = JSON.stringify(header)

  const partialToken =
    base64Stringify(utf8ToUint8Array(headerAsJSON)) +
    '.' +
    base64Stringify(utf8ToUint8Array(payloadAsJSON))

  const keyData = utf8ToUint8Array(key)

  return cryptoSubtle.importKey('raw', keyData, importAlgorithm, false, ['sign']).then((key) => {
    const characters = payloadAsJSON.split('')
    const it = utf8ToUint8Array(payloadAsJSON).entries()
    let i = 0
    const result = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: IteratorResult<[number, number], any>

    while (!(current = it.next()).done) {
      result.push([current.value[1], characters[i]])
      i++
    }

    const messageAsUint8Array = utf8ToUint8Array(partialToken)

    return cryptoSubtle.sign(importAlgorithm.name, key, messageAsUint8Array).then((signature) => {
      const signatureAsBase64 = base64Stringify(new Uint8Array(signature))
      return partialToken + '.' + signatureAsBase64
    })
  })
}

function base64Stringify(a: Uint8Array) {
  return btoa(String.fromCharCode.apply(0, a))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64Parse(a: string) {
  a = a.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  return new Uint8Array(Array.prototype.map.call(atob(a), (c: string) => c.charCodeAt(0)))
}

function utf8ToUint8Array(str: string | number | boolean) {
  return base64Parse(window.btoa(unescape(encodeURIComponent(str))))
}
