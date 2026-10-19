import type { MenuRow } from '../../api/system'

export interface MenuNode extends MenuRow {
  children: MenuNode[]
}

/** 平铺菜单 → 树（按 sort_order, id 排序依赖后端返回顺序） */
export function buildMenuTree(rows: MenuRow[]): MenuNode[] {
  const map = new Map<number, MenuNode>()
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }))
  const roots: MenuNode[] = []
  rows.forEach((r) => {
    const node = map.get(r.id)!
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export interface FlatMenu {
  node: MenuNode
  depth: number
}

/** 树 → 展开态平铺（用于表格/勾选列表渲染） */
export function flattenTree(roots: MenuNode[], expanded: Set<number>): FlatMenu[] {
  const out: FlatMenu[] = []
  const walk = (nodes: MenuNode[], depth: number) => {
    for (const n of nodes) {
      out.push({ node: n, depth })
      if (n.children.length && expanded.has(n.id)) walk(n.children, depth + 1)
    }
  }
  walk(roots, 0)
  return out
}

/** 收集节点及全部子孙 id */
export function collectIds(node: MenuNode): number[] {
  return [node.id, ...node.children.flatMap(collectIds)]
}

export const MENU_TYPE_TEXT: Record<number, string> = { 1: '目录', 2: '菜单', 3: '按钮' }
