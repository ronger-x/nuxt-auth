import type { AuthSession, PublicConfig, User } from '../types'
import { useNuxtApp, useRuntimeConfig, useState } from '#imports'
import { jsonPointerGet } from '../utils/json'
import { useAuthToken } from './useAuthToken'
import { useRefreshToken } from './useRefreshToken'

export function useAuthSession() {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const authState = useState<AuthSession>('auth:session', () => ({
    user: null,
    loggedIn: false,
    lastRefreshedAt: undefined
  }))

  const { getToken, getTokenMeta, setToken, isTokenExpired } = useAuthToken()
  const { getRefreshToken, setRefreshToken, clearRefreshToken } = useRefreshToken()
  const nuxtApp = useNuxtApp()

  // 首先定义 refreshAccessToken 函数
  async function refreshAccessToken(): Promise<void> {
    async function handler() {
      const refreshEndpoint = config.endpoints?.refresh
      if (!refreshEndpoint || !refreshEndpoint.path) {
        return
      }
      const response = await nuxtApp.$auth.fetch<Record<string, any>>(refreshEndpoint.path, {
        method: refreshEndpoint.method || 'post',
        body: {
          refreshToken: getRefreshToken()
        }
      })

      // 从响应中提取令牌
      const extractedToken = jsonPointerGet(response, config.accessToken.responseTokenPointer)
      if (typeof extractedToken !== 'string') {
        console.error(
          `Auth: string token expected, received instead: ${JSON.stringify(extractedToken)}. `
          + `Tried to find token at ${config.accessToken.responseTokenPointer} in ${JSON.stringify(response)}`
        )
        return
      }
      setToken(extractedToken)

      const newRefreshTokenValue = jsonPointerGet(response, config.refreshToken.responseTokenPointer)
      if (typeof newRefreshTokenValue !== 'string') {
        console.error(
          `Auth: string token expected, received instead: ${JSON.stringify(newRefreshTokenValue)}. `
          + `Tried to find token at ${config.refreshToken.responseTokenPointer} in ${JSON.stringify(response)}`
        )
        return
      }

      // 存储新令牌
      if (newRefreshTokenValue) {
        setRefreshToken(newRefreshTokenValue)
      }

      // 更新会话
      authState.value.lastRefreshedAt = Date.now()
    }

    nuxtApp.$auth._refreshPromise ||= handler()
    await nuxtApp.$auth._refreshPromise.finally(() => {
      nuxtApp.$auth._refreshPromise = null
    })
  }

  // 设置会话数据
  const setSession = (user: User | null) => {
    authState.value.user = user
    authState.value.loggedIn = !!user
  }

  // 预先声明 clearSession 以避免循环引用问题
  const clearSession = () => {
    setToken(null)
    clearRefreshToken()
    setSession(null)
  }

  // 现在可以安全地使用 refreshAccessToken 和 clearSession
  const getAccessToken = async (): Promise<string | null> => {
    const tokenMeta = getTokenMeta()

    // 如果没有令牌，无法继续
    if (tokenMeta?.token) {
      if (isTokenExpired(tokenMeta)) {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          // 没有刷新令牌，清除会话
          clearSession()
          return null
        }

        // 尝试刷新令牌
        try {
          await refreshAccessToken()
          return getToken()
        }
        catch (error) {
          console.error('Failed to refresh token:', error)
          clearSession()
          return null
        }
      }
      return tokenMeta.token
    }
    else {
      return null
    }
  }

  // 获取当前用户数据
  const fetchUser = async (): Promise<User | null> => {
    const sessionEndpoint = config.endpoints?.getSession
    if (!sessionEndpoint || !sessionEndpoint.path) {
      return null
    }

    try {
      const token = await getAccessToken()
      if (!token) {
        clearSession()
        return null
      }

      const userData = await nuxtApp.$auth.fetch<User>(sessionEndpoint.path, {
        method: sessionEndpoint.method || 'get'
      })

      if (userData) {
        setSession(userData)
        return userData
      }

      return null
    }
    catch (error) {
      console.error('Error fetching user:', error)
      clearSession()
      return null
    }
  }

  return {
    getAccessToken,
    setSession,
    clearSession,
    refreshAccessToken,
    fetchUser,
    session: authState
  }
}
