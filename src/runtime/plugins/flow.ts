import type { PublicConfig } from '../types'
import { defineNuxtPlugin, useAuth, useAuthSession, useRouter } from '#imports'
import { useAuthToken } from '../composables/useAuthToken'
import { useRefreshToken } from '../composables/useRefreshToken'

export default defineNuxtPlugin({
  name: 'auth:flow',
  enforce: 'post',
  dependsOn: ['auth:provider'],

  setup: async (nuxtApp) => {
    const config = nuxtApp.$config.public.auth as PublicConfig
    const router = useRouter()
    const authToken = useAuthToken()
    const { _loggedInFlag } = useAuthSession()

    nuxtApp.hook('auth:loggedIn', (state) => {
      _loggedInFlag.value = state
    })

    /**
     * Makes sure to sync login status between tabs
     */
    nuxtApp.hook('app:mounted', () => {
      window.onstorage = async (event) => {
        if (event.key === config.loggedInFlagName) {
          if (event.oldValue === 'true' && event.newValue === 'false' && authToken.value) {
            useAuthSession().clearSession()
          }
          else if (event.oldValue === 'false' && event.newValue === 'true') {
            location.reload()
          }
        }
      }
    })

    function isFirstTime() {
      const isPageFound = router.currentRoute.value?.matched.length > 0
      const isPreRendered = typeof nuxtApp.payload.prerenderedAt === 'number'
      const isServerRendered = nuxtApp.payload.serverRendered
      const isServerValid = import.meta.server && !isPreRendered && isPageFound
      const isClientValid = import.meta.client && (!isServerRendered || isPreRendered || !isPageFound)
      return isServerValid || isClientValid
    }

    function canFetchUser() {
      const isCallback = router.currentRoute.value?.path === config.redirect.callback
      const isCallbackValid = isCallback && !router.currentRoute.value?.query.error
      const isRefreshTokenExists = !!useRefreshToken().value
      return isCallbackValid || _loggedInFlag.value || isRefreshTokenExists
    }

    /**
     * Makes sure to refresh access token and set user state if possible (run once)
     */
    if (isFirstTime() && canFetchUser()) {
      await useAuthSession().refreshAccessToken()
      if (authToken.value) {
        await useAuth().fetchUser()
      }
    }

    /**
     * Calls loggedIn hook and sets the loggedIn flag in localStorage
     */
    if (authToken.value) {
      await nuxtApp.callHook('auth:loggedIn', true)
    }
    else {
      _loggedInFlag.value = false
    }
  },
})
