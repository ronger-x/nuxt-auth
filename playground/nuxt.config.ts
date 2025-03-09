import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../src/module'],

  app: {
    head: {
      title: 'Nuxt Auth',
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  auth: {
    baseUrl: '/api',
    enableGlobalAuthMiddleware: false,
    accessToken: {
      responseTokenPointer: '/data/token',
      type: 'Bearer',
      cookieName: 'auth.token',
      headerName: 'Authorization',
      maxAge: 5 * 60,
    },
    refreshToken: {
      responseTokenPointer: '/data/refreshToken',
      refreshRequestTokenPointer: '/data/refreshToken',
      cookieName: 'auth.refresh-token',
      maxAge: 15 * 60,
    },
    redirect: {
      login: '/auth/login',
      logout: '/auth/login',
      home: '/home',
      callback: '/auth/callback',
    },
    endpoints: {
      signIn: { path: '/auth/login', method: 'post' },
      signOut: { path: '/auth/logout', method: 'post' },
      getSession: { path: '/auth/session', method: 'get' },
      refresh: { path: '/auth/refresh-token', method: 'post' },
    },
    session: {
      responseSessionPointer: '/data/session'
    },
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-03-04',
})
