import { defineNuxtPlugin } from '#imports'
import consola from 'consola'

export default defineNuxtPlugin({
  hooks: {
    'auth:loggedIn': (state) => {
      consola.info('logged in', state)
    },
    'auth:fetchError': (response) => {
      consola.info('fetch error', response?._data?.message)
    },
  },
})
