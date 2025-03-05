import type { H3Error } from 'h3'
import type { FetchError } from 'ofetch'

declare module 'h3' {
  interface H3EventContext {
    auth: {
      data?: AccessTokenPayload
      adapter: Adapter
    }
  }
}

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    'auth:registration': (user: User) => Promise<void> | void
    'auth:error': (error: unknown) => Promise<void> | void
  }
}

declare module '#app' {
  interface NuxtApp {
    $auth: {
      fetch: typeof $fetch
      _refreshPromise: Promise<void> | null
    }
  }
  interface RuntimeNuxtHooks {
    'auth:loggedIn': (state: boolean) => Promise<void> | void
    'auth:fetchError': (response: FetchError<H3Error>['response']) => Promise<void> | void
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    auth?: boolean
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $auth: {
      fetch: typeof $fetch
      _refreshPromise: Promise<void> | null
    }
  }
}
