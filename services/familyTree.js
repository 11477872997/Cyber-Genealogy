export function buildFamilyTree(members) {
  const nodes = new Map(members.map((member) => [member.id, { ...member, child: [] }]))
  const spouseOwner = new Map()

  members.forEach((member) => {
    if (!isSpouseMember(member) || !member.parentId) return
    const owner = nodes.get(member.parentId)
    const spouse = nodes.get(member.id)
    if (owner && spouse && !owner.spouse) {
      owner.spouse = spouse
      spouseOwner.set(member.id, owner.id)
    }
  })

  const roots = []
  members.forEach((member) => {
    if (spouseOwner.has(member.id)) return
    const node = nodes.get(member.id)
    const parentId = spouseOwner.get(member.parentId) || member.parentId
    const parent = nodes.get(parentId)
    if (parent && parent.id !== node.id) parent.child.push(node)
    else roots.push(node)
  })

  const sortNodes = (list) => {
    list.sort((left, right) => (left.x || 0) - (right.x || 0))
    list.forEach((item) => sortNodes(item.child))
  }
  sortNodes(roots)
  return roots
}

export function isSpouseMember(member) {
  return member?.relationType === 'spouse' || member?.role === '配偶'
}

function chineseOrder(index) {
  return ['长', '次', '三', '四', '五', '六', '七', '八', '九', '十'][index] || `第${index + 1}`
}

export function relationshipLabel(member, members) {
  if (!member) return '家族成员'
  if (isSpouseMember(member)) return member.gender === '男' ? '丈夫' : '妻子'
  if (!member.parentId) return '始祖'

  const spouseOwners = new Map(
    members.filter(isSpouseMember).map((item) => [item.id, item.parentId]),
  )
  const parentId = spouseOwners.get(member.parentId) || member.parentId
  const siblings = members
    .filter((item) => !isSpouseMember(item))
    .filter((item) => (spouseOwners.get(item.parentId) || item.parentId) === parentId)
    .filter((item) => item.gender === member.gender)
    .sort((left, right) => {
      const leftRank = Number(left.rank) || Number.MAX_SAFE_INTEGER
      const rightRank = Number(right.rank) || Number.MAX_SAFE_INTEGER
      return leftRank - rightRank || (left.x || 0) - (right.x || 0) || (left.createdAt || 0) - (right.createdAt || 0) || String(left.id).localeCompare(String(right.id))
    })
  const index = Math.max(0, siblings.findIndex((item) => item.id === member.id))
  return `${chineseOrder(index)}${member.gender === '女' ? '女' : '子'}`
}
