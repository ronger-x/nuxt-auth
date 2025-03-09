import type { PublicConfig } from '../types'
import { navigateTo, useNuxtApp, useRoute, useRuntimeConfig } from '#imports'
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
        baseURL: config.baseUrl,
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
      await _onLogin()

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
          baseURL: config.baseUrl,
          method: signOutEndpoint.method || 'post'
        }).catch(() => {
          // Silent fail on logout endpoint
        })
      }
    }
    finally {
      // Always clear local session, even if server logout fails
      await _onLogout()
    }
  }

  /**
   * Logs the user in by fetching the user data, checking if the user is logged in,
   * and redirecting to the specified page after calling the 'auth:loggedIn' hook.
   *
   * @return {Promise<void>} A promise that resolves when the login process is complete.
   */
  async function _onLogin(): Promise<void> {
    await fetchUser()
    if (useAuthSession().session.value === null) {
      return
    }
    const returnToPath = useRoute().query.redirect?.toString()
    const redirectTo = returnToPath ?? config.redirect.home
    await nuxtApp.callHook('auth:loggedIn', true)
    await navigateTo(redirectTo)
  }

  /**
   * Logs the user out by calling the 'auth:loggedIn' hook with the value 'false',
   * setting the token value to null, and navigating to the logout page if the code
   * is running on the client side.
   *
   * @return {Promise<void>} A promise that resolves when the logout process is complete.
   */
  async function _onLogout(): Promise<void> {
    await nuxtApp.callHook('auth:loggedIn', false)
    authSession.clearSession()
    if (import.meta.client) {
      await navigateTo(config.redirect.logout, { external: true })
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
        baseURL: config.baseUrl,
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
