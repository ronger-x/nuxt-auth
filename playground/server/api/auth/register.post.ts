// server/api/auth/register.post.ts
import { createError, defineEventHandler, readBody, setCookie } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, password } = body

  // 在真实应用中，你会检查邮箱是否已存在并安全地存储密码
  // 这里简化为模拟用户创建
  if (!name || !email || !password) {
    throw createError({
      statusCode: 400,
      message: '所有字段都是必填项'
    })
  }

  const token = 'mock-jwt-token'
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })

  return {
    user: {
      id: 1,
      name,
      email
    }
  }
})
