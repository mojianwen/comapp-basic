<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ChevronDown, ChevronRight, ListTree, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-vue-next'
import { DialogRoot } from 'reka-ui'
import {
  Badge,
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Input,
  Label,
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
  assignRoleMenus,
  createRole,
  deleteRole,
  getRoleMenus,
  listMenus,
  listRoles,
  updateRole,
  type MenuRow,
  type RoleRow,
} from '../../api/system'
import { ApiError } from '../../api/ApiError'
import { buildMenuTree, collectIds, flattenTree, type MenuNode } from './menuUtils'

/* ===== 列表 ===== */
const list = ref<RoleRow[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = await listRoles()
  } catch (e) {
    toast({ variant: 'error', title: '加载失败', description: e instanceof ApiError ? e.message : String(e) })
  } finally {
    loading.value = false
  }
}

/* ===== 新增 / 编辑 ===== */
const dialogOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ code: '', name: '', description: '', status: 1 })
const formError = ref('')
const submitting = ref(false)

const statusOn = computed({
  get: () => form.status === 1,
  set: (v: boolean) => (form.status = v ? 1 : 0),
})

function openCreate() {
  editingId.value = null
  Object.assign(form, { code: '', name: '', description: '', status: 1 })
  formError.value = ''
  dialogOpen.value = true
}

function openEdit(row: RoleRow) {
  editingId.value = row.id
  Object.assign(form, { code: row.code, name: row.name, description: row.description ?? '', status: row.status })
  formError.value = ''
  dialogOpen.value = true
}

async function submit() {
  formError.value = ''
  if (!form.code.trim() || !form.name.trim()) {
    formError.value = '角色编码与名称均为必填项'
    return
  }
  submitting.value = true
  try {
    if (editingId.value) {
      await updateRole(editingId.value, { name: form.name, description: form.description || null, status: form.status })
      toast({ variant: 'success', title: '保存成功', description: `角色「${form.name}」已更新` })
    } else {
      await createRole({ code: form.code, name: form.name, description: form.description || null, status: form.status })
      toast({ variant: 'success', title: '新增成功', description: `角色「${form.name}」已创建` })
    }
    dialogOpen.value = false
    await load()
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

/* ===== 删除 ===== */
const deleteTarget = ref<RoleRow | null>(null)

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteRole(deleteTarget.value.id)
    toast({ variant: 'success', title: '已删除', description: `角色「${deleteTarget.value.name}」` })
    deleteTarget.value = null
    await load()
  } catch (e) {
    toast({ variant: 'error', title: '删除失败', description: e instanceof ApiError ? e.message : String(e) })
    deleteTarget.value = null
  }
}

/* ===== 分配菜单（树形勾选） ===== */
const assignOpen = ref(false)
const assignTarget = ref<RoleRow | null>(null)
const assignSaving = ref(false)
const menuRows = ref<MenuRow[]>([])
const menuTree = computed(() => buildMenuTree(menuRows.value))
const nodeMap = computed(() => {
  const map = new Map<number, MenuNode>()
  const walk = (nodes: MenuNode[]) => {
    nodes.forEach((n) => {
      map.set(n.id, n)
      walk(n.children)
    })
  }
  walk(menuTree.value)
  return map
})
const expanded = ref(new Set<number>())
const checkedIds = ref(new Set<number>())

const flatMenus = computed(() => flattenTree(menuTree.value, expanded.value))

/** 勾选/取消节点：联动全部子孙，再向上同步父级半选状态 */
function toggleNode(node: MenuNode, checked: boolean) {
  const ids = collectIds(node)
  for (const id of ids) {
    if (checked) checkedIds.value.add(id)
    else checkedIds.value.delete(id)
  }
  syncAncestors(node.parent_id)
}

function onToggle(node: MenuNode, e: Event) {
  toggleNode(node, (e.target as HTMLInputElement).checked)
}

/** 自下而上：父级所有子节点被勾选则自动勾上，否则取消 */
function syncAncestors(parentId: number | null) {
  if (!parentId) return
  const parent = nodeMap.value.get(parentId)
  if (!parent) return
  if (parent.children.length && parent.children.every((c) => checkedIds.value.has(c.id))) {
    checkedIds.value.add(parent.id)
  } else {
    checkedIds.value.delete(parent.id)
  }
  syncAncestors(parent.parent_id)
}

/** 回显后自下而上补齐「全部子节点已勾选」的父级 */
function syncAllAncestors() {
  const all = [...nodeMap.value.values()].sort((a, b) => b.id - a.id)
  for (const n of all) {
    if (n.children.length && n.children.every((c) => checkedIds.value.has(c.id))) checkedIds.value.add(n.id)
  }
}

function hasCheckedDescendant(node: MenuNode): boolean {
  return node.children.some((c) => checkedIds.value.has(c.id) || hasCheckedDescendant(c))
}

function toggleExpand(id: number) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

async function openAssign(row: RoleRow) {
  assignTarget.value = row
  assignOpen.value = true
  try {
    if (!menuRows.value.length) menuRows.value = await listMenus()
    // 展开全部父节点
    expanded.value = new Set()
    const walk = (nodes: MenuNode[]) => {
      nodes.forEach((n) => {
        if (n.children.length) expanded.value.add(n.id)
        walk(n.children)
      })
    }
    walk(menuTree.value)
    const ids = await getRoleMenus(row.id)
    checkedIds.value = new Set(ids)
    syncAllAncestors()
  } catch (e) {
    toast({ variant: 'error', title: '加载菜单失败', description: e instanceof ApiError ? e.message : String(e) })
  }
}

