import type { PublicConfig } from '../types'
import { defineNuxtPlugin, useAuthSession, useRequestHeaders } from '#imports'
import { defu } from 'defu'

export default defineNuxtPlugin({
  name: 'auth:provider',
  enforce: 'post',

  setup: (nuxtApp) => {
    const config = nuxtApp.$config.public.auth as PublicConfig
    const reqHeaders = useRequestHeaders(['user-agent'])

    /**
     * A $fetch instance with auto authorization handler
     */
    const fetch = $fetch.create({
      baseURL: config.baseUrl,

      async onRequest({ options }) {
        const accessToken = await useAuthSession().getAccessToken()

        if (accessToken) {
          options.headers = defu(options.headers, reqHeaders, {
            authorization: `Bearer ${accessToken}`,
          })
        }

        options.credentials ||= 'omit'
      },

      async onResponseError({ response }) {
        await nuxtApp.callHook('auth:fetchError', response)
      }
    })

    return {
      provide: {
        auth: {
          fetch,
          _refreshPromise: null,
        }
      }
    }
  }
})
