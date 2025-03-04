import type { PublicConfig, TokenMeta } from '../types'
import { useCookie, useRuntimeConfig } from '#imports'

export function useAuthToken() {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const tokenCookieName = config.accessToken.cookieName || 'auth.token'
  const tokenMaxAge = config.accessToken.maxAge || 1800

  // Check if token is expired
  const isTokenExpired = (meta: TokenMeta | null): boolean => {
    if (!(!meta || !meta.expiresAt)) {
      const msRefreshBeforeExpires = 10000
      const expires = meta.expiresAt - msRefreshBeforeExpires
      return expires < Date.now()
    }
    else {
      return true
    }
  }

  // Get token and metadata
  const getTokenMeta = (): TokenMeta | null => {
    if (config.storage === 'localStorage' && process.client) {
      try {
        const stored = localStorage.getItem(`nuxt-auth:${tokenCookieName}`)
        if (stored) {
          return JSON.parse(stored)
        }
      }
      catch (e) {
        console.error('Failed to parse token from localStorage:', e)
      }
      return null
    }
    else {
      // Default to cookie storage
      const tokenCookie = useCookie<string | null>(tokenCookieName)
      const metaCookie = useCookie<number | null>(`${tokenCookieName}-expires`)

      if (tokenCookie.value) {
        return {
          token: tokenCookie.value,
          expiresAt: metaCookie.value || 0
        }
      }
      else {
        return null
      }
    }
  }

  // Get token string
  const getToken = (): string | null => {
    const meta = getTokenMeta()
    return meta?.token || null
  }

  // Set token with expiry
  const setToken = (token: string | null): string | null => {
    const expiresAt = token ? Date.now() + (tokenMaxAge * 1000) : 0

    if (config.storage === 'localStorage' && process.client) {
      if (token) {
        const meta: TokenMeta = { token, expiresAt }
        localStorage.setItem(`nuxt-auth:${tokenCookieName}`, JSON.stringify(meta))
      }
      else {
        localStorage.removeItem(`nuxt-auth:${tokenCookieName}`)
      }
    }
    else {
      // Default to cookie storage
      const tokenCookie = useCookie<string | null>(tokenCookieName, {
        maxAge: tokenMaxAge,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      const metaCookie = useCookie<number | null>(`${tokenCookieName}-expires`, {
        maxAge: tokenMaxAge,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      tokenCookie.value = token
      metaCookie.value = token ? expiresAt : null
    }

    return token
  }

  return {
    getToken,
    getTokenMeta,
    setToken,
    isTokenExpired
  }
}
