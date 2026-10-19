<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ChevronDown, ChevronRight, ListTree, Pencil, Plus, SquarePlus, Trash2 } from 'lucide-vue-next'
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
  RadioGroup,
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
  createMenu,
  deleteMenu,
  listMenus,
  updateMenu,
  type MenuPayload,
  type MenuRow,
  type MenuType,
} from '../../api/system'
import { ApiError } from '../../api/ApiError'
import { buildMenuTree, collectIds, flattenTree, MENU_TYPE_TEXT, type MenuNode } from './menuUtils'

/* ===== 树形列表 ===== */
const rows = ref<MenuRow[]>([])
const loading = ref(false)
const tree = computed(() => buildMenuTree(rows.value))
const expanded = ref(new Set<number>())
const flat = computed(() => flattenTree(tree.value, expanded.value))

function toggleExpand(id: number) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

async function load() {
  loading.value = true
  try {
    rows.value = await listMenus()
    // 默认展开全部目录
    expanded.value = new Set()
    const walk = (nodes: MenuNode[]) => {
      nodes.forEach((n) => {
        if (n.children.length) expanded.value.add(n.id)
        walk(n.children)
      })
    }
    walk(tree.value)
  } catch (e) {
    toast({ variant: 'error', title: '加载失败', description: e instanceof ApiError ? e.message : String(e) })
  } finally {
    loading.value = false
  }
}

/* ===== 全量平铺（父级下拉用，忽略展开态） ===== */
const allFlat = computed(() => {
  const out: { node: MenuNode; depth: number }[] = []
  const walk = (nodes: MenuNode[], depth: number) => {
    nodes.forEach((n) => {
      out.push({ node: n, depth })
      walk(n.children, depth + 1)
    })
  }
  walk(tree.value, 0)
  return out
})

/* ===== 新增 / 编辑 ===== */
const dialogOpen = ref(false)
const editingId = ref<number | null>(null)
const editingNode = ref<MenuNode | null>(null)
const form = reactive({
  parent_id: null as number | null,
  type: 2 as MenuType,
  title: '',
  path: '',
  icon: '',
  permission: '',
  sort_order: 1,
  status: 1,
})
const formError = ref('')
const submitting = ref(false)

const statusOn = computed({
  get: () => form.status === 1,
  set: (v: boolean) => (form.status = v ? 1 : 0),
})

/** RadioGroup 组件用 string model，这里做数值↔字符串映射 */
const typeModel = computed({
  get: () => String(form.type),
  set: (v: string) => (form.type = Number(v) as MenuType),
})

const typeOptions = [
  { label: '目录（分组节点）', value: '1' },
  { label: '菜单（页面路由）', value: '2' },
  { label: '按钮（权限码）', value: '3' },
]

/** 父级下拉：编辑时排除自己及子孙（防止成环） */
const parentOptions = computed(() => {
  const excluded = editingNode.value ? new Set(collectIds(editingNode.value)) : null
  return allFlat.value
    .filter(({ node }) => !excluded || !excluded.has(node.id))
    .map(({ node, depth }) => ({ id: node.id, label: `${'\u00A0\u00A0\u00A0'.repeat(depth)}${node.title}` }))
})

function openCreate(parent?: MenuRow) {
  editingId.value = null
  editingNode.value = null
  Object.assign(form, {
    parent_id: parent?.id ?? null,
    // 目录下默认建菜单，菜单下默认建按钮
    type: parent ? (parent.type === 1 ? 2 : 3) : 2,
    title: '',
    path: '',
    icon: '',
    permission: '',
    sort_order: 1,
    status: 1,
  })
  formError.value = ''
  dialogOpen.value = true
}

function openEdit(row: MenuRow) {
  editingId.value = row.id
  editingNode.value = nodeById(row.id) ?? null
  Object.assign(form, {
    parent_id: row.parent_id,
    type: row.type,
    title: row.title,
    path: row.path ?? '',
    icon: row.icon ?? '',
    permission: row.permission ?? '',
    sort_order: row.sort_order,
    status: row.status,
  })
  formError.value = ''
  dialogOpen.value = true
}

function nodeById(id: number): MenuNode | undefined {
  const map = new Map<number, MenuNode>()
  const walk = (nodes: MenuNode[]) => {
    nodes.forEach((n) => {
      map.set(n.id, n)
      walk(n.children)
    })
  }
  walk(tree.value)
  return map.get(id)
}

