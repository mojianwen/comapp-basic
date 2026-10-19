<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, Search, Trash2, UserRound } from 'lucide-vue-next'
import { DialogRoot } from 'reka-ui'
import {
  Badge,
  Button,
  Checkbox,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Input,
  Label,
  Pagination,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@mo/components'
import { PageSection } from '@mo/layouts'
import {
  createUser,
  deleteUser,
  listRoles,
  listUsers,
  updateUser,
  updateUserStatus,
  type RoleRow,
  type UserRow,
} from '../../api/system'
import { ApiError } from '../../api/ApiError'

/* ===== 列表状态 ===== */
const list = ref<UserRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const keyword = ref('')
const statusFilter = ref<'' | 0 | 1>('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await listUsers({ page: page.value, pageSize, keyword: keyword.value, status: statusFilter.value })
    list.value = data.list
    total.value = data.total
  } catch (e) {
    toast({ variant: 'error', title: '加载失败', description: e instanceof ApiError ? e.message : String(e) })
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

/* ===== 角色选项（新增/编辑表单用） ===== */
const roleOptions = ref<RoleRow[]>([])
async function loadRoles() {
  roleOptions.value = await listRoles()
}

/* ===== 新增 / 编辑 ===== */
const dialogOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ username: '', name: '', password: '', email: '', phone: '', status: 1, roleIds: [] as number[] })
const formError = ref('')
const submitting = ref(false)

function openCreate() {
  editingId.value = null
  Object.assign(form, { username: '', name: '', password: '', email: '', phone: '', status: 1, roleIds: [] })
  formError.value = ''
  dialogOpen.value = true
}

function openEdit(row: UserRow) {
  editingId.value = row.id
  Object.assign(form, {
    username: row.username,
    name: row.name,
    password: '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    status: row.status,
    roleIds: row.roles.map((r) => r.id),
  })
  formError.value = ''
  dialogOpen.value = true
}

