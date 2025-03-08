import type { PublicConfig, TokenMeta } from '../types'
import { useCookie, useRuntimeConfig, useState } from '#imports'

function memoryStorage(): {
  value: TokenMeta | null
} {
  let store: TokenMeta | null = null

  return {
    get value() {
      return store
    },
    set value(data: TokenMeta | null) {
      if (import.meta.client) {
        store = data
      }
    },
  }
}

const memory = memoryStorage()

/**
 * This composable permits the storage of access token in memory
 * On server-side, it's stored with `useState`. On client-side its stored in a scoped memory.
 * Given that `useState` is accessible on global context, it's cleared on client-side.
 */
export function useAuthToken() {
  const state = useState<TokenMeta | null>('auth:token', () => null)
  const config = useRuntimeConfig().public.auth as PublicConfig
  const cookieName = config.refreshToken.cookieName || 'auth.token'
  const maxAge = config.accessToken.maxAge || 1800

  // 使用 cookie 存储令牌以防页面刷新
  const accessTokenCookie = useCookie<TokenMeta | null>(cookieName, {
    maxAge, // 7天有效期
    sameSite: 'strict',
    secure: true
  })

  // 初始化令牌
  if (import.meta.client) {
    try {
      if (accessTokenCookie.value) {
        memory.value = { ...accessTokenCookie.value }
      }
    }
    catch (error) {
      console.error('Failed to initialize from cookie:', error)
      // 可以选择清除无效的 cookie
      accessTokenCookie.value = null
    }
    if (state.value) {
      memory.value = { ...state.value }
      state.value = null
    }
  }

  if (import.meta.client && state.value) {
    memory.value = { ...state.value }
    state.value = null
  }

  const MS_REFRESH_BEFORE_EXPIRES = 10000 // 提取常量

  return {
    get value() {
      return import.meta.client ? memory.value : state.value
    },

    set value(data: TokenMeta | null) {
      if (import.meta.client) {
        memory.value = data
        memory.value = data
        // 同步到 cookie
        accessTokenCookie.value = data
      }
      else {
        state.value = data
      }
    },

    get expired() {
      const token = this.value
      if (!token) {
        return false
      }
      return (token.expires - MS_REFRESH_BEFORE_EXPIRES) < Date.now()
    },
  }
}
