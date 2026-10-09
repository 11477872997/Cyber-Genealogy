# 我的掌上族谱

uni-app Vue 3 微信小程序，使用支付宝云版 uniCloud。项目包含微信一键登录、按账号隔离的族谱、查看/编辑分享权限、收藏、反馈、管理员入口和 Vue3 家族树。

## 当前云端

- 服务空间：`env-00jy6ttlqlla`（支付宝云，空间名 `zp`）
- 身份云对象：`uni-id-co`
- 业务云对象：`family-co`
- 数据表：`uni-id-*`、`genealogy-families`、`genealogy-permissions`、`genealogy-shares`、`genealogy-favorites`、`genealogy-feedback`
- 数据表禁止客户端直接读写，族谱访问统一由 `family-co` 校验所有者、编辑者、查看者权限。

## 首次配置

微信 AppID 已配置为 `wx62949071579e18e7`。微信 AppSecret 不允许写入前端，也不应发送给其他人。发布前在下面文件中替换占位值：

`uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`

```json
"appsecret": "REPLACE_WITH_WECHAT_MINIPROGRAM_APP_SECRET"
```

保存后，在 HBuilderX 中上传 `uni-config-center` 公共模块；也可以执行：

```powershell
D:\HBuilderX\cli.exe cloud functions --upload common --prj sbzp --provider alipay --unimod uni-config-center --name uni-config-center
```

然后重新运行到微信开发者工具，进入“我的”点击“微信登录”。首次登录会把本机创建的非示例族谱迁移到当前微信账号，之后不同账号的数据彼此隔离。

## 管理员初始化

先完成一次微信登录，在支付宝云数据库的 `uni-id-users` 表找到自己的用户记录，把 `role` 设置为 `["admin"]`，然后退出并重新登录。此后在“我的”页面连续点击版本号三次，可以进入云端反馈管理；普通用户无法调用管理员接口。

## 分享规则

- 所有者：可查看、编辑、删除、创建查看/编辑分享。
- 编辑者：可查看和编辑同一份云端族谱，不能删除或继续授权。
- 查看者：只能查看和收藏。
- 分享令牌有效期 30 天，数据库只存令牌 SHA-256 摘要，不存明文令牌。

## 头像说明

微信头像在客户端压缩为 JPEG 后再转 Base64，单张限制约 180 KB，并保存到 `uni-id-users.avatar`。压缩会减小图片；Base64 本身通常会增加约三分之一体积。用户量或图片量增长后，应改为云存储文件 URL，而不是继续把图片放在数据库字段中。

## 开发验证

```bash
npm install
npm test
npm run build:mp-weixin
npm run build:h5
```

微信构建产物在 `dist/build/mp-weixin`。主要业务代码位于 `services/cloudService.js`、`services/cloudSession.js`、`services/genealogyStore.js` 和 `uniCloud-alipay/cloudfunctions/family-co/index.obj.js`。
