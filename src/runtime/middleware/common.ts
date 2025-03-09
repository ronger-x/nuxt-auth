import type { PublicConfig } from '../types'
import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports'
import { useAuthToken } from '../composables/useAuthToken'

export default defineNuxtRouteMiddleware((to, from) => {
  const publicConfig = useRuntimeConfig().public.auth as PublicConfig

  if (
    to.path === publicConfig.redirect.login
    || to.path === publicConfig.redirect.callback
  ) {
    if (useAuthToken().value) {
      const returnToPath = from.query.redirect?.toString()
      const redirectTo = returnToPath ?? publicConfig.redirect.home
      return navigateTo(redirectTo)
    }
  }
})
