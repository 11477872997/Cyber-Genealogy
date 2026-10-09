# 支付宝云后端

本目录是项目的业务云端资源：

- `cloudfunctions/family-co`：族谱、权限、收藏、分享、资料和反馈接口。
- `database/genealogy-families`：族谱元数据、成员和留言的小规模聚合文档。
- `database/genealogy-permissions`：共享用户的 `viewer` / `editor` 权限。
- `database/genealogy-shares`：30 天分享令牌摘要。
- `database/genealogy-favorites`：每个用户独立收藏。
- `database/genealogy-feedback`：用户反馈和管理员处理状态。

所有 Schema 均关闭客户端直接读写。`family-co` 使用 `uni-id-common` 校验 `uni_id_token`，不能用前端传入的用户 ID 或权限字段代替服务端鉴权。

身份配置位于：

`../uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`

部署前必须替换微信小程序 AppSecret 占位值，再上传 `uni-config-center` 公共模块。
