<script setup>
import AppShell from '../../components/layout/AppShell.vue'

function openWeixinPrivacyContract() {
  const openContract = typeof wx !== 'undefined' && typeof wx.openPrivacyContract === 'function'
    ? wx.openPrivacyContract.bind(wx)
    : null
  if (!openContract) {
    uni.showToast({ title: '请在微信小程序中查看', icon: 'none' })
    return
  }
  openContract({ fail: () => uni.showToast({ title: '暂时无法打开微信隐私保护指引', icon: 'none' }) })
}
</script>

<template>
  <AppShell active-tab="" title="隐私政策" show-back>
    <view class="legal-page">
      <view class="legal-summary">
        <view class="legal-title">赛博宗族隐私政策</view>
        <view>更新日期：2026年10月12日</view>
        <view>生效日期：2026年10月12日</view>
      </view>

      <view class="legal-lead">我们重视你的个人信息和隐私。使用赛博宗族前，请仔细阅读本政策。我们仅在实现登录、保存和共享族谱、完善成员资料、处理反馈所必需的范围内处理信息，并在收集前取得你的同意。</view>

      <view class="legal-section">
        <view class="legal-heading">一、我们如何收集和使用信息</view>
        <view class="legal-item"><text>微信登录信息：</text>当你主动选择微信登录时，我们通过微信登录能力取得登录凭证，并由 uni-id 生成账号标识，用于识别账号、同步云端族谱及接受分享。我们不会取得你的微信密码。</view>
        <view class="legal-item"><text>昵称和头像：</text>当你主动设置个人资料时，我们收集你填写的昵称和选择的头像，仅用于账号展示和区分族谱参与者。头像选择前会请求你的明确授权。</view>
        <view class="legal-item"><text>族谱及成员资料：</text>当你创建或编辑族谱时，我们处理你主动填写的族谱名称、姓氏、地区、家训家规，以及成员姓名、性别、出生信息、在世状态、关系、头像、简介、民族、血型、现居地、学校、学历、单位和职位等信息，用于生成、展示、检索和共同编辑族谱。除必填字段外，其余均可不填写。</view>
        <view class="legal-item"><text>反馈与联系方式：</text>当你提交意见反馈时，我们收集反馈类型和内容。微信号或手机号属于选填信息，仅在你主动填写并勾选同意后收集，唯一用途是就该反馈与你联系和回复，不用于营销推广。</view>
        <view class="legal-item"><text>运行与安全信息：</text>为保障服务稳定和账号安全，微信、uniCloud 及云服务基础设施可能处理必要的网络请求、错误日志和设备运行信息。我们已关闭非必要的 uni 统计采集。</view>
      </view>

      <view class="legal-section">
        <view class="legal-heading">二、存储、共享与公开</view>
        <view class="legal-item">未登录时的示例和临时数据主要保存在本机。登录后，你创建、编辑或通过分享加入的族谱将保存到中国境内的 uniCloud 云服务，以支持跨设备同步。</view>
        <view class="legal-item">我们仅在实现小程序运行所必需的范围内委托微信、DCloud/uniCloud 及其云基础设施提供身份认证、数据存储和网络服务，并要求其采取相应安全措施。</view>
        <view class="legal-item">我们不会出售个人信息。族谱只有创建者和经分享授权的查看者或编辑者可以访问；编辑者可共同查看和修改同一份族谱。请谨慎选择分享对象和权限。</view>
      </view>

      <view class="legal-section">
        <view class="legal-heading">三、他人信息与未成年人</view>
        <view class="legal-item">当你录入在世亲属的资料时，应事先向本人说明本政策并取得合法、充分的同意；不得录入与族谱无关或来源不合法的信息。若涉及未成年人，应由其监护人同意并代为操作。</view>
      </view>

      <view class="legal-section">
        <view class="legal-heading">四、保存期限与安全</view>
        <view class="legal-item">我们只在实现上述目的所需的最短期限内保存信息。你删除族谱或成员后，相关数据将从业务数据中删除；法律法规另有保存要求的除外。我们通过访问权限、身份校验和传输保护等措施降低未授权访问、泄露或篡改风险。</view>
      </view>

      <view class="legal-section">
        <view class="legal-heading">五、你的权利</view>
        <view class="legal-item">你可以在小程序内查看、更正或删除有权限管理的族谱和成员资料，修改昵称头像，撤销可选信息的提供，或退出登录。需要查询、复制、更正、删除账号信息或注销账号时，可通过“我的－意见反馈”提交申请，我们将在核验身份后处理。</view>
      </view>

      <view class="legal-section">
        <view class="legal-heading">六、政策更新与联系我们</view>
        <view class="legal-item">如本政策发生重大变化，我们会通过页面提示等方式再次告知。对本政策、个人信息处理或权利请求有疑问，可通过“我的－意见反馈”联系赛博宗族小程序开发者。</view>
      </view>

      <button class="legal-weixin-button" type="button" @click="openWeixinPrivacyContract">查看微信隐私保护指引</button>
    </view>
  </AppShell>
</template>
