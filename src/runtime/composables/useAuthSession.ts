import type { PublicConfig } from '../types'
import { useNuxtApp, useRuntimeConfig, useState } from '#imports'
import { jsonPointerGet } from '../utils/json'
import { useAuthToken } from './useAuthToken'
import { useRefreshToken } from './useRefreshToken'

export function useAuthSession() {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const authState = useState<Record<string, any> | null>('auth:session', () => null)

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
          refreshToken: _refreshToken
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

      const accessTokenMaxAge = config.accessToken.maxAge || 1800

      _authToken.value = {
        token: extractedToken,
        expires: new Date().getTime() + accessTokenMaxAge * 1000
      }

      if (config.refreshToken.enabled) {
        const newRefreshTokenValue = jsonPointerGet(response, config.refreshToken.responseTokenPointer)
        if (typeof newRefreshTokenValue !== 'string') {
          console.error(
            `Auth: string token expected, received instead: ${JSON.stringify(newRefreshTokenValue)}. `
            + `Tried to find token at ${config.refreshToken.responseTokenPointer} in ${JSON.stringify(response)}`
          )
          return
        }

        const refreshTokenMaxAge = config.refreshToken.maxAge || 1800

        // 存储新令牌
        if (newRefreshTokenValue) {
          _refreshToken.value = {
            token: newRefreshTokenValue,
            expires: new Date().getTime() + refreshTokenMaxAge * 1000
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
          console.error('Failed to refresh token:', error)
          clearSession()
          return null
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

  // 获取当前用户数据
  async function fetchUser(): Promise<Record<string, any> | null> {
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

      const response = await nuxtApp.$auth.fetch<Record<string, any>>(sessionEndpoint.path, {
        method: sessionEndpoint.method || 'get'
      })
      const sessionPointer = config.session.responseSessionPointer || '/session'

      // 从响应中提取令牌
      const extractedSession = jsonPointerGet(response, sessionPointer)
      if (typeof extractedSession !== 'object') {
        console.error(
          `Auth: string token expected, received instead: ${JSON.stringify(extractedSession)}. `
          + `Tried to find token at ${config.accessToken.responseTokenPointer} in ${JSON.stringify(response)}`
        )
        return null
      }

      if (extractedSession) {
        setSession(extractedSession)
        nuxtApp.callHook('auth:loggedIn', true)
        return extractedSession
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
