<!-- pages/login.vue -->
<script setup>
import { definePageMeta, useAuth, useRouter } from '#imports'
import AuthForm from '~/components/AuthForm.vue'

definePageMeta({
  middleware: 'guest'
})

const router = useRouter()
const { login } = useAuth()

async function handleSubmit(form) {
  const { success, error } = await login({
    email: form.email,
    password: form.password
  })

  if (success) {
    router.push('/auth/profile')
  }
  else {
    throw new Error(error?.data?.message || '登录失败，请重试')
  }
}
</script>

<template>
  <div>
    <AuthForm
      title="登录"
      button-text="登录"
      :submit-handler="handleSubmit"
    />
    <p class="text-center mt-4">
      还没有账号？
      <NuxtLink to="/auth/register" class="text-blue-600 hover:underline">
        注册
      </NuxtLink>
    </p>
  </div>
</template>
