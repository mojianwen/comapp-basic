import { describe, expect, it } from 'vitest'
import { h, nextTick, reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import Form from './Form.vue'
import FormItem from './FormItem.vue'
import Input from '../input/Input.vue'

const rules = {
  name: [
    { required: true, message: '请输入名称' },
    { min: 2, message: '名称至少 2 个字符' },
  ],
}

function mountForm() {
  const model = reactive({ name: '' })
  const wrapper = mount(Form, {
    props: { model, rules },
    slots: {
      default: () =>
        h(FormItem, { prop: 'name', label: '名称' }, () =>
          h(Input, {
            modelValue: model.name,
            'onUpdate:modelValue': (v: string) => (model.name = v),
          }),
        ),
    },
  })
  return { wrapper, model }
}

describe('Form + FormItem 集成', () => {
  it('validate() 空值返回 false 且显示错误文案', async () => {
    const { wrapper } = mountForm()
    const ok = await (wrapper.vm as unknown as { validate: () => Promise<boolean> }).validate()
    await nextTick()
    expect(ok).toBe(false)
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toBe('请输入名称')
  })

  it('提交尝试后字段实时复检：修正值后错误消失', async () => {
    const { wrapper, model } = mountForm()
    const form = wrapper.vm as unknown as { validate: () => Promise<boolean> }
    await form.validate()
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    model.name = '3号回风巷'
    await flushPromises()
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(await form.validate()).toBe(true)
  })

  it('min 规则在提交时生效', async () => {
    const { wrapper, model } = mountForm()
    model.name = 'a'
    const ok = await (wrapper.vm as unknown as { validate: () => Promise<boolean> }).validate()
    await nextTick()
    expect(ok).toBe(false)
    expect(wrapper.find('[role="alert"]').text()).toBe('名称至少 2 个字符')
  })
})