async function submit() {
  formError.value = ''
  if (!form.name.trim()) {
    formError.value = '姓名为必填项'
    return
  }
  if (!editingId.value && (!form.username.trim() || form.password.length < 6)) {
    formError.value = '用户名必填，密码至少 6 位'
    return
  }
  submitting.value = true
  try {
    if (editingId.value) {
      await updateUser(editingId.value, {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
        roleIds: form.roleIds,
      })
      toast({ variant: 'success', title: '保存成功', description: `用户「${form.name}」已更新` })
    } else {
      await createUser({
        username: form.username,
        name: form.name,
        password: form.password,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
        roleIds: form.roleIds,
      })
      toast({ variant: 'success', title: '新增成功', description: `用户「${form.name}」已创建` })
    }
    dialogOpen.value = false
    await load()
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

/* ===== 启停 / 删除 ===== */
const deleteTarget = ref<UserRow | null>(null)

async function toggleStatus(row: UserRow) {
  try {
    await updateUserStatus(row.id, row.status === 1 ? 0 : 1)
    toast({ variant: 'success', title: row.status === 1 ? '已停用' : '已启用', description: `用户「${row.name}」` })
    await load()
  } catch (e) {
    toast({ variant: 'error', title: '操作失败', description: e instanceof ApiError ? e.message : String(e) })
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteUser(deleteTarget.value.id)
    toast({ variant: 'success', title: '已删除', description: `用户「${deleteTarget.value.name}」` })
    deleteTarget.value = null
    await load()
  } catch (e) {
    toast({ variant: 'error', title: '删除失败', description: e instanceof ApiError ? e.message : String(e) })
    deleteTarget.value = null
  }
}

function fmt(ts: string) {
  return ts ? new Date(ts).toLocaleString('zh-CN', { hour12: false }) : '-'
}

onMounted(() => {
  load()
  loadRoles()
})

/** 开关组件用布尔值，表单里保持数值 0/1 */
const statusOn = computed({
  get: () => form.status === 1,
  set: (v: boolean) => (form.status = v ? 1 : 0),
})
</script>

<template>
  <PageSection
    bare
    title="用户管理"
    description="账号增删改查、启停用与角色分配；按钮级操作受权限码控制（user:create / user:edit / user:delete）。"
  >
    <template #actions>
      <Button v-permission="'user:create'" @click="openCreate">
        <Plus class="h-4 w-4" />
        新增用户
      </Button>
    </template>

    <!-- 搜索栏 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input v-model="keyword" placeholder="搜索用户名 / 姓名" class="w-60 pl-8" @keyup.enter="search" />
      </div>
      <select
        v-model="statusFilter"
        class="h-9 rounded-md border border-input bg-muted/40 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="状态筛选"
        @change="search"
      >
        <option value="">全部状态</option>
        <option :value="1">启用</option>
        <option :value="0">停用</option>
      </select>
      <Button variant="outline" size="sm" @click="search">
        <Search class="h-3.5 w-3.5" />
        查询
      </Button>
      <span class="text-xs text-muted-foreground">共 {{ total }} 个用户</span>
    </div>

    <!-- 用户表格 -->
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead>用户名</TableHead>
          <TableHead>姓名</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>邮箱</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead class="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="u in list" :key="u.id">
          <TableCell class="font-medium">
            {{ u.username }}
            <Badge v-if="u.is_builtin" variant="secondary" class="ml-1">内置</Badge>
          </TableCell>
          <TableCell>{{ u.name }}</TableCell>
          <TableCell>
            <div class="flex flex-wrap gap-1">
              <Badge v-for="r in u.roles" :key="r.id" variant="outline">{{ r.name }}</Badge>
              <span v-if="!u.roles.length" class="text-xs text-muted-foreground">未分配</span>
            </div>
          </TableCell>
          <TableCell class="text-muted-foreground">{{ u.email ?? '-' }}</TableCell>
          <TableCell>
            <Badge :variant="u.status === 1 ? 'success' : 'destructive'">{{ u.status === 1 ? '启用' : '停用' }}</Badge>
          </TableCell>
          <TableCell class="text-muted-foreground tabular-nums text-xs">{{ fmt(u.created_at) }}</TableCell>
          <TableCell class="text-right">
            <div class="flex justify-end gap-1">
              <Button v-permission="'user:edit'" variant="ghost" size="sm" @click="openEdit(u)">
                <Pencil class="h-3.5 w-3.5" />
                编辑
              </Button>
              <Button v-permission="'user:edit'" variant="ghost" size="sm" @click="toggleStatus(u)">
                {{ u.status === 1 ? '停用' : '启用' }}
              </Button>
              <Button v-permission="'user:delete'" variant="ghost" size="sm" class="text-destructive" @click="deleteTarget = u">
                <Trash2 class="h-3.5 w-3.5" />
                删除
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="!list.length && !loading">
          <TableCell colspan="7" class="py-10 text-center text-muted-foreground">
            <UserRound class="mx-auto mb-2 h-8 w-8 opacity-40" />
            暂无数据
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- 分页 -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
      <p class="text-sm text-muted-foreground">第 {{ page }} / {{ pageCount }} 页</p>
      <Pagination :page="page" :total-pages="pageCount" @update:page="page = $event; load()" />
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <DialogRoot v-model:open="dialogOpen">
      <DialogContent class="max-w-lg">
        <DialogTitle>{{ editingId ? '编辑用户' : '新增用户' }}</DialogTitle>
        <DialogDescription>
          {{ editingId ? `修改用户「${form.username}」的信息与角色` : '创建账号并分配角色；密码通过 bcrypt 哈希存储。' }}
        </DialogDescription>

        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>用户名</Label>
              <Input v-model="form.username" :disabled="!!editingId" placeholder="登录账号" />
            </div>
            <div class="space-y-1.5">
              <Label>姓名 <span class="text-destructive">*</span></Label>
              <Input v-model="form.name" placeholder="显示名称" />
            </div>
          </div>

          <div v-if="!editingId" class="space-y-1.5">
            <Label>初始密码 <span class="text-destructive">*</span></Label>
            <Input v-model="form.password" type="password" placeholder="至少 6 位" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>邮箱</Label>
              <Input v-model="form.email" type="email" placeholder="name@mine.com" />
            </div>
            <div class="space-y-1.5">
              <Label>手机</Label>
              <Input v-model="form.phone" placeholder="选填" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>角色</Label>
            <div class="flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-border bg-muted/30 p-3">
              <label v-for="r in roleOptions" :key="r.id" class="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox :model-value="form.roleIds.includes(r.id)" @update:model-value="form.roleIds = $event ? [...form.roleIds, r.id] : form.roleIds.filter(i => i !== r.id)" />
                {{ r.name }}
              </label>
            </div>
          </div>

          <div class="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <Switch v-model="statusOn" />
            <span class="text-sm">{{ form.status === 1 ? '启用' : '停用' }}</span>
          </div>

          <p v-if="formError" class="text-xs text-destructive" role="alert">{{ formError }}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">取消</Button>
          <Button :disabled="submitting" @click="submit">{{ submitting ? '保存中...' : '保存' }}</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>

    <!-- 删除确认弹窗 -->
    <DialogRoot :open="!!deleteTarget" @update:open="deleteTarget = null">
      <DialogContent class="max-w-md">
        <DialogTitle>确认删除用户？</DialogTitle>
        <DialogDescription>
          将删除用户「{{ deleteTarget?.name }}」（{{ deleteTarget?.username }}）及其角色绑定，删除后不可恢复。
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" @click="deleteTarget = null">取消</Button>
          <Button variant="destructive" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  </PageSection>
</template>
