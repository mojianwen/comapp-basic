<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { Toaster } from '@mo/components'
import { initTheme } from './stores/theme'

onMounted(initTheme)
</script>

<template>
  <RouterView />
  <Toaster />
</template>
