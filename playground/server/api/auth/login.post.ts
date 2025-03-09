// server/api/auth/login.post.ts
import { createError, defineEventHandler, readBody, setCookie, useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  // 在真实应用中，你会验证凭据并从数据库检索用户
  // 这里简化为模拟用户验证
  if (email === 'user@example.com' && password === 'password') {
    const token = 'mock-jwt-token'
    const refreshToken = 'mock-refresh-token'
    const config = useRuntimeConfig().public.auth
    // 设置 cookie
    setCookie(event, config.accessToken.cookieName || 'auth.token', token, {
      maxAge: 60 * 60 * 24, // 1天
      sameSite: 'strict',
      secure: true
    })
    setCookie(event, config.refreshToken.cookieName || 'auth.refresh-token', refreshToken, {
      maxAge: 60 * 60 * 24 * 7, // 1周
      sameSite: 'strict',
      secure: true
    })

    return {
      code: 200,
      message: '登录成功',
      data: {
        token,
        refreshToken,
        expiresIn: 60 * 60 * 24 * 7,
      }
    }
  }

  throw createError({
    statusCode: 401,
    message: '登录失败，邮箱或密码不正确'
  })
})
