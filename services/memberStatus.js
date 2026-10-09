export function isMemberAlive(member) {
  if (member?.isLife != null) return member.isLife !== false && member.isLife !== '0' && member.isLife !== 0
  return !/[—–-]\s*\d{4}\s*$/.test(String(member?.birth || ''))
}
