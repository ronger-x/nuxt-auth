<!-- app.vue -->
<script setup>
// 应用启动时获取用户信息
import { onMounted, useAuth } from '#imports'
import Navbar from '~/components/Navbar.vue'

const { fetchUser } = useAuth()
onMounted(() => fetchUser())
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <Navbar />
    <main class="flex-grow container mx-auto px-4 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
