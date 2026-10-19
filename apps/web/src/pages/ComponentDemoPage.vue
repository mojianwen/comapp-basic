<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, SelectRoot, TabsRoot, TreeRoot } from 'reka-ui'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  LayoutGrid,
  MonitorCog,
  PanelTop,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-vue-next'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Form,
  FormItem,
  Input,
  Label,
  Pagination,
  Progress,
  RadioGroup,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TreeItem,
  toast,
} from '@mo/components'
import { PageSection } from '@mo/layouts'
import { ApiError } from '../api/ApiError'
import { request } from '../api/request'
import { usePermission } from '../plugins/permission'

const router = useRouter()
const { permissions } = usePermission()

/* ===================== 表单：新增监测点 ===================== */
const depts = ['采煤部', '掘进部', '机电部', '通防部', '安监部']

const form = reactive({
  name: '',
  dept: '',
  email: '',
  notify: true,
  autoRefresh: true,
})

const errors = reactive({
  name: '',
  dept: '',
  email: '',
})

const submitted = ref(false)
const submitMsg = ref('')
const submitOk = ref(false)

function validate() {
  errors.name = form.name.trim() ? '' : '请输入监测点名称'
  errors.dept = form.dept ? '' : '请选择所属部门'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? ''
    : '邮箱格式不正确，例如 name@mine.com'
  return !errors.name && !errors.dept && !errors.email
}

function onSubmit() {
  submitted.value = true
  if (validate()) {
    submitOk.value = true
    submitMsg.value = `监测点「${form.name}」已提交保存（示例演示：校验通过后的成功反馈）`
    toast({
      variant: 'success',
      title: '保存成功',
      description: `监测点「${form.name}」已提交保存`,
    })
  } else {
    submitOk.value = false
    submitMsg.value = '提交失败，请检查表单中标红的字段'
    toast({ variant: 'error', title: '提交失败', description: '请检查表单中标红的字段' })
  }
}

function onReset() {
  form.name = ''
  form.dept = ''
  form.email = ''
  form.notify = true
  form.autoRefresh = true
  errors.name = ''
  errors.dept = ''
  errors.email = ''
  submitted.value = false
  submitMsg.value = ''
}

/* ===================== 弹窗（Dialog）与 Toast ===================== */
const dialogDelete = ref(false)
const dialogForm = ref(false)
const newGroup = ref('')

function confirmDelete() {
  dialogDelete.value = false
  toast({ variant: 'success', title: '已确认删除', description: '危险操作二次确认流程演示完成' })
}

function confirmCreate() {
  if (!newGroup.value.trim()) return
  dialogForm.value = false
  toast({
    variant: 'success',
    title: '分组已创建',
    description: `「${newGroup.value.trim()}」可在导航树中查看`,
  })
  newGroup.value = ''
}

/* ===================== 树形组件（Tree） ===================== */
interface TreeNode {
  title: string
  children?: TreeNode[]
}

const treeItems: TreeNode[] = [
  {
    title: '一采区',
    children: [
      {
        title: '-380m 中段',
        children: [{ title: '1号工作面回风巷' }, { title: '1号工作面运输巷' }, { title: '联络巷' }],
      },
      {
        title: '-280m 中段',
        children: [{ title: '掘进面 J1' }, { title: '掘进面 J2' }],
      },
    ],
  },
  {
    title: '三采区',
    children: [
      {
        title: '-320m 中段',
        children: [{ title: '3号回风巷' }, { title: '主运大巷' }],
      },
      { title: '机电硐室' },
    ],
  },
  {
    title: '地面系统',
    children: [{ title: '风井机房' }, { title: '调度中心' }, { title: '中央变电所' }],
  },
]

const treeExpanded = ref<string[]>(['一采区', '三采区'])
const treeSelected = ref('')

/* ===================== 页签（Tabs） ===================== */
const activeTab = ref('realtime')

const statTiles = [
  { label: '在线监测点', value: '12', cls: 'text-foreground' },
  { label: '预警', value: '2', cls: 'text-amber-600 dark:text-amber-400' },
  { label: '报警', value: '2', cls: 'text-red-600 dark:text-red-400' },
  { label: '平均实时值 (m³/min)', value: '53.4', cls: 'text-primary' },
]

