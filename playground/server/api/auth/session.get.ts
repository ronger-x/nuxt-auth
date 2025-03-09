// server/api/session.get.ts
import { createError, defineEventHandler, getHeader } from '#imports'

export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'Authorization')
  console.log('token', token)

  if (!token) {
    throw createError({
      statusCode: 401,
      message: '未授权'
    })
  }

  // 在真实应用中，你会验证 JWT 并从数据库获取用户
  // 这里我们返回模拟用户数据
  return {
    code: 200,
    message: '获取成功',
    data: {
      session: {
        userId: 1,
        name: 'John Doe',
        email: 'user@example.com'
      }
    }
  }
})
