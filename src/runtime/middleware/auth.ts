import type { PublicConfig } from '../types'
import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports'
import { useAuthToken } from '../composables/useAuthToken'

export default defineNuxtRouteMiddleware((to) => {
  const publicConfig = useRuntimeConfig().public.auth as PublicConfig

  if (
    to.path === publicConfig.redirect.login
    || to.path === publicConfig.redirect.callback
  ) {
    return
  }

  const isPageFound = to.matched.length > 0
  const isAuthDisabled = publicConfig.enableGlobalAuthMiddleware && to.meta.auth === false

  if (isAuthDisabled || (to.meta.middleware === 'guest') || (!isPageFound && import.meta.server)) {
    return
  }

  if (!useAuthToken().getToken()) {
    return navigateTo({
      path: publicConfig.redirect.login,
      query: { redirect: to.fullPath },
    })
  }
})
