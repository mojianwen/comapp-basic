/**
 * E2E 回归脚本（playwright-core + 本机 Chrome，无需下载浏览器）
 *
 * 前置条件：
 *   1. dev server 已启动：npm run dev（默认 http://localhost:5219，可用 BASE_URL 覆盖）
 *   2. 本机已安装 Chrome（playwright-cli install-browser 亦可）
 *
 * 执行：npm run e2e
 * 覆盖：登录 → 门户 → 导航 → 系统管理三页(真实API) → 表单校验 → mock 请求三路径 → 权限(403/404) → 退出登录
 */
import { chromium } from 'playwright-core'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5219'
const HEADLESS = process.env.E2E_HEADED !== '1'

let passed = 0
const failures = []

/** 断言：失败记录并继续（最后统一汇总退出码） */
function check(name, ok) {
  if (ok) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failures.push(name)
    console.error(`  ✗ ${name}`)
  }
}

async function textIncludes(page, text) {
  return page.evaluate((t) => document.body.innerText.includes(t), text)
}

async function main() {
  console.log(`E2E 开始：${BASE_URL}`)
  const browser = await chromium.launch({ channel: 'chrome', headless: HEADLESS })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`CONSOLE: ${m.text()}`)
  })

  try {
    // ===== 登录 =====
    console.log('[1] 登录流程')
    await page.goto(`${BASE_URL}/#/login`)
    await page.getByPlaceholder('请输入账号').fill('wrong')
    await page.getByPlaceholder('请输入密码').fill('bad')
    await page.getByRole('button', { name: '登 录' }).click()
    await page.waitForTimeout(900)
    check('错误账号被拒绝（留在登录页）', page.url().includes('#/login'))

    await page.getByPlaceholder('请输入账号').fill('demo')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.getByRole('button', { name: '登 录' }).click()
    await page.waitForTimeout(1500)
    check('登录成功进入门户', page.url().includes('#/'))
    check('门户显示欢迎语', await textIncludes(page, '欢迎回来'))

    // ===== 导航 =====
    console.log('[2] 菜单导航')
    for (const [path, text] of [
      ['#/monitor', null],
      ['#/components', '表单校验'],
      ['#/', null],
    ]) {
      await page.goto(`${BASE_URL}/${path}`)
      await page.waitForTimeout(500)
      if (text) check(`页面 ${path} 渲染（含「${text}」）`, await textIncludes(page, text))
      else check(`页面 ${path} 可访问`, page.url().includes(path))
    }

    // ===== 系统管理（真实后端接口） =====
    console.log('[3] 系统管理三页（真实 API）')
    await page.goto(`${BASE_URL}/#/system`)
    await page.waitForTimeout(1000)
    check('#/system 重定向到用户管理', page.url().includes('#/system/users'))
    check('用户列表加载（含内置账号 demo）', await textIncludes(page, 'demo'))

    await page.goto(`${BASE_URL}/#/system/roles`)
    await page.waitForTimeout(1000)
    check('角色列表加载（含内置「系统管理员」）', await textIncludes(page, '系统管理员'))

    await page.goto(`${BASE_URL}/#/system/menus`)
    await page.waitForTimeout(1000)
    check('菜单树加载（含「系统管理」目录）', await textIncludes(page, '系统管理'))
    check('菜单类型徽标渲染（按钮）', await textIncludes(page, '按钮'))

    // ===== 表单校验 =====
    console.log('[4] 表单校验')
    await page.goto(`${BASE_URL}/#/components`)
    await page.waitForTimeout(600)
    const sect = page.locator('#form-validate')
    await sect.getByRole('button', { name: '提交校验' }).click()
    await page.waitForTimeout(500)
    check(
      '空表单提交出现必填错误',
      (await page.locator('#form-validate [role="alert"]').count()) >= 3,
    )

    await sect.getByPlaceholder('例如：3号回风巷 T3').fill('3号回风巷 T9')
    await sect.getByPlaceholder('name@mine.com').fill('mo@mine.com')
    await sect.getByText('重点监测').click()
    await page.waitForTimeout(400)
    await sect.getByRole('button', { name: '提交校验' }).click()
    await page.waitForTimeout(500)
    check('修正后提交成功', await textIncludes(page, '校验通过'))

    // ===== 请求层 =====
    console.log('[5] 请求层三路径')
    await page.getByRole('button', { name: '成功请求' }).click()
    await page.waitForTimeout(900)
    check('mock 成功请求', await textIncludes(page, '获取监测汇总 · 成功'))

    await page.getByRole('button', { name: '业务错误' }).click()
    await page.waitForTimeout(900)
    check('业务错误路径（BIZ_RULE）', await textIncludes(page, 'BIZ_RULE'))

    await page.getByRole('button', { name: 'HTTP 500' }).click()
    await page.waitForTimeout(900)
    check('HTTP 500 路径', await textIncludes(page, 'HTTP 500'))

    // ===== 权限 =====
    console.log('[6] 权限三层')
    check('无权限按钮已被移除', !(await textIncludes(page, '危险操作（无权限，已被移除）')))
    check('有权限按钮可见', await textIncludes(page, '进入数据监测（有权限，可见）'))
    check(
      '无权限菜单已过滤（审计日志不可见）',
      !(await page.evaluate(() => document.querySelector('aside')?.innerText.includes('审计日志'))),
    )

    await page.goto(`${BASE_URL}/#/audit`)
    await page.waitForTimeout(500)
    check('受保护路由被守卫拦截 → 403', await textIncludes(page, '没有访问权限'))

    await page.goto(`${BASE_URL}/#/no-such-page`)
    await page.waitForTimeout(500)
    check('未知路由 → 404', await textIncludes(page, '页面不存在'))

    // ===== 退出登录 =====
    console.log('[7] 退出登录')
    await page.goto(`${BASE_URL}/#/`)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /^用户菜单/ }).click()
    await page.waitForTimeout(400)
    await page.getByText('退出登录').click()
    await page.waitForTimeout(800)
    check('退出后回到登录页', page.url().includes('#/login'))
  } finally {
    await browser.close()
  }

  // ===== 汇总 =====
  check('控制台无错误', consoleErrors.length === 0)
  if (consoleErrors.length) console.error('控制台错误明细：', consoleErrors.slice(0, 5))

  console.log(`\n结果：${passed} 通过，${failures.length} 失败`)
  if (failures.length) {
    console.error('失败项：', failures)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('E2E 执行异常：', e)
  process.exit(1)
})
