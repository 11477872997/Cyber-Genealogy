function layoutNode(node) {
  const children = (node.children || []).map(layoutNode)
  // Reserve the actual card width plus breathing room. The original plugin's
  // 190px single-person slot made a small family almost 1000px wide on mobile.
  const minWidth = node.spouse?.length ? 204 : 112
  return {
    ...node,
    children,
    layoutWidth: Math.max(minWidth, children.reduce((total, child) => total + child.layoutWidth, 0)),
  }
}

export function layoutFgTree(list) {
  return list.map(layoutNode)
}

const CARD_WIDTH = 90
const CARD_HEIGHT = 140
const PARTNER_GAP = 8
const LEVEL_HEIGHT = 220

function visibleNode(node, collapsedIds) {
  const allChildren = node.children || []
  const children = collapsedIds.has(node.id) ? [] : allChildren.map((child) => visibleNode(child, collapsedIds))
  const peopleCount = 1 + (node.spouse?.length || 0)
  const peopleWidth = peopleCount * CARD_WIDTH + Math.max(0, peopleCount - 1) * PARTNER_GAP
  const childrenWidth = children.reduce((total, child) => total + child.layoutWidth, 0)
  return {
    ...node,
    children,
    hasChildren: allChildren.length > 0,
    layoutWidth: Math.max(peopleCount > 1 ? 204 : 112, peopleWidth, childrenWidth),
  }
}

export function flattenFgTree(list, collapsed = []) {
  const collapsedIds = new Set(collapsed)
  const roots = (list || []).map((node) => visibleNode(node, collapsedIds))
  const cards = []
  const lines = []
  const folds = []
  let maxDepth = 0

  function place(node, left, depth) {
    maxDepth = Math.max(maxDepth, depth)
    const people = [node, ...(node.spouse || [])]
    const peopleWidth = people.length * CARD_WIDTH + Math.max(0, people.length - 1) * PARTNER_GAP
    const peopleLeft = left + (node.layoutWidth - peopleWidth) / 2
    const top = depth * LEVEL_HEIGHT
    const centerX = left + node.layoutWidth / 2

    people.forEach((person, index) => {
      cards.push({ ...person, x: peopleLeft + index * (CARD_WIDTH + PARTNER_GAP), y: top })
    })

    if (node.hasChildren) {
      folds.push({ id: node.id, x: centerX - 12, y: top + CARD_HEIGHT + 14, collapsed: collapsedIds.has(node.id) })
    }

    if (!node.children.length) return centerX

    const lineY = top + CARD_HEIGHT + 50
    let childLeft = left
    const childCenters = node.children.map((child) => {
      const childCenter = place(child, childLeft, depth + 1)
      childLeft += child.layoutWidth
      return childCenter
    })

    lines.push({ x: centerX, y: top + CARD_HEIGHT, width: 1, height: 50 })
    const firstCenter = childCenters[0]
    const lastCenter = childCenters[childCenters.length - 1]
    lines.push({ x: firstCenter, y: lineY, width: Math.max(1, lastCenter - firstCenter), height: 1 })
    childCenters.forEach((childCenter) => {
      lines.push({ x: childCenter, y: lineY, width: 1, height: LEVEL_HEIGHT - (lineY - top) })
    })
    return centerX
  }

  const contentWidth = roots.reduce((total, root) => total + root.layoutWidth, 0)
  let rootLeft = 0
  roots.forEach((root) => {
    place(root, rootLeft, 0)
    rootLeft += root.layoutWidth
  })

  return {
    cards,
    lines,
    folds,
    width: Math.max(190, contentWidth),
    height: Math.max(180, maxDepth * LEVEL_HEIGHT + CARD_HEIGHT),
  }
}
