/**
 * Get a property from an object following the JSON Pointer spec.
 *
 * RFC / Standard: https://www.rfc-editor.org/rfc/rfc6901
 *
 * Implementation adapted from https://github.com/manuelstofer/json-pointer/blob/931b0f9c7178ca09778087b4b0ac7e4f505620c2/index.js#L48-L59
 *
 * @param obj
 * @param pointer
 */
export function jsonPointerGet<TResult = string | Record<string, any>>(
  obj: Record<string, any>,
  pointer: string
): TResult {
  const refTokens = Array.isArray(pointer) ? pointer : jsonPointerParse(pointer)

  for (let i = 0; i < refTokens.length; ++i) {
    const tok = refTokens[i]
    if (!(typeof obj === 'object' && tok in obj)) {
      throw new Error(`Invalid reference token: ${tok}`)
    }
    obj = obj[tok]
  }
  return obj as TResult
}

/**
 * Sets a value on an object
 *
 * RFC / Standard: https://www.rfc-editor.org/rfc/rfc6901
 *
 * Adapted from https://github.com/manuelstofer/json-pointer/blob/931b0f9c7178ca09778087b4b0ac7e4f505620c2/index.js#L68-L103
 */
export function jsonPointerSet(
  obj: Record<string, any>,
  pointer: string | string[],
  value: any
): void {
  const refTokens: string[] = Array.isArray(pointer) ? pointer : jsonPointerParse(pointer)

  if (refTokens.length === 0) {
    throw new Error('Cannot set the root object')
  }

  let current: Record<string, any> | any[] = obj
  const lastIndex = refTokens.length - 1

  for (let i = 0; i < lastIndex; ++i) {
    let tok = String(refTokens[i] || '')

    if (tok === '__proto__' || tok === 'constructor' || tok === 'prototype') {
      continue
    }

    if (tok === '-' && Array.isArray(current)) {
      tok = String(current.length)
    }

    const nextTok = String(refTokens[i + 1] || '')
    const isNextTokenArrayIndex = /^(?:\d+|-)$/.test(nextTok)

    // 类型守卫
    if (!(tok in current)) {
      const newValue = isNextTokenArrayIndex ? [] : {}
      if (Array.isArray(current)) {
        current[Number(tok)] = newValue
      }
      else {
        current[tok] = newValue
      }
    }

    // 类型断言
    current = (Array.isArray(current) ? current[Number(tok)] : current[tok]) as Record<string, any> | any[]
  }

  // 处理最后一个 token
  let lastTok = String(refTokens[lastIndex] || '')
  if (lastTok === '-' && Array.isArray(current)) {
    lastTok = String(current.length)
  }

  // 根据 current 的类型进行不同的赋值
  if (Array.isArray(current)) {
    current[Number(lastTok)] = value
  }
  else {
    current[lastTok] = value
  }
}

/**
 * Creates an object from a value and a pointer.
 * This is equivalent to calling `jsonPointerSet` on an empty object.
 * @returns {Record<string, any>} An object with a value set at an arbitrary pointer.
 * @example objectFromJsonPointer('/refresh', 'someToken') // { refresh: 'someToken' }
 */
export function objectFromJsonPointer(pointer: string | string[], value: any): Record<string, any> {
  const result = {}
  jsonPointerSet(result, pointer, value)
  return result
}

/**
 * Converts a json pointer into a array of reference tokens
 *
 * Adapted from https://github.com/manuelstofer/json-pointer/blob/931b0f9c7178ca09778087b4b0ac7e4f505620c2/index.js#L217-L221
 */
function jsonPointerParse(pointer: string): string[] {
  if (pointer === '' || pointer === '/') {
    return []
  }
  if (pointer.charAt(0) !== '/') {
    throw new Error(`Invalid JSON pointer: ${pointer}`)
  }
  return pointer.substring(1).split(/\//).map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))
}
