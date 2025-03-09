<script setup lang="ts">
import { definePageMeta, useAuth } from '#imports'

definePageMeta({ middleware: 'auth' })

const { logout, fetchUser, session } = useAuth()

const user = session()

async function handleLogout() {
  await logout()
}
</script>

<template>
  <div>
    <h1>Home</h1>
    <button @click="fetchUser">
      Fetch user
    </button>
    <button @click="handleLogout">
      Logout
    </button>
    <p data-testid="user-info">
      {{ user }}
    </p>

    <img
      :src="user?.picture"
      height="40"
      alt=""
    >
  </div>
</template>
