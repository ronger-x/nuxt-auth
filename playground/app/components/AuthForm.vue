<!-- components/AuthForm.vue -->
<script setup>
import { defineProps, reactive, ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    required: true
  },
  showName: {
    type: Boolean,
    default: false
  },
  submitHandler: {
    type: Function,
    required: true
  }
})

const form = reactive({
  name: '',
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''
  loading.value = true

  try {
    await props.submitHandler(form)
  }
  catch (error) {
    errorMessage.value = error.message || '发生错误，请重试'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
    <h2 class="text-2xl font-bold mb-6">
      {{ title }}
    </h2>
    <form @submit.prevent="onSubmit">
      <div v-if="showName" class="mb-4">
        <label class="block text-gray-700 mb-2">姓名</label>
        <input
          v-model="form.name"
          type="text"
          class="w-full p-2 border border-gray-300 rounded"
          required
        >
      </div>

      <div class="mb-4">
        <label class="block text-gray-700 mb-2">邮箱</label>
        <input
          v-model="form.email"
          type="email"
          class="w-full p-2 border border-gray-300 rounded"
          required
        >
      </div>

      <div class="mb-6">
        <label class="block text-gray-700 mb-2">密码</label>
        <input
          v-model="form.password"
          type="password"
          class="w-full p-2 border border-gray-300 rounded"
          required
        >
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        :disabled="loading"
      >
        {{ loading ? '处理中...' : buttonText }}
      </button>

      <p v-if="errorMessage" class="mt-4 text-red-600">
        {{ errorMessage }}
      </p>
    </form>
  </div>
</template>
