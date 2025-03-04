<script setup>
import { useAuth } from '#imports'

const { isLoggedIn } = useAuth()
console.log(isLoggedIn)
</script>

<template>
  <div>
    Nuxt module playground!
    <span>{{ isLoggedIn }}</span>
  </div>
</template>