const historyBars = [
  { label: '数据完整率（近 7 天）', pct: 99.2 },
  { label: '数据完整率（近 30 天）', pct: 98.7 },
  { label: '正常上传设备占比', pct: 91.7 },
]

const alarms = [
  { level: '报警', text: '2号掘进面 J1 超限（128.4 m³/min）', time: '2026-10-17 17:50' },
  { level: '预警', text: '3号回风巷 T2 浓度持续上升（86.1 m³/min）', time: '2026-10-17 17:42' },
  { level: '预警', text: '风井口 F2 风机负载波动', time: '2026-10-17 16:05' },
] as const

/* ===================== 数据表格：监测点实时数据 ===================== */
interface Row {
  id: number
  name: string
  location: string
  status: '正常' | '预警' | '报警'
  value: number
  ts: number
}

const base = Date.parse('2026-10-17T18:00:00')
const rows: Row[] = [
  {
    id: 1,
    name: '3号回风巷 T1',
    location: '-320m 水平 三采区',
    status: '正常',
    value: 42.5,
    ts: base - 2 * 60000,
  },
  {
    id: 2,
    name: '3号回风巷 T2',
    location: '-320m 水平 三采区',
    status: '预警',
    value: 86.1,
    ts: base - 4 * 60000,
  },
  {
    id: 3,
    name: '主运大巷 M1',
    location: '-450m 水平 主运巷',
    status: '正常',
    value: 18.3,
    ts: base - 6 * 60000,
  },
  {
    id: 4,
    name: '主运大巷 M2',
    location: '-450m 水平 主运巷',
    status: '正常',
    value: 21.7,
    ts: base - 8 * 60000,
  },
  {
    id: 5,
    name: '2号掘进面 J1',
    location: '-280m 水平 二采区',
    status: '报警',
    value: 128.4,
    ts: base - 10 * 60000,
  },
  {
    id: 6,
    name: '2号掘进面 J2',
    location: '-280m 水平 二采区',
    status: '正常',
    value: 35.2,
    ts: base - 12 * 60000,
  },
  {
    id: 7,
    name: '风井口 F1',
    location: '地面 风井机房',
    status: '正常',
    value: 12.0,
    ts: base - 14 * 60000,
  },
  {
    id: 8,
    name: '风井口 F2',
    location: '地面 风井机房',
    status: '预警',
    value: 74.9,
    ts: base - 16 * 60000,
  },
  {
    id: 9,
    name: '中央变电所 B1',
    location: '-450m 水平 井底车场',
    status: '正常',
    value: 9.6,
    ts: base - 18 * 60000,
  },
  {
    id: 10,
    name: '中央变电所 B2',
    location: '-450m 水平 井底车场',
    status: '正常',
    value: 11.2,
    ts: base - 20 * 60000,
  },
  {
    id: 11,
    name: '1号工作面 W1',
    location: '-380m 水平 一采区',
    status: '正常',
    value: 55.8,
    ts: base - 22 * 60000,
  },
  {
    id: 12,
    name: '1号工作面 W2',
    location: '-380m 水平 一采区',
    status: '报警',
    value: 145.0,
    ts: base - 24 * 60000,
  },
]

type SortKey = 'value' | 'time'
const sortKey = ref<SortKey | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
  page.value = 1
}

const sortedRows = computed(() => {
  if (!sortKey.value) return rows
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = key === 'value' ? a.value : a.ts
    const bv = key === 'value' ? b.value : b.ts
    return (av - bv) * dir
  })
})

const pageSize = 5
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / pageSize)))
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return sortedRows.value.slice(start, start + pageSize)
})

