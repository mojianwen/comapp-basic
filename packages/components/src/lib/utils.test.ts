import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn（clsx + tailwind-merge）', () => {
  it('拼接多个类名', () => {
    expect(cn('a', 'b', ['c', 'd'])).toBe('a b c d')
  })

  it('忽略 falsy 值', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })

  it('tailwind-merge 冲突时后者覆盖前者（padding）', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('左右 padding 冲突时后者覆盖（此前踩过 pl-60 覆盖 p-6 左侧的坑）', () => {
    expect(cn('p-6', 'pl-60')).toBe('p-6 pl-60')
    expect(cn('p-6', 'px-8')).toBe('p-6 px-8')
  })

  it('非冲突类名全部保留', () => {
    expect(cn('flex items-center', 'text-sm font-medium')).toBe(
      'flex items-center text-sm font-medium',
    )
  })
})
