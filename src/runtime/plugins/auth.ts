import type { PublicConfig } from '../types'
import { defineNuxtPlugin, useRequestHeaders, useRuntimeConfig } from '#imports'
import { defu } from 'defu'
import { createStorage } from 'unstorage'
import { useAuthSession } from '../composables/useAuthSession'
import { useRefreshToken } from '../composables/useRefreshToken'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const authBaseUrl = config.authBaseUrl || config.baseUrl || '/api/auth'

  // Init auth state
  const authSession = useAuthSession()

  // Create storage instance for auth data
  const authStorage = createStorage()

  // Fetch headers
  const reqHeaders = useRequestHeaders(['user-agent'])

  // Create a $fetch instance with auto token handling
  const fetch = $fetch.create({
    baseURL: authBaseUrl,

    async onRequest({ options }) {
      const accessToken = await authSession.getAccessToken()

      if (accessToken) {
        options.headers = defu(options.headers, reqHeaders, {
          authorization: `${config.accessToken.type || 'Bearer '} ${accessToken}`,
        })
      }

      options.credentials ||= 'omit'
    },

    async onResponseError({ response }) {
      // Handle 401 responses - token might be invalid
      if (response.status === 401) {
        // Try to refresh token if session is still active
        if (authSession.session.value.loggedIn) {
          const refreshToken = useRefreshToken().getRefreshToken()
          if (refreshToken) {
            try {
              // Try refreshing the token
              await authSession.refreshAccessToken()
            }
            catch (error) {
              console.error('Failed to refresh token on 401 response', error)
              authSession.clearSession()
            }
          }
          else {
            // No refresh token available
            authSession.clearSession()
          }
        }
      }

      // Allow custom hooks to handle fetch errors
      await nuxtApp.callHook('auth:fetchError', response)
    },
  })

  // Initialize the session on app startup
  nuxtApp.hooks.hookOnce('app:created', async () => {
    try {
      // Try to restore the session
      await authSession.fetchUser()
    }
    catch (error) {
      console.error('Failed to restore auth session:', error)
      authSession.clearSession()
    }
  })

  return {
    provide: {
      auth: {
        fetch,
        storage: authStorage,
        _refreshPromise: null,
      },
    },
  }
})
