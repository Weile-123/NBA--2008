# 前端请求与发布包说明

## 上传包

发布时只上传 `dist/`。该目录是纯静态前端资源，不包含 Node.js 服务端文件；本地开发和自托管静态服务的构建文件输出至 `server-dist/`。

`vendor-react` 仅由 Vite 从 `react` 与 `react-dom`（项目锁定版本 19.0.1）生成；`vite.config.ts` 的分包规则只会将 `node_modules` 中的 React 相关模块放入该文件，项目的 `src/` 业务组件均在 `index-*.js` 中。发布包包含对应 source map，可用于核验其来源；该包不含业务网络调用或设备能力调用。

## 请求调用链与白名单

业务代码不使用 `fetch`、`XMLHttpRequest` 或 `axios`。

| 用途 | SDK 调用 | 接口 |
| --- | --- | --- |
| 全网传奇榜读取 | `window.ColorboxAI.cloud.request` | `GET https://app-0f7b7f394c-d8gy4o4bpcde2aff7-1252166086.ap-shanghai.app.tcloudbase.com/api/leaderboard` |
| 传奇榜上传 | `window.ColorboxAI.cloud.request` | `POST https://app-0f7b7f394c-d8gy4o4bpcde2aff7-1252166086.ap-shanghai.app.tcloudbase.com/api/leaderboard/submit` |
| 退役海报发帖 | `window.ColorboxAI.request.bbs.openPostEditor` | 虎扑原生发帖 SDK 能力 |
| 海报上传 | `window.ColorboxAI.oss.uploadFile` | 虎扑 OSS 原生 SDK 能力 |

CloudBase 排行榜接口按技能要求使用 `cloud.request`，公开读取不携带身份信息；上传使用 `auth: true` 与活动环境 ID 由 SDK 获取授权。常规发帖使用 `request.bbs` 能力。
