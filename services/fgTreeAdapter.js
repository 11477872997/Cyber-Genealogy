import { buildFamilyTree, relationshipLabel } from './familyTree.js'
import { isMemberAlive } from './memberStatus.js'

function person(member, members) {
  return {
    id: member.id,
    name: member.name,
    relation: relationshipLabel(member, members),
    generation: member.generation,
    note: member.note || '',
    isLife: isMemberAlive(member),
    avatar: member.avatar || member.name?.slice(0, 1) || '',
    avatarUrl: member.avatarUrl || '',
    color: member.color || '#d8e7df',
  }
}

function branch(node, members) {
  const children = node.child.map((child) => branch(child, members))
  const spouse = node.spouse ? [person(node.spouse, members)] : []
  return { ...person(node, members), spouse, children }
}

export function toFgTree(members) {
  return buildFamilyTree(members).map((node) => branch(node, members))
}
