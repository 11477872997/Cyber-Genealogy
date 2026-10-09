const defaultShare = {
  title: '赛博宗族｜记录家族故事',
  path: '/pages/index/index',
  imageUrl: '/static/logo.png',
}

export function pageSharePayload(custom) {
  return {
    title: custom?.title || defaultShare.title,
    path: custom?.path || defaultShare.path,
    imageUrl: custom?.imageUrl || defaultShare.imageUrl,
  }
}

export function pageTimelinePayload() {
  return { title: defaultShare.title, imageUrl: defaultShare.imageUrl, query: '' }
}

export function showPageShareMenu() {
  // #ifdef MP-WEIXIN
  uni.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
  // #endif
}
