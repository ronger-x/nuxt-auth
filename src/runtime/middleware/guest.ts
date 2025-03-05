import type { PublicConfig } from '../types'
import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports'
import { useAuthSession } from '../composables/useAuthSession'

export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig().public.auth as PublicConfig
  const { _loggedInFlag } = useAuthSession()

  // If user is authenticated, redirect to home page
  if (_loggedInFlag) {
    return navigateTo(config.redirect.home)
  }
})
