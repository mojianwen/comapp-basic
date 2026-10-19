<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@mo/components/lib/utils'

/**
 * 页面区块卡片：标题 + 描述 + 右侧操作区 + 内容
 * padded=true 时内容自带内边距（表单/弹窗类）；bare 用于表格等通栏内容
 */
const props = withDefaults(
  defineProps<{
    id?: string
    title?: string
    description?: string
    bare?: boolean
    class?: HTMLAttributes['class']
  }>(),
  { bare: false },
)
</script>

<template>
  <section
    :id="id"
    :class="
      cn(
        'scroll-mt-20 rounded-xl border border-border bg-card shadow-card',
        !bare && 'p-6',
        props.class,
      )
    "
  >
    <div
      v-if="title || $slots.actions"
      :class="
        bare
          ? 'flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4'
          : 'mb-6'
      "
      :style="bare ? { marginBottom: '5px' } : undefined"
    >
      <div>
        <h2 class="flex items-center gap-2 text-lg font-semibold">
          <slot name="icon" />
          {{ title }}
        </h2>
        <p v-if="description" class="mt-1 text-sm text-muted-foreground">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