async function submit() {
  formError.value = ''
  if (!form.title.trim()) {
    formError.value = '名称为必填项'
    return
  }
  if (form.type === 2 && !form.path.trim()) {
    formError.value = '菜单类型必须填写路由路径（以 / 开头）'
    return
  }
  const payload: MenuPayload = {
    parent_id: form.parent_id,
    type: form.type,
    title: form.title,
    path: form.type === 2 ? form.path || null : null,
    icon: form.type === 3 ? null : form.icon || null,
    permission: form.type === 1 ? null : form.permission || null,
    sort_order: form.sort_order,
    status: form.status,
  }
  submitting.value = true
  try {
    if (editingId.value) {
      await updateMenu(editingId.value, payload)
      toast({ variant: 'success', title: '保存成功', description: `菜单「${form.title}」已更新` })
    } else {
      await createMenu(payload)
      toast({ variant: 'success', title: '新增成功', description: `菜单「${form.title}」已创建` })
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
const deleteTarget = ref<MenuRow | null>(null)

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteMenu(deleteTarget.value.id)
    toast({ variant: 'success', title: '已删除', description: `菜单「${deleteTarget.value.title}」` })
    deleteTarget.value = null
    await load()
  } catch (e) {
    toast({ variant: 'error', title: '删除失败', description: e instanceof ApiError ? e.message : String(e) })
    deleteTarget.value = null
  }
}

onMounted(load)
</script>

<template>
  <PageSection bare title="菜单管理" description="目录 / 菜单 / 按钮三型树形结构维护，支持权限码与排序；有子节点或角色绑定时不可删除。">
    <template #actions>
      <Button v-permission="'menu:create'" @click="openCreate()">
        <Plus class="h-4 w-4" />
        新增菜单
      </Button>
    </template>

    <!-- 树形表格 -->
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-2/5">名称</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>路径 / 权限码</TableHead>
          <TableHead>排序</TableHead>
          <TableHead>状态</TableHead>
          <TableHead class="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="{ node, depth } in flat" :key="node.id">
          <TableCell>
            <div class="flex items-center gap-1" :style="{ paddingLeft: `${depth * 20}px` }">
              <button
                v-if="node.children.length"
                class="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                @click="toggleExpand(node.id)"
              >
                <ChevronDown v-if="expanded.has(node.id)" class="h-3.5 w-3.5" />
                <ChevronRight v-else class="h-3.5 w-3.5" />
              </button>
              <span v-else class="h-4 w-4" />
              <span class="font-medium" :class="{ 'text-muted-foreground': node.type === 3 }">{{ node.title }}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge :variant="node.type === 1 ? 'default' : node.type === 2 ? 'secondary' : 'outline'" class="text-xs">
              {{ MENU_TYPE_TEXT[node.type] }}
            </Badge>
          </TableCell>
          <TableCell class="font-mono text-xs text-muted-foreground">
            {{ node.type === 2 ? node.path : (node.permission ?? '-') }}
          </TableCell>
          <TableCell class="tabular-nums text-muted-foreground">{{ node.sort_order }}</TableCell>
          <TableCell>
            <Badge :variant="node.status === 1 ? 'success' : 'destructive'">{{ node.status === 1 ? '启用' : '停用' }}</Badge>
          </TableCell>
          <TableCell class="text-right">
            <div class="flex justify-end gap-1">
              <Button
                v-if="node.type !== 3"
                v-permission="'menu:create'"
                variant="ghost"
                size="sm"
                @click="openCreate(node)"
              >
                <SquarePlus class="h-3.5 w-3.5" />
                子级
              </Button>
              <Button v-permission="'menu:edit'" variant="ghost" size="sm" @click="openEdit(node)">
                <Pencil class="h-3.5 w-3.5" />
                编辑
              </Button>
              <Button v-permission="'menu:delete'" variant="ghost" size="sm" class="text-destructive" @click="deleteTarget = node">
                <Trash2 class="h-3.5 w-3.5" />
                删除
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-if="!rows.length && !loading">
          <TableCell colspan="6" class="py-10 text-center text-muted-foreground">
            <ListTree class="mx-auto mb-2 h-8 w-8 opacity-40" />
            暂无数据
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- 新增 / 编辑弹窗 -->
    <DialogRoot v-model:open="dialogOpen">
      <DialogContent class="max-w-lg">
        <DialogTitle>{{ editingId ? '编辑菜单' : '新增菜单' }}</DialogTitle>
        <DialogDescription>
          目录用于分组，菜单对应页面路由，按钮挂载权限码（如 user:create）供 v-permission 与后端校验使用。
        </DialogDescription>

        <div class="grid gap-4">
          <div class="space-y-1.5">
            <Label>类型</Label>
            <RadioGroup v-model="typeModel" :options="typeOptions" :disabled="!!editingNode?.children.length" />
            <p v-if="editingNode?.children.length" class="text-xs text-muted-foreground">已有子节点，类型不可变更</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>父级</Label>
              <select
                v-model="form.parent_id"
                class="flex h-9 w-full rounded-md border border-input bg-muted/40 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="父级菜单"
              >
                <option :value="null">根节点</option>
                <option v-for="opt in parentOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <Label>名称 <span class="text-destructive">*</span></Label>
              <Input v-model="form.title" placeholder="显示名称" />
            </div>
          </div>

          <div v-if="form.type === 2" class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>路由路径</Label>
              <Input v-model="form.path" placeholder="/system/users" class="font-mono" />
            </div>
            <div class="space-y-1.5">
              <Label>图标</Label>
              <Input v-model="form.icon" placeholder="lucide 图标名，如 Users" class="font-mono" />
            </div>
          </div>

          <div v-if="form.type !== 1" class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label>权限码</Label>
              <Input v-model="form.permission" placeholder="如 system:user / user:create" class="font-mono" />
            </div>
            <div class="space-y-1.5">
              <Label>排序号</Label>
              <Input v-model.number="form.sort_order" type="number" placeholder="越小越靠前" />
            </div>
          </div>

          <div v-if="form.type === 1" class="space-y-1.5">
            <Label>图标</Label>
            <Input v-model="form.icon" placeholder="lucide 图标名，如 Settings" class="font-mono" />
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
        <DialogTitle>确认删除菜单？</DialogTitle>
        <DialogDescription>
          将删除{{ MENU_TYPE_TEXT[deleteTarget?.type ?? 2] }}「{{ deleteTarget?.title }}」；若存在子节点或已被角色绑定，删除会被拒绝。
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" @click="deleteTarget = null">取消</Button>
          <Button variant="destructive" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  </PageSection>
</template>