async function submitAssign() {
  if (!assignTarget.value) return
  assignSaving.value = true
  try {
    await assignRoleMenus(assignTarget.value.id, [...checkedIds.value])
    toast({
      variant: 'success',
      title: '分配成功',
      description: `角色「${assignTarget.value.name}」已绑定 ${checkedIds.value.size} 项菜单/权限`,
    })
    assignOpen.value = false
    await load()
  } catch (e) {
    toast({ variant: 'error', title: '分配失败', description: e instanceof ApiError ? e.message : String(e) })
  } finally {
    assignSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageSection
    bare
    title="角色管理"
    description="角色增删改查与菜单权限分配；删除前校验用户绑定，内置角色受保护。"
  >
    <template #actions>
      <Button v-permission="'role:create'" @click="openCreate">
        <Plus class="h-4 w-4" />
        新增角色
      </Button>
    </template>

    <!-- 角色表格 -->
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead>角色编码</TableHead>
          <TableHead>角色名称</TableHead>
          <TableHead>描述</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>用户数</TableHead>
          <TableHead class="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="r in list" :key="r.id">
          <TableCell class="font-mono text-xs">
            {{ r.code }}
            <Badge v-if="r.is_builtin" variant="secondary" class="ml-1">内置</Badge>
          </TableCell>
          <TableCell class="font-medium">{{ r.name }}</TableCell>
          <TableCell class="text-muted-foreground">{{ r.description ?? '-' }}</TableCell>
          <TableCell>
            <Badge :variant="r.status === 1 ? 'success' : 'destructive'">{{ r.status === 1 ? '启用' : '停用' }}</Badge>
          </TableCell>
          <TableCell class="tabular-nums">{{ r.user_count }}</TableCell>
          <TableCell class="text-right">
            <div class="flex justify-end gap-1">
              <Button v-permission="'role:edit'" variant="ghost" size="sm" @click="openEdit(r)">
                <Pencil class="h-3.5 w-3.5" />
                编辑
              </Button>
              <Button v-permission="'role:assign'" variant="ghost" size="sm" @click="openAssign(r)">
                <ListTree class="h-3.5 w-3.5" />
                分配菜单
              </Button>
              <Button v-permission="'role:delete'" variant="ghost" size="sm" class="text-destructive" @click="deleteTarget = r">
                <Trash2 class="h-3.5 w-3.5" />
                删除
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="!list.length && !loading">
          <TableCell colspan="6" class="py-10 text-center text-muted-foreground">
            <ShieldCheck class="mx-auto mb-2 h-8 w-8 opacity-40" />
            暂无数据
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- 新增 / 编辑弹窗 -->
    <DialogRoot v-model:open="dialogOpen">
      <DialogContent class="max-w-lg">
        <DialogTitle>{{ editingId ? '编辑角色' : '新增角色' }}</DialogTitle>
        <DialogDescription>
          {{ editingId ? `修改角色「${form.name}」的基本信息` : '角色编码创建后不可修改，用于权限码前缀与前后端约定。' }}
        </DialogDescription>

        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>角色编码 <span class="text-destructive">*</span></Label>
              <Input v-model="form.code" :disabled="!!editingId" placeholder="如 inspector" class="font-mono" />
            </div>
            <div class="space-y-1.5">
              <Label>角色名称 <span class="text-destructive">*</span></Label>
              <Input v-model="form.name" placeholder="显示名称" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>描述</Label>
            <Input v-model="form.description" placeholder="角色职责说明，选填" />
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

    <!-- 分配菜单弹窗（树形勾选） -->
    <DialogRoot v-model:open="assignOpen">
      <DialogContent class="max-w-xl">
        <DialogTitle>分配菜单</DialogTitle>
        <DialogDescription>
          为角色「{{ assignTarget?.name }}」勾选可见菜单与按钮权限；勾选父级将自动选中全部子级。
        </DialogDescription>

        <div class="max-h-96 space-y-0.5 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
          <div
            v-for="{ node, depth } in flatMenus"
            :key="node.id"
            class="flex items-center gap-1.5 rounded py-1 pr-2 hover:bg-muted/60"
            :style="{ paddingLeft: `${depth * 20 + 8}px` }"
          >
            <button
              v-if="node.children.length"
              class="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              @click="toggleExpand(node.id)"
            >
              <ChevronDown v-if="expanded.has(node.id)" class="h-3.5 w-3.5" />
              <ChevronRight v-else class="h-3.5 w-3.5" />
            </button>
            <span v-else class="h-4 w-4" />

            <input
              type="checkbox"
              class="h-4 w-4 cursor-pointer accent-primary"
              :checked="checkedIds.has(node.id)"
              :indeterminate="!checkedIds.has(node.id) && hasCheckedDescendant(node)"
              @change="onToggle(node, $event)"
            />

            <span class="text-sm">{{ node.title }}</span>
            <Badge v-if="node.type === 1" variant="outline" class="ml-auto text-[10px]">目录</Badge>
            <Badge v-else-if="node.type === 2" variant="secondary" class="ml-auto text-[10px]">菜单</Badge>
            <Badge v-else variant="outline" class="ml-auto text-[10px] text-muted-foreground">{{ node.permission }}</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="assignOpen = false">取消</Button>
          <Button :disabled="assignSaving" @click="submitAssign">{{ assignSaving ? '保存中...' : '保存分配' }}</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>

    <!-- 删除确认弹窗 -->
    <DialogRoot :open="!!deleteTarget" @update:open="deleteTarget = null">
      <DialogContent class="max-w-md">
        <DialogTitle>确认删除角色？</DialogTitle>
        <DialogDescription>
          将删除角色「{{ deleteTarget?.name }}」（{{ deleteTarget?.code }}）及其菜单绑定；若仍有用户绑定该角色，删除会被拒绝。
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" @click="deleteTarget = null">取消</Button>
          <Button variant="destructive" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  </PageSection>
</template>
