<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const alertVariants = cva(
  'relative flex w-full gap-3 rounded-lg border px-4 py-3 text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:mt-0.5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        info: 'border-primary/40 bg-primary/5 text-foreground [&>svg]:text-primary',
        success:
          'border-emerald-600/40 bg-emerald-500/5 text-foreground [&>svg]:text-emerald-600 dark:text-emerald-400 [&>svg]:dark:text-emerald-400',
        warning:
          'border-amber-600/40 bg-amber-500/5 text-foreground [&>svg]:text-amber-600 dark:text-amber-400 [&>svg]:dark:text-amber-400',
        destructive:
          'border-red-600/40 bg-red-500/5 text-foreground [&>svg]:text-red-600 dark:text-red-400 [&>svg]:dark:text-red-400',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

const props = defineProps<{
  variant?: VariantProps<typeof alertVariants>['variant']
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn(alertVariants({ variant }), props.class)" role="alert">
    <slot />
  </div>
</template>
