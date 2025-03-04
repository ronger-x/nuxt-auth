import type { PublicConfig, User } from '../types'
import { navigateTo, useNuxtApp, useRuntimeConfig } from '#imports'
import { jsonPointerGet } from '../utils/json'
import { useAuthSession } from './useAuthSession'
import { useAuthToken } from './useAuthToken'
import { useRefreshToken } from './useRefreshToken'

export function useAuth() {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const authSession = useAuthSession()
  const { setToken } = useAuthToken()
  const { setRefreshToken } = useRefreshToken()
  const nuxtApp = useNuxtApp()

  // Login user
  const login = async (credentials: Record<string, any>) => {
    const signInEndpoint = config.endpoints?.signIn
    if (!signInEndpoint || !signInEndpoint.path) {
      throw new Error('Sign in endpoint not configured')
    }

    try {
      const response = await $fetch<Record<string, any>>(signInEndpoint.path, {
        method: signInEndpoint.method || 'post',
        body: credentials
      })

      // Extract tokens from response
      const extractedToken = jsonPointerGet(response, config.accessToken.responseTokenPointer)
      if (typeof extractedToken !== 'string') {
        console.error(
          `Auth: string token expected, received instead: ${JSON.stringify(extractedToken)}. `
          + `Tried to find token at ${config.accessToken.responseTokenPointer} in ${JSON.stringify(response)}`
        )
        return
      }
      setToken(extractedToken)

      const refreshTokenValue = jsonPointerGet(response, config.refreshToken.responseTokenPointer)
      if (typeof refreshTokenValue !== 'string') {
        console.error(
          `Auth: string token expected, received instead: ${JSON.stringify(refreshTokenValue)}. `
          + `Tried to find token at ${config.refreshToken.responseTokenPointer} in ${JSON.stringify(response)}`
        )
        return
      }
      setRefreshToken(refreshTokenValue)

      // Fetch user session
      await authSession.fetchUser()

      return response
    }
    catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout user
  const logout = async () => {
    try {
      const signOutEndpoint = config.endpoints?.signOut
      if (signOutEndpoint && signOutEndpoint.path) {
        await nuxtApp.$auth.fetch(signOutEndpoint.path, {
          method: signOutEndpoint.method || 'post'
        }).catch(() => {
          // Silent fail on logout endpoint
        })
      }
    }
    finally {
      // Always clear local session, even if server logout fails
      authSession.clearSession()

      // Redirect to logout page
      if (config.redirect.logout) {
        navigateTo(config.redirect.logout)
      }
    }
  }

  // Register a new user
  const register = async (userData: Record<string, any>) => {
    const signUpEndpoint = config.endpoints?.signUp
    if (!signUpEndpoint || !signUpEndpoint.path) {
      throw new Error('Sign up endpoint not configured')
    }

    try {
      return await $fetch(signUpEndpoint.path, {
        method: signUpEndpoint.method || 'post',
        body: userData
      })
    }
    catch (error) {
      console.error('Register error:', error)
      throw error
    }
  }

  // Check if user is logged in
  const isLoggedIn = (): boolean => {
    return !!authSession.session.value.loggedIn
  }

  // Get current user
  const getUser = (): User | null => {
    return authSession.session.value.user
  }

  // Refresh user session
  const refreshUser = async (): Promise<User | null> => {
    return authSession.fetchUser()
  }

  return {
    login,
    logout,
    register,
    getUser,
    isLoggedIn,
    refreshUser,
  }
}
