<!-- pages/register.vue -->
<script setup>
import { definePageMeta, useAuth, useRouter } from '#imports'
import AuthForm from '~/components/AuthForm.vue'

definePageMeta({
  middleware: 'guest'
})

const router = useRouter()
const { register } = useAuth()

async function handleSubmit(form) {
  const { success, error } = await register(form.name, form.email, form.password)

  if (success) {
    router.push('/profile')
  }
  else {
    throw new Error(error?.data?.message || '注册失败，请重试')
  }
}
</script>

<template>
  <div>
    <AuthForm
      title="创建账户"
      button-text="注册"
      :show-name="true"
      :submit-handler="handleSubmit"
    />
    <p class="text-center mt-4">
      已有账号？
      <NuxtLink to="/login" class="text-blue-600 hover:underline">
        登录
      </NuxtLink>
    </p>
  </div>
</template>
