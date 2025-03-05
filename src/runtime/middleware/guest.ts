import type { PublicConfig } from '../types'
import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports'
import { useAuthToken } from '../composables/useAuthToken'

export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig().public.auth as PublicConfig

  // If user is authenticated, redirect to home page
  if (useAuthToken().value) {
    return navigateTo(config.redirect.home)
  }
})
