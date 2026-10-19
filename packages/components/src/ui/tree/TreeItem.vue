<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TreeItem } from 'reka-ui'
import { cn } from '../../lib/utils'

/**
 * reka-ui TreeItem 的默认 slot 只提供：
 * isExpanded / isSelected / isIndeterminate / isDisabled / handleSelect / handleToggle
 * 节点数据（item、level、hasChildren）需由外层通过 TreeRoot 的 flattenItems 提供。
 */
const props = defineProps<{
  /** 节点数据对象（对应 items 数组中的一项） */
  value: unknown
  /** 层级，从 1 开始，由 TreeRoot 的 flattenItems 提供 */
  level: number
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <TreeItem
    :value="value"
    :level="level"
    v-slot="{ isExpanded, isSelected }"
    :class="
      cn(
        'relative rounded-md py-1.5 pr-2 text-sm outline-none transition-colors',
        'focus:bg-muted/60 data-[selected]:bg-primary/10 data-[selected]:text-primary data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <slot :is-expanded="isExpanded" :is-selected="isSelected" />
  </TreeItem>
</template>
