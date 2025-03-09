// server/api/auth/logout.post.ts
import { defineEventHandler, deleteCookie } from '#imports'

export default defineEventHandler(async (event) => {
  // 清除认证 cookie
  deleteCookie(event, 'auth-token', {
    path: '/'
  })

  return {
    success: true
  }
})
