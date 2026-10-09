import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export function useTreeCanvas(members, selectedMemberId, canvasId, viewportId) {
  const instance = getCurrentInstance()?.proxy
  const scale = ref(1)
  const offset = ref({ x: 0, y: 0 })
  const canvasSize = ref({ width: 860, height: 492 })
  let interaction = null
  let drawTimer = null

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + width, y, x + width, y + height, radius)
    ctx.arcTo(x + width, y + height, x, y + height, radius)
    ctx.arcTo(x, y + height, x, y, radius)
    ctx.arcTo(x, y, x + width, y, radius)
    ctx.closePath()
  }

  function draw() {
    if (typeof uni === 'undefined' || !uni.createCanvasContext) return
    const { width, height } = canvasSize.value
    const ctx = uni.createCanvasContext(canvasId, instance)
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2 + offset.value.x, 28 + offset.value.y)
    ctx.scale(scale.value, scale.value)

    ctx.setStrokeStyle('rgba(99, 128, 125, .55)')
    ctx.setLineWidth(1.6)
    members.value.forEach((end) => {
      const start = members.value.find((member) => member.id === end.parentId)
      if (!start || !end) return
      const startX = start.x - 460
      const endX = end.x - 460
      const startY = start.y + 44
      const endY = end.y
      const pivotY = startY + (endY - startY) / 2
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(startX, pivotY)
      ctx.lineTo(endX, pivotY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    })

    members.value.forEach((member) => {
      const x = member.x - 460
      const y = member.y
      const active = selectedMemberId.value === member.id
      drawRoundedRect(ctx, x - 72, y, 144, 88, 8)
      ctx.setFillStyle(active ? '#fffdf7' : '#f4f6f1')
      ctx.fill()
      ctx.setStrokeStyle(active ? '#e1845b' : 'rgba(116, 145, 139, .46)')
      ctx.setLineWidth(active ? 2.4 : 1)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(x - 43, y + 31, 18, 0, Math.PI * 2)
      ctx.setFillStyle(member.color)
      ctx.fill()

      ctx.setTextAlign('center')
      ctx.setTextBaseline('middle')
      ctx.setFontSize(14)
      ctx.setFillStyle('#243332')
      ctx.fillText(member.avatar, x - 43, y + 32)

      ctx.setTextAlign('left')
      ctx.setTextBaseline('alphabetic')
      ctx.setFontSize(15)
      ctx.setFillStyle('#20302f')
      ctx.fillText(member.name, x - 17, y + 31)
      ctx.setFontSize(11)
      ctx.setFillStyle('#78908b')
      ctx.fillText(member.generation, x - 17, y + 50)
      ctx.setFontSize(10)
      ctx.setFillStyle('#b36649')
      ctx.fillText(member.role, x - 17, y + 69)
    })

    ctx.restore()
    ctx.draw(false)
  }

  function scheduleDraw() {
    if (drawTimer) clearTimeout(drawTimer)
    drawTimer = setTimeout(() => {
      drawTimer = null
      draw()
    }, 16)
  }

  function measureCanvas() {
    if (typeof uni === 'undefined' || !uni.createSelectorQuery) {
      scheduleDraw()
      return
    }
    const query = uni.createSelectorQuery()
    const scopedQuery = instance && query.in ? query.in(instance) : query
    scopedQuery.select(`#${viewportId}`).boundingClientRect((rect) => {
      if (rect?.width && rect?.height) {
        canvasSize.value = {
          width: Math.max(Math.round(rect.width), 1),
          height: Math.max(Math.round(rect.height), 1),
        }
      }
      scheduleDraw()
    }).exec()
  }

  function zoom(amount) {
    scale.value = Math.min(1.35, Math.max(.72, scale.value + amount))
    scheduleDraw()
  }

  function reset() {
    scale.value = 1
    offset.value = { x: 0, y: 0 }
    scheduleDraw()
  }

  function eventPoint(event, changed = false) {
    const source = (changed ? event.changedTouches?.[0] : event.touches?.[0])
      || event.changedTouches?.[0]
      || event.touches?.[0]
      || event
    return {
      x: source.x ?? source.offsetX ?? source.clientX ?? source.pageX ?? 0,
      y: source.y ?? source.offsetY ?? source.clientY ?? source.pageY ?? 0,
    }
  }

  function startInteraction(event) {
    const point = eventPoint(event)
    interaction = {
      startX: point.x,
      startY: point.y,
      originX: offset.value.x,
      originY: offset.value.y,
    }
  }

  function moveInteraction(event) {
    if (!interaction) return
    const point = eventPoint(event)
    offset.value = {
      x: interaction.originX + point.x - interaction.startX,
      y: interaction.originY + point.y - interaction.startY,
    }
    scheduleDraw()
  }

  function finishInteraction(event) {
    if (!interaction) return
    const point = eventPoint(event, true)
    const moved = Math.abs(point.x - interaction.startX) + Math.abs(point.y - interaction.startY)
    if (moved < 8) {
      const { width } = canvasSize.value
      const x = (point.x - width / 2 - offset.value.x) / scale.value + 460
      const y = (point.y - 28 - offset.value.y) / scale.value
      const clicked = members.value.find((member) => (
        Math.abs(x - member.x) < 76 && y >= member.y - 4 && y <= member.y + 92
      ))
      if (clicked) selectedMemberId.value = clicked.id
    }
    interaction = null
    scheduleDraw()
  }

  function cancelInteraction() {
    interaction = null
  }

  function onWheel(event) {
    event.preventDefault?.()
    zoom(event.deltaY > 0 ? -.06 : .06)
  }

  onMounted(async () => {
    await nextTick()
    measureCanvas()
    uni?.onWindowResize?.(measureCanvas)
  })

  onBeforeUnmount(() => {
    if (drawTimer) clearTimeout(drawTimer)
    uni?.offWindowResize?.(measureCanvas)
  })

  watch([selectedMemberId, members], scheduleDraw, { deep: true })

  return {
    scale,
    canvasSize,
    zoom,
    reset,
    startInteraction,
    moveInteraction,
    finishInteraction,
    cancelInteraction,
    onWheel,
  }
}
