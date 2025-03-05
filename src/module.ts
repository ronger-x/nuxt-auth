import type { ModuleOptions } from './runtime/types'
import { addImports, addPlugin, addRouteMiddleware, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import { name, version } from '../package.json'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'auth',
    compatibility: {
      nuxt: '>=3.8.2',
    }
  },
  defaults: {
    baseUrl: '/api/auth',
    enableGlobalAuthMiddleware: true,
    loggedInFlagName: 'isAuthenticated',
    storage: 'cookie',
    redirect: {
      login: '/login',
      logout: '/',
      home: '/',
      callback: '/callback',
    },
    endpoints: {
      signIn: { path: '/login', method: 'post' },
      signOut: { path: '/logout', method: 'post' },
      refresh: { path: '/refresh-token', method: 'post' },
      getSession: { path: '/session', method: 'get' }
    },
    accessToken: {
      responseTokenPointer: '/token',
      type: 'Bearer',
      cookieName: 'auth.token',
      headerName: 'Authorization',
      maxAge: 1800 // 30 minutes
    },
    refreshToken: {
      enabled: true,
      responseTokenPointer: '/refreshToken',
      refreshRequestTokenPointer: '/refreshToken',
      cookieName: 'auth.refresh-token',
      maxAge: 604800 // 7 days
    }
  },
  setup(options, nuxt) {
    // Initialize the module options
    nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, {
      auth: options
    })

    const { resolve } = createResolver(import.meta.url)

    // Add nuxt plugins
    addPlugin(resolve('./runtime/plugins/provider'))
    addPlugin(resolve('./runtime/plugins/flow'))

    // Add composables
    addImports([
      {
        name: 'useAuth',
        from: resolve('./runtime/composables/useAuth'),
      },
      {
        name: 'useAuthSession',
        from: resolve('./runtime/composables/useAuthSession'),
      },
    ])

    // Add middleware
    addRouteMiddleware({
      name: 'auth',
      path: resolve('./runtime/middleware/auth'),
      global: !!options.enableGlobalAuthMiddleware,
    })

    addRouteMiddleware({
      name: 'guest',
      path: resolve('./runtime/middleware/guest'),
    })
  }
})
