import { describe, expect, it } from 'vitest'
import { validateValue, type FormRule } from './form'

const model = { other: 'x' }
const v = (value: unknown, rules: FormRule[]) => validateValue(value, rules, model)

describe('validateValue（表单校验核心）', () => {
  it('无规则时通过', async () => {
    expect(await v('任意值', [])).toBe(true)
  })

  it('required：空字符串/undefined/null/空数组 不通过', async () => {
    const rules: FormRule[] = [{ required: true }]
    expect(await v('', rules)).toBe('该字段为必填项')
    expect(await v(undefined, rules)).not.toBe(true)
    expect(await v(null, rules)).not.toBe(true)
    expect(await v([], rules)).not.toBe(true)
    expect(await v('有值', rules)).toBe(true)
  })

  it('自定义 message 优先于默认文案', async () => {
    expect(await v('', [{ required: true, message: '请输入名称' }])).toBe('请输入名称')
  })

  it('min/max：字符串按字符数校验', async () => {
    const rules: FormRule[] = [{ min: 2, max: 5 }]
    expect(await v('a', rules)).not.toBe(true)
    expect(await v('ab', rules)).toBe(true)
    expect(await v('abcde', rules)).toBe(true)
    expect(await v('abcdef', rules)).not.toBe(true)
  })

  it('min/max：数值按大小校验', async () => {
    const rules: FormRule[] = [{ min: 10, max: 100 }]
    expect(await v(5, rules)).not.toBe(true)
    expect(await v(10, rules)).toBe(true)
    expect(await v(50, rules)).toBe(true)
    expect(await v(101, rules)).not.toBe(true)
  })

  it('pattern：正则不匹配时报错', async () => {
    const rules: FormRule[] = [{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }]
    expect(await v('mo@mine.com', rules)).toBe(true)
    expect(await v('not-an-email', rules)).toBe('邮箱格式不正确')
  })

  it('空值不触发 min/max/pattern（只受 required 约束）', async () => {
    const rules: FormRule[] = [{ min: 5 }, { pattern: /abc/ }]
    expect(await v('', rules)).toBe(true)
  })

  it('validator：返回 string 作为错误文案', async () => {
    const rules: FormRule[] = [{ validator: (val) => (val === 'admin' ? '该名称已被占用' : true) }]
    expect(await v('admin', rules)).toBe('该名称已被占用')
    expect(await v('guest', rules)).toBe(true)
  })

  it('validator：支持异步（Promise）', async () => {
    const rules: FormRule[] = [
      {
        validator: async (val) => {
          await new Promise((r) => setTimeout(r, 10))
          return val === 'taken' ? '已存在' : true
        },
      },
    ]
    expect(await v('taken', rules)).toBe('已存在')
    expect(await v('free', rules)).toBe(true)
  })

  it('多条规则按顺序校验，第一条失败即返回', async () => {
    const rules: FormRule[] = [
      { required: true, message: '必填' },
      { min: 5, message: '太短' },
    ]
    expect(await v('', rules)).toBe('必填')
    expect(await v('ab', rules)).toBe('太短')
  })
})