function fmt(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const statusClass: Record<Row['status'], string> = {
  正常: 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  预警: 'border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  报警: 'border-red-600/40 bg-red-500/10 text-red-700 dark:text-red-400',
}

/* ===================== 表单校验（Form/FormItem 组件示例） ===================== */
const demoForm = reactive({
  pointName: '',
  email: '',
  level: '',
  remark: '',
})

const demoRules = {
  pointName: [
    { required: true, message: '请输入监测点名称' },
    { min: 2, max: 20, message: '名称长度需在 2~20 个字符之间' },
  ],
  email: [
    { required: true, message: '请输入值班邮箱' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确，例如 name@mine.com' },
  ],
  level: [{ required: true, message: '请选择监测等级' }],
  remark: [{ max: 200, message: '备注不能超过 200 个字符' }],
}

const demoFormRef = ref<{ validate: () => Promise<boolean> } | null>(null)

async function onDemoSubmit() {
  const ok = await demoFormRef.value?.validate()
  if (ok) {
    toast({
      variant: 'success',
      title: '校验通过',
      description: `监测点「${demoForm.pointName}」提交成功（Form 组件演示）`,
    })
  } else {
    toast({ variant: 'error', title: '校验未通过', description: '请检查表单中标红的字段' })
  }
}

/* ===================== 请求层（request + mock 演示） ===================== */
async function demoRequest(name: string, url: string) {
  try {
    const data = await request<Record<string, unknown>>(url)
    toast({
      variant: 'success',
      title: `${name} · 成功`,
      description: `返回数据：${JSON.stringify(data)}`,
    })
  } catch (e) {
    const msg =
      e instanceof ApiError
        ? `${e.message}（code=${e.code}${e.status !== undefined ? ` · HTTP ${e.status}` : ''}）`
        : String(e)
    toast({ variant: 'error', title: `${name} · 失败`, description: msg })
  }
}

/* ===================== 更多组件（Badge/Avatar/Card/Alert/Progress/Skeleton/Breadcrumb/Sheet） ===================== */
const progressVal = ref(68)
const sheetOpen = ref(false)

const crumbs = [{ label: '门户主页', to: '/' }, { label: '业务中心' }, { label: '组件示例' }]
</script>

<template>
  <!-- ===== 表单卡片 ===== -->
  <PageSection
    id="form"
    title="新增监测点信息（表单示例）"
    description="覆盖文本输入、下拉选择、复选框、开关与校验提示；提交结果通过 Toast 反馈。"
  >
    <template #icon>
      <MonitorCog class="h-5 w-5 text-primary" />
    </template>

    <form class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="onSubmit">
      <div class="space-y-1.5">
        <Label>监测点名称 <span class="text-destructive">*</span></Label>
        <Input v-model="form.name" placeholder="例如：3号回风巷 T3" />
        <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
      </div>

      <div class="space-y-1.5">
        <Label>所属部门 <span class="text-destructive">*</span></Label>
        <SelectRoot v-model="form.dept">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="请选择所属部门" />
          </SelectTrigger>
          <SelectContent class="w-[var(--reka-select-trigger-width)]">
            <SelectItem v-for="d in depts" :key="d" :value="d">{{ d }}</SelectItem>
          </SelectContent>
        </SelectRoot>
        <p v-if="errors.dept" class="text-xs text-destructive">{{ errors.dept }}</p>
      </div>

      <div class="space-y-1.5 sm:col-span-2">
        <Label>值班负责人邮箱 <span class="text-destructive">*</span></Label>
        <Input v-model="form.email" type="email" placeholder="name@mine.com" />
        <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
      </div>

      <div class="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
        <Checkbox v-model="form.notify" />
        <span class="text-sm">异常时同步发送短信通知</span>
      </div>

      <div class="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
        <Switch v-model="form.autoRefresh" />
        <span class="text-sm">数据大屏自动刷新（30 秒）</span>
      </div>

      <div class="flex items-center gap-3 sm:col-span-2">
        <Button type="submit">提交保存</Button>
        <Button type="button" variant="outline" @click="onReset">重置表单</Button>
        <p
          v-if="submitted && submitMsg"
          class="text-sm"
          :class="submitOk ? 'text-success' : 'text-destructive'"
        >
          {{ submitMsg }}
        </p>
      </div>
    </form>
  </PageSection>

  <!-- ===== 弹窗卡片 ===== -->
  <PageSection
    id="dialog"
    title="弹出窗口（Dialog 示例）"
    description="模态遮罩、焦点圈定、Esc 关闭均为 Reka UI 内置；操作结果通过 Toast 反馈。"
  >
    <template #icon>
      <Plus class="h-5 w-5 text-primary" />
    </template>

    <div class="flex flex-wrap items-center gap-3">
      <DialogRoot v-model:open="dialogDelete">
        <DialogTrigger as-child>
          <Button variant="destructive">
            <Trash2 />
            删除监测点
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-md">
          <DialogTitle>确认删除监测点？</DialogTitle>
          <DialogDescription>
            此操作将移除「3号回风巷 T2」的实时监测配置及历史数据关联，删除后不可恢复。
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" @click="dialogDelete = false">取消</Button>
            <Button variant="destructive" @click="confirmDelete">确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <DialogRoot v-model:open="dialogForm">
        <DialogTrigger as-child>
          <Button variant="outline">
            <Plus />
            新建分组
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-md">
          <DialogTitle>新建监测点分组</DialogTitle>
          <DialogDescription>
            分组用于按采区或中段组织监测点，创建后可在左侧导航树中查看。
          </DialogDescription>
          <div class="space-y-1.5">
            <Label>分组名称 <span class="text-destructive">*</span></Label>
            <Input v-model="newGroup" placeholder="例如：二采区" @keyup.enter="confirmCreate" />
          </div>
          <DialogFooter>
            <Button variant="outline" @click="dialogForm = false">取消</Button>
            <Button :disabled="!newGroup.trim()" @click="confirmCreate">创建分组</Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <div class="flex items-center gap-2 border-l border-border pl-3">
        <Button
          variant="ghost"
          size="sm"
          class="text-success"
          @click="
            toast({ variant: 'success', title: '成功提示', description: '操作已顺利完成（演示）' })
          "
        >
          成功提示
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-warning"
          @click="
            toast({
              variant: 'warning',
              title: '警告提示',
              description: '3号回风巷 T2 浓度接近阈值（演示）',
            })
          "
        >
          警告提示
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive"
          @click="
            toast({
              variant: 'error',
              title: '错误提示',
              description: '2号掘进面 J1 通信中断（演示）',
            })
          "
        >
          错误提示
        </Button>
      </div>
    </div>
  </PageSection>

  <!-- ===== 树形组件卡片 ===== -->
  <PageSection
    id="tree"
    title="树形组件（Tree 示例）"
    description="采区 / 中段 / 巷道层级：文件夹图标区分目录与节点，点击展开折叠，点击名称选中；支持方向键导航。"
  >
    <template #icon>
      <FolderTree class="h-5 w-5 text-primary" />
    </template>
    <template #actions>
      <span
        class="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
      >
        当前选中：{{ treeSelected || '无' }}
      </span>
    </template>

    <TreeRoot
      v-slot="{ flattenItems }"
      :items="treeItems"
      v-model:expanded="treeExpanded"
      :get-key="(item: TreeNode) => item.title"
      :get-children="(item: TreeNode) => item.children"
      :model-value="treeSelected"
      @update:model-value="treeSelected = String($event ?? '')"
      class="rounded-xl border border-border bg-muted/30 p-3 text-sm"
    >
      <TreeItem
        v-for="i in flattenItems"
        :key="i._id"
        :value="i.value"
        :level="i.level"
        v-slot="{ isExpanded, isSelected }"
      >
        <div
          class="flex items-center gap-2 rounded-lg py-1.5 pr-2 transition-colors hover:bg-accent/70"
          :style="{ paddingLeft: `${(i.level - 1) * 1.5 + 0.25}rem` }"
        >
          <ChevronRight
            v-if="i.hasChildren"
            class="h-4 w-4 shrink-0 text-muted-foreground transition-transform"
            :class="isExpanded ? 'rotate-90' : ''"
          />
          <FolderOpen v-if="i.hasChildren && isExpanded" class="h-4 w-4 shrink-0 text-primary" />
          <Folder v-else-if="i.hasChildren" class="h-4 w-4 shrink-0 text-muted-foreground" />
          <FileText v-else class="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <span class="truncate" :class="isSelected ? 'font-medium text-primary' : ''">
            {{ i.value.title }}
          </span>
          <span
            v-if="i.hasChildren"
            class="ml-auto rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground shadow-card"
          >
            {{ i.value.children?.length }}
          </span>
        </div>
      </TreeItem>
    </TreeRoot>
  </PageSection>

  <!-- ===== 页签卡片 ===== -->
  <PageSection
    id="tabs"
    title="页签组件（Tabs 示例）"
    description="同一组内容的四个数据视图切换：实时概览、历史查询、报警记录、已归档（空状态示例）。"
  >
    <template #icon>
      <PanelTop class="h-5 w-5 text-primary" />
    </template>

    <TabsRoot
      :model-value="activeTab"
      @update:model-value="activeTab = String($event ?? 'realtime')"
    >
      <TabsList>
        <TabsTrigger value="realtime">实时概览</TabsTrigger>
        <TabsTrigger value="history">历史查询</TabsTrigger>
        <TabsTrigger value="alarm">报警记录</TabsTrigger>
        <TabsTrigger value="archived">已归档</TabsTrigger>
      </TabsList>

      <TabsContent value="realtime">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            v-for="t in statTiles"
            :key="t.label"
            class="rounded-lg border border-border bg-muted/30 p-4"
          >
            <p class="text-xs text-muted-foreground">{{ t.label }}</p>
            <p class="mt-1 text-2xl font-semibold tabular-nums" :class="t.cls">{{ t.value }}</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <div class="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <div v-for="b in historyBars" :key="b.label">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <span>{{ b.label }}</span>
              <span class="font-medium tabular-nums text-primary">{{ b.pct }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-card">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${b.pct}%` }"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="alarm">
        <div class="space-y-2">
          <div
            v-for="(a, idx) in alarms"
            :key="idx"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
          >
            <div class="flex items-center gap-2">
              <span
                class="inline-flex rounded-full border px-2 py-0.5 text-xs"
                :class="statusClass[a.level]"
              >
                {{ a.level }}
              </span>
              <span class="text-sm">{{ a.text }}</span>
            </div>
            <span class="text-xs tabular-nums text-muted-foreground">{{ a.time }}</span>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="archived">
        <EmptyState
          title="暂无归档数据"
          description="监测点下线 30 天后自动归档到此处，也可手动归档历史监测点。"
        >
          <template #icon>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FolderOpen class="h-6 w-6 text-muted-foreground" />
            </div>
          </template>
          <template #action>
            <Button variant="outline" size="sm" @click="activeTab = 'realtime'"
              >返回实时概览</Button
            >
          </template>
        </EmptyState>
      </TabsContent>
    </TabsRoot>
  </PageSection>

  <!-- ===== 数据表格卡片 ===== -->
  <PageSection
    id="table"
    bare
    title="监测点实时数据（表格示例）"
    description="点击「实时值 / 更新时间」表头排序；底部分页；状态用语义色标注。"
  >
    <template #actions>
      <Tooltip>
        <TooltipTrigger as-child>
          <span
            class="cursor-help rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
          >
            共 {{ rows.length }} 个监测点
          </span>
        </TooltipTrigger>
        <TooltipContent>其中预警 2 个、报警 2 个（演示 Tooltip）</TooltipContent>
      </Tooltip>
    </template>

    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead>监测点</TableHead>
          <TableHead>位置</TableHead>
          <TableHead class="cursor-pointer select-none" @click="setSort('value')">
            <span class="inline-flex items-center gap-1">
              实时值 (m³/min)
              <ArrowUpDown v-if="sortKey !== 'value'" class="h-3.5 w-3.5" />
              <ChevronUp v-else-if="sortDir === 'asc'" class="h-3.5 w-3.5 text-primary" />
              <ChevronDown v-else class="h-3.5 w-3.5 text-primary" />
            </span>
          </TableHead>
          <TableHead>状态</TableHead>
          <TableHead class="cursor-pointer select-none" @click="setSort('time')">
            <span class="inline-flex items-center gap-1">
              更新时间
              <ArrowUpDown v-if="sortKey !== 'time'" class="h-3.5 w-3.5" />
              <ChevronUp v-else-if="sortDir === 'asc'" class="h-3.5 w-3.5 text-primary" />
              <ChevronDown v-else class="h-3.5 w-3.5 text-primary" />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="r in pagedRows" :key="r.id">
          <TableCell class="font-medium">{{ r.name }}</TableCell>
          <TableCell class="text-muted-foreground">{{ r.location }}</TableCell>
          <TableCell class="tabular-nums">{{ r.value.toFixed(1) }}</TableCell>
          <TableCell>
            <span
              class="inline-flex rounded-full border px-2 py-0.5 text-xs"
              :class="statusClass[r.status]"
            >
              {{ r.status }}
            </span>
          </TableCell>
          <TableCell class="text-muted-foreground tabular-nums">{{ fmt(r.ts) }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
      <p class="text-sm text-muted-foreground">
        共 {{ sortedRows.length }} 条 · 第 {{ page }} / {{ pageCount }} 页
      </p>
      <Pagination :page="page" :total-pages="pageCount" @update:page="page = $event" />
    </div>
  </PageSection>

  <!-- ===== 表单校验卡片（Form 组件） ===== -->
  <PageSection
    id="form-validate"
    title="表单校验（Form 组件示例）"
    description="声明式规则：required / 长度 / 正则；字段失焦后实时校验，提交时全量校验，错误文案显示在字段下方。"
  >
    <template #icon>
      <ClipboardCheck class="h-5 w-5 text-primary" />
    </template>

    <Form ref="demoFormRef" :model="demoForm" :rules="demoRules" class="grid gap-4 sm:grid-cols-2">
      <FormItem prop="pointName" label="监测点名称">
        <Input v-model="demoForm.pointName" placeholder="例如：3号回风巷 T3" />
      </FormItem>

      <FormItem prop="email" label="值班邮箱">
        <Input v-model="demoForm.email" type="email" placeholder="name@mine.com" />
      </FormItem>

      <FormItem prop="level" label="监测等级" class="sm:col-span-2">
        <RadioGroup
          v-model="demoForm.level"
          :options="[
            { label: '常规巡检', value: 'normal' },
            { label: '重点监测', value: 'key' },
            { label: '实时告警', value: 'alarm' },
          ]"
        />
      </FormItem>

      <FormItem prop="remark" label="备注（选填）" class="sm:col-span-2">
        <Textarea v-model="demoForm.remark" placeholder="安装位置、备注说明等（最多 200 字）" />
      </FormItem>

      <div class="flex items-center gap-3 sm:col-span-2">
        <Button type="button" @click="onDemoSubmit">提交校验</Button>
        <p class="text-xs text-muted-foreground">留空或输入非法值后提交，可看到各字段的错误提示</p>
      </div>
    </Form>
  </PageSection>

  <!-- ===== 请求层演示卡片 ===== -->
  <PageSection
    id="request"
    title="请求层演示（request + mock）"
    description="统一 fetch 封装：拦截器、超时、{ code, data, message } 解析；错误统一抛 ApiError，由调用方决定呈现方式。"
  >
    <template #icon>
      <Send class="h-5 w-5 text-primary" />
    </template>

    <div class="flex flex-wrap items-center gap-3">
      <Button @click="demoRequest('获取监测汇总', '/mock/monitor-summary')">成功请求</Button>
      <Button variant="outline" @click="demoRequest('业务校验', '/mock/biz-error')"
        >业务错误</Button
      >
      <Button variant="outline" @click="demoRequest('服务调用', '/mock/crash')">HTTP 500</Button>

      <div class="flex items-center gap-2 border-l border-border pl-3">
        <Button variant="ghost" size="sm" @click="router.push('/403')">
          <ShieldAlert class="h-4 w-4" />
          403 页面
        </Button>
        <Button variant="ghost" size="sm" @click="router.push('/no-such-page')"> 404 页面 </Button>
      </div>
    </div>
  </PageSection>

  <!-- ===== 更多组件卡片 ===== -->
  <PageSection
    id="widgets"
    title="常用组件补充（Badge / Avatar / Card / Alert / Progress / Skeleton / Breadcrumb / Sheet）"
    description="后台系统高频展示类组件一览；侧滑抽屉（Sheet）常用于移动端筛选面板与快速详情。"
  >
    <template #icon>
      <LayoutGrid class="h-5 w-5 text-primary" />
    </template>

    <div class="space-y-4">
      <!-- 徽章 + 头像 + 面包屑 -->
      <div
        class="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-muted/30 p-4"
      >
        <div class="flex items-center gap-2">
          <Badge>默认</Badge>
          <Badge variant="success">正常</Badge>
          <Badge variant="warning">预警</Badge>
          <Badge variant="destructive">报警</Badge>
          <Badge variant="outline">描边</Badge>
        </div>
        <div class="flex items-center gap-2">
          <Avatar fallback="老莫" />
          <Avatar fallback="王工" class="h-8 w-8" />
          <span class="text-xs text-muted-foreground">Avatar（无图显示文字兜底）</span>
        </div>
        <Breadcrumb :items="crumbs" />
      </div>

      <!-- 卡片 + 警告 + 进度 + 骨架屏 -->
      <div class="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>风机运行月报</CardTitle>
            <CardDescription>主通风机 10 月运行摘要（Card 组件示例）</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Alert variant="warning">
              <ShieldAlert />
              <div>
                <AlertTitle>2 号风机轴承温度接近阈值</AlertTitle>
                <AlertDescription>建议列入本周检修计划，持续观察振动数据。</AlertDescription>
              </div>
            </Alert>
            <div>
              <div class="mb-1.5 flex items-center justify-between text-sm">
                <span>月度检修计划完成率</span>
                <span class="font-medium tabular-nums text-primary">{{ progressVal }}%</span>
              </div>
              <Progress :model-value="progressVal" />
            </div>
          </CardContent>
          <CardFooter class="gap-2">
            <Button size="sm" @click="progressVal = Math.min(100, progressVal + 8)">进度 +8</Button>
            <Button size="sm" variant="outline" @click="progressVal = 0">归零</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>骨架屏（Skeleton）</CardTitle>
            <CardDescription>数据加载中的占位形态，避免白屏跳跃</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex items-center gap-3">
              <Skeleton class="h-10 w-10 rounded-full" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-3.5 w-2/3" />
                <Skeleton class="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton class="h-24 w-full" />
          </CardContent>
        </Card>
      </div>

      <!-- 侧滑抽屉 -->
      <div class="flex flex-wrap items-center gap-3">
        <Sheet
          v-model:open="sheetOpen"
          side="right"
          title="快速详情"
          description="Sheet 组件：从右侧滑出的面板"
        >
          <div class="space-y-3 text-sm">
            <p><span class="text-muted-foreground">监测点：</span>3号回风巷 T2</p>
            <p><span class="text-muted-foreground">位置：</span>-320m 水平 三采区</p>
            <p>
              <span class="text-muted-foreground">当前状态：</span
              ><Badge variant="warning">预警</Badge>
            </p>
          </div>
          <template #trigger>
            <Button variant="outline">
              <ChevronRight class="h-4 w-4" />
              打开侧滑抽屉
            </Button>
          </template>
        </Sheet>
      </div>
    </div>
  </PageSection>

  <!-- ===== 权限演示卡片 ===== -->
  <PageSection
    id="permission"
    title="权限方案演示（菜单过滤 / 路由守卫 / 按钮级指令）"
    description="三层权限控制共用一套权限码：侧边栏菜单按权限过滤、路由 meta.permission 守卫（无权限跳 403）、v-permission 指令控制按钮显隐。"
  >
    <template #icon>
      <ShieldCheck class="h-5 w-5 text-primary" />
    </template>

    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted-foreground">当前用户权限码：</span>
        <Badge v-for="p in permissions" :key="p" variant="secondary">{{ p }}</Badge>
      </div>

      <div
        class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-4"
      >
        <Button v-permission="'monitor:view'" @click="router.push('/monitor')"
          >进入数据监测（有权限，可见）</Button
        >
        <Button v-permission="'danger:action'" variant="destructive"
          >危险操作（无权限，已被移除）</Button
        >
        <span class="text-xs text-muted-foreground"
          >v-permission 指令：无权限元素挂载时直接移除</span
        >
      </div>

      <Alert variant="info">
        <ShieldCheck />
        <div>
          <AlertTitle>试试直接访问受保护路由</AlertTitle>
          <AlertDescription>
            侧边栏看不到「审计日志」菜单（当前用户无 audit:view 权限）；即使手动输入 #/audit
            地址，路由守卫也会拦截并跳转到 403 页面。
          </AlertDescription>
        </div>
      </Alert>
    </div>
  </PageSection>
</template>
