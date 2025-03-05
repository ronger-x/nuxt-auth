import type { PublicConfig, TokenMeta } from '../types'
import { useCookie, useRuntimeConfig, useState } from '#imports'

function memoryStorage() {
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
export function useRefreshToken() {
  const state = useState<TokenMeta | null>('auth-refresh-token', () => null)
  const config = useRuntimeConfig().public.auth as PublicConfig
  const cookieName = config.refreshToken.cookieName || 'auth.refresh-token'
  const maxAge = config.accessToken.maxAge || 1800
  // 使用 cookie 存储令牌以防页面刷新
  const refreshTokenCookie = useCookie<TokenMeta | null>(cookieName, {
    maxAge,
    sameSite: 'strict',
    secure: true
  })

  // 初始化：从 cookie 恢复令牌状态
  const initTokens = async () => {
    if (import.meta.client) {
      // 尝试从 cookie 恢复令牌
      if (refreshTokenCookie.value) {
        memory.value = {
          ...refreshTokenCookie.value
        }
      }
    }
  }

  // 初始化令牌
  if (import.meta.client) {
    initTokens().finally(() => {
      // 清除 SSR 状态
      if (state.value) {
        memory.value = {
          ...state.value
        }
        state.value = null
      }
    })
  }

  if (import.meta.client && state.value) {
    memory.value = { ...state.value }
    state.value = null
  }

  return {
    get value() {
      return import.meta.client ? memory.value : state.value
    },

    set value(data: TokenMeta | null) {
      if (import.meta.client) {
        memory.value = data
      }
      else {
        state.value = data
      }
    },

    get expired() {
      if (this.value) {
        const msRefreshBeforeExpires = 10000
        const expires = this.value.expires - msRefreshBeforeExpires
        return expires < Date.now()
      }
      return false
    },
  }
}
