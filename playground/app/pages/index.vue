<script setup lang="ts">
import { useAuth } from '#imports'

const user = useAuth().session()
</script>

<template>
  <div>
    <h1>Login successfully!</h1>
    <p>Current user: {{ user }}</p>
  </div>
</template>
