<script setup lang="ts">
function handleLogin() {
  console.log('login')
}
</script>

<template>
  <div>
    <h1>Login Page</h1>
    <br>
    <button @click="handleLogin">
      Login
    </button>
  </div>
</template>

<style scoped>

</style>
