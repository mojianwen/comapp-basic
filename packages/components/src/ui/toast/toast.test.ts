import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissToast, toast, useToasts } from './toast'

describe('toast 全局状态', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 清空残留
    useToasts().items.splice(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toast() 追加条目并返回 id', () => {
    const id = toast({ title: '测试提示' })
    const items = useToasts().items
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe(id)
    expect(items[0].title).toBe('测试提示')
  })

  it('dismissToast() 移除指定条目', () => {
    const id = toast({ title: '待移除' })
    toast({ title: '保留' })
    dismissToast(id)
    const items = useToasts().items
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('保留')
  })

  it('默认 4 秒自动消失', () => {
    toast({ title: '自动消失' })
    expect(useToasts().items).toHaveLength(1)
    vi.advanceTimersByTime(3999)
    expect(useToasts().items).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(useToasts().items).toHaveLength(0)
  })

  it('duration=0 时不自动消失', () => {
    toast({ title: '常驻' }, 0)
    vi.advanceTimersByTime(60_000)
    expect(useToasts().items).toHaveLength(1)
  })
})
