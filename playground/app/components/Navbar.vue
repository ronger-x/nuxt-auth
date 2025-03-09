<!-- components/Navbar.vue -->
<script setup>
import { useAuth, useRouter } from '#imports'

const { isAuthenticated, logout } = useAuth()
const router = useRouter()

async function handleLogout() {
  await logout()
  router.push('/auth/login')
}
</script>

<template>
  <nav class="bg-blue-600 text-white p-4">
    <div class="container mx-auto flex justify-between items-center">
      <NuxtLink to="/" class="text-xl font-bold">
        Auth Playground
      </NuxtLink>
      <div>
        <template v-if="isAuthenticated">
          <NuxtLink to="/auth/profile" class="mr-4">
            个人中心
          </NuxtLink>
          <button class="hover:underline" @click="handleLogout">
            退出登录
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/auth/login" class="mr-4">
            登录
          </NuxtLink>
          <NuxtLink to="/auth/register">
            注册
          </NuxtLink>
        </template>
      </div>
    </div>
  </nav>
</template>
