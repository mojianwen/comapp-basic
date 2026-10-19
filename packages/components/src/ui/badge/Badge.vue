<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        success: 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning: 'border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        destructive: 'border-red-600/40 bg-red-500/10 text-red-700 dark:text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const props = defineProps<{
  variant?: VariantProps<typeof badgeVariants>['variant']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>
