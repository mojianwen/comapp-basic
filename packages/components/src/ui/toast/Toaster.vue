<script setup lang="ts">
import type { Component } from 'vue'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'
import { dismissToast, useToasts, type ToastVariant } from './toast'

const state = useToasts()

const variantCls: Record<ToastVariant, { border: string; icon: string }> = {
  default: { border: 'border-l-primary', icon: 'text-primary' },
  success: { border: 'border-l-success', icon: 'text-success' },
  error: { border: 'border-l-destructive', icon: 'text-destructive' },
  warning: { border: 'border-l-warning', icon: 'text-warning' },
}

const iconMap: Record<ToastVariant, Component> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in state.items"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border border-l-[3px] bg-card p-3 shadow-pop"
          :class="variantCls[t.variant ?? 'default'].border"
          role="status"
        >
          <component
            :is="iconMap[t.variant ?? 'default']"
            class="mt-0.5 h-4 w-4 shrink-0"
            :class="variantCls[t.variant ?? 'default'].icon"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">{{ t.title }}</p>
            <p v-if="t.description" class="mt-0.5 text-xs text-muted-foreground">
              {{ t.description }}
            </p>
          </div>
          <button
            class="rounded-sm p-0.5 opacity-60 transition-opacity hover:opacity-100"
            aria-label="关闭提示"
            @click="dismissToast(t.id)"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
