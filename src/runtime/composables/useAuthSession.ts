import type { PublicConfig } from '../types'
import { useNuxtApp, useRuntimeConfig, useState } from '#imports'
import { jsonPointerGet } from '../utils/json'
import { useAuthToken } from './useAuthToken'
import { useRefreshToken } from './useRefreshToken'

const AUTH_CONSTANTS = {
  DEFAULT_ACCESS_TOKEN_MAX_AGE: 1800,
  DEFAULT_REFRESH_TOKEN_MAX_AGE: 1800,
  DEFAULT_SESSION_POINTER: '/session',
  STATE_KEY: 'auth:session'
} as const

export function useAuthSession() {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const authState = useState<Record<string, any> | null>(
    AUTH_CONSTANTS.STATE_KEY,
    () => null
  )

  const _authToken = useAuthToken()
  const _refreshToken = useRefreshToken()

  const _loggedInFlag = {
    get value() {
      return import.meta.client ? localStorage.getItem(config.loggedInFlagName!) === 'true' : false
    },
    set value(value: boolean) {
      if (import.meta.client) {
        localStorage.setItem(config.loggedInFlagName!, value.toString())
      }
    },
  }

  const nuxtApp = useNuxtApp()

  // 添加 Token 验证函数
  function validateToken(token: unknown, context: string): string | null {
    if (typeof token !== 'string') {
      console.error(
        `Auth: string token expected in ${context}, received: ${JSON.stringify(token)}`
      )
      return null
    }
    return token
  }

  // 首先定义 refreshAccessToken 函数
  async function refreshAccessToken(): Promise<void> {
    async function handler() {
      const refreshEndpoint = config.endpoints?.refresh
      if (!refreshEndpoint?.path) {
        return
      }

      const response = await nuxtApp.$auth.fetch<Record<string, any>>(
        refreshEndpoint.path,
        {
          baseURL: config.baseUrl,
          method: refreshEndpoint.method || 'post',
          body: { refreshToken: _refreshToken }
        }
      )

      const accessToken = validateToken(
        jsonPointerGet(response, config.accessToken.responseTokenPointer),
        'access token'
      )
      if (!accessToken) {
        return
      }

      _authToken.value = {
        token: accessToken,
        expires: new Date().getTime() + (config.accessToken.maxAge || 1800) * 1000
      }

      if (config.refreshToken.enabled) {
        const refreshToken = validateToken(
          jsonPointerGet(response, config.refreshToken.responseTokenPointer),
          'refresh token'
        )
        if (refreshToken) {
          _refreshToken.value = {
            token: refreshToken,
            expires: new Date().getTime() + (config.refreshToken.maxAge || 1800) * 1000
          }
        }
      }
    }

    nuxtApp.$auth._refreshPromise ||= handler()
    await nuxtApp.$auth._refreshPromise.finally(() => {
      nuxtApp.$auth._refreshPromise = null
    })
  }

  // 设置会话数据
  const setSession = (user: Record<string, any> | null) => {
    authState.value = user
  }

  // 预先声明 clearSession 以避免循环引用问题
  const clearSession = () => {
    _authToken.value = null
    _refreshToken.value = null
    setSession(null)
    nuxtApp.callHook('auth:loggedIn', false)
  }

  // 现在可以安全地使用 refreshAccessToken 和 clearSession
  async function getAccessToken(): Promise<string | null> {
    // 如果没有令牌，无法继续
    if (_authToken.value) {
      if (_authToken.expired) {
        if (!_refreshToken) {
          // 没有刷新令牌，清除会话
          clearSession()
          return null
        }

        // 尝试刷新令牌
        try {
          await refreshAccessToken()
          return _authToken.value.token
        }
        catch (error) {
          handleAuthError(error, 'Failed to refresh token')
        }
      }
      return _authToken.value.token
    }
    else {
      return null
    }
  }

  function setToken(token: string) {
    const maxAge = config.accessToken.maxAge || 1800
    _authToken.value = {
      token,
      expires: new Date().getTime() + maxAge * 1000
    }
  }

  function setRefreshToken(token: string) {
    const maxAge = config.refreshToken.maxAge || 1800
    _refreshToken.value = {
      token,
      expires: new Date().getTime() + maxAge * 1000
    }
  }

  // 添加一个统一的错误处理函数
  function handleAuthError(error: unknown, context: string) {
    console.error(`Auth error (${context}):`, error)
    clearSession()
    return null
  }

  // 获取当前用户数据
  async function fetchUser(): Promise<Record<string, any> | null> {
    const sessionEndpoint = config.endpoints?.getSession
    if (!sessionEndpoint?.path) {
      return null
    }

    try {
      const token = await getAccessToken()
      if (!token) {
        return null
      }

      const response = await nuxtApp.$auth.fetch<Record<string, any>>(
        sessionEndpoint.path,
        {
          baseURL: config.baseUrl,
          method: sessionEndpoint.method || 'get'
        }
      )

      const sessionPointer = config.session.responseSessionPointer || '/session'
      const extractedSession = jsonPointerGet(response, sessionPointer)

      if (typeof extractedSession !== 'object') {
        return handleAuthError(
          new Error('Invalid session format'),
          `Invalid session data at ${sessionPointer}`
        )
      }

      if (extractedSession) {
        setSession(extractedSession)
        return extractedSession
      }

      return null
    }
    catch (error) {
      return handleAuthError(error, 'fetchUser')
    }
  }

  return {
    getAccessToken,
    setToken,
    setRefreshToken,
    setSession,
    clearSession,
    refreshAccessToken,
    fetchUser,
    session: authState,
    _loggedInFlag
  }
}
