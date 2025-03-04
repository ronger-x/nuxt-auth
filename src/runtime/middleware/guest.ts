import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports'
import { useAuth } from '../composables/useAuth'

export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig().public.auth
  const { isLoggedIn } = useAuth()

  // If user is authenticated, redirect to home page
  if (isLoggedIn()) {
    return navigateTo(config.redirect.home)
  }
})
