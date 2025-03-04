import type { PublicConfig, TokenMeta } from '../types'
import { useCookie, useRuntimeConfig } from '#imports'

export function useRefreshToken() {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const refreshTokenCookieName = config.refreshToken.cookieName || 'auth.refresh-token'
  const refreshTokenMaxAge = config.refreshToken.maxAge || 60 * 60 * 24 * 30 // Default 30 days

  // Get refresh token metadata
  const getRefreshTokenMeta = (): TokenMeta | null => {
    if (config.storage === 'localStorage' && process.client) {
      try {
        const stored = localStorage.getItem(`nuxt-auth:${refreshTokenCookieName}`)
        if (stored) {
          return JSON.parse(stored)
        }
      }
      catch (e) {
        console.error('Failed to parse refresh token from localStorage:', e)
      }
      return null
    }
    else {
      // Default to cookie storage
      const tokenCookie = useCookie<string | null>(refreshTokenCookieName)
      const metaCookie = useCookie<number | null>(`${refreshTokenCookieName}-expires`)

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

  // Get refresh token string
  const getRefreshToken = (): string | null => {
    const meta = getRefreshTokenMeta()
    return meta?.token || null
  }

  // Set refresh token with expiry
  const setRefreshToken = (token: string | null): string | null => {
    const expiresAt = token ? Date.now() + (refreshTokenMaxAge * 1000) : 0

    if (config.storage === 'localStorage' && process.client) {
      if (token) {
        const meta: TokenMeta = { token, expiresAt }
        localStorage.setItem(`nuxt-auth:${refreshTokenCookieName}`, JSON.stringify(meta))
      }
      else {
        localStorage.removeItem(`nuxt-auth:${refreshTokenCookieName}`)
      }
    }
    else {
      // Default to cookie storage
      const tokenCookie = useCookie<string | null>(refreshTokenCookieName, {
        default: () => null,
        maxAge: refreshTokenMaxAge,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      const metaCookie = useCookie<number | null>(`${refreshTokenCookieName}-expires`, {
        maxAge: refreshTokenMaxAge,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      tokenCookie.value = token
      metaCookie.value = token ? expiresAt : null
    }

    return token
  }

  // Clear refresh token
  const clearRefreshToken = () => {
    setRefreshToken(null)
  }

  return {
    getRefreshToken,
    getRefreshTokenMeta,
    setRefreshToken,
    clearRefreshToken
  }
}
