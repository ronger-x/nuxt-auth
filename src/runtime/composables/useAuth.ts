import type { PublicConfig } from '../types'
import { navigateTo, useNuxtApp, useRuntimeConfig } from '#imports'
import { jsonPointerGet } from '../utils/json'
import { useAuthSession } from './useAuthSession'

export function useAuth() {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const authSession = useAuthSession()
  const nuxtApp = useNuxtApp()

  // Login user
  async function login(credentials: Record<string, any>) {
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
      authSession.setToken(extractedToken)

      if (config.refreshToken.enabled) {
        const refreshTokenValue = jsonPointerGet(response, config.refreshToken.responseTokenPointer)
        if (typeof refreshTokenValue !== 'string') {
          console.error(
            `Auth: string token expected, received instead: ${JSON.stringify(refreshTokenValue)}. `
            + `Tried to find token at ${config.refreshToken.responseTokenPointer} in ${JSON.stringify(response)}`
          )
          return
        }
        authSession.setRefreshToken(refreshTokenValue)
      }

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
  async function logout() {
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
  async function register(userData: Record<string, any>) {
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
  function isLoggedIn(): boolean {
    return authSession._loggedInFlag.value
  }

  // Get current user
  function session(): Record<string, any> | null {
    return authSession.session.value
  }

  // fetch user session
  async function fetchUser(): Promise<Record<string, any> | null> {
    return authSession.fetchUser()
  }

  // Set universal token
  function setUniversalToken(accessToken: string, refreshToken: string) {
    authSession.setToken(accessToken)
    authSession.setRefreshToken(refreshToken)
  }

  return {
    login,
    logout,
    register,
    session,
    isLoggedIn,
    fetchUser,
    setUniversalToken
  }
}
