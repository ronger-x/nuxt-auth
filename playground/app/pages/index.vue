<!-- pages/index.vue -->
<script setup>
import { definePageMeta, useAuth } from '#imports'

definePageMeta({ middleware: 'guest' })

const { isLoggedIn } = useAuth()
</script>

<template>
  <div class="max-w-lg mx-auto text-center">
    <h1 class="text-3xl font-bold mb-6">
      Nuxt 3 Authentication Playground
    </h1>
    <p class="mb-6">
      这是一个演示 Nuxt 3 用户认证功能的简单应用
    </p>

    <div v-if="isLoggedIn">
      <p class="mb-4">
        您已登录
      </p>
      <NuxtLink
        to="/auth/profile"
        class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        查看个人中心
      </NuxtLink>
    </div>

    <div v-else class="flex justify-center space-x-4">
      <NuxtLink
        to="/auth/login"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        登录
      </NuxtLink>

      <NuxtLink
        to="/auth/register"
        class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        注册
      </NuxtLink>
    </div>
  </div>
</template>
