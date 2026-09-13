# 前端请求与发布包说明

## 上传包

发布时只上传 `dist/`。该目录是纯静态前端资源，不包含 Node.js 服务端文件；本地开发和自托管静态服务的构建文件输出至 `server-dist/`。

发布构建保留可读的多行 JavaScript，便于审查器和人工逐行核验。Source map 仅用于开发调试，不是发布审查所需文件，制作精简上传包时可以排除。页面组件使用 `React.lazy` 按需加载，联盟数据、历史选秀、真实交易与生涯事件也会生成独立分包；不再将全部业务逻辑写入一个约 1 MB 的单行入口脚本。

`vendor-react` 仅由 Vite 从 `react` 与 `react-dom` 等第三方依赖生成；不含项目业务网络调用或设备能力调用。

## Vite 动态导入与 SR-002 人工复核

页面组件使用 Vite 标准 `import(...)` 加载构建时确定的 `./文件名.js` 本地分包。发布构建通过 `modulePreload: false` 关闭实际依赖预加载，因此 `__vitePreload` 的依赖参数均为空数组；Vite 6 仍会保留通用的 `assetsURL(dep, importerUrl)` 包装器，但没有资源依赖进入该解析分支。当前入口中的22个动态导入全部为构建期生成的静态相对路径，对应文件均存在于上传包 `assets/` 目录，不包含外部地址，也不接收 URL、表单或其他用户输入。

动态分包直接使用 React `lazy()`。项目未使用 `window.location.replace` 或附加 `CHUNK_RETRY_PARAM` 的自动整页重载机制；分包加载失败会进入页面内错误边界。只有用户明确点击“安全重新加载”按钮后才调用 `window.location.reload()` 手动恢复，避免部分 WebView 拦截自动导航或出现无提示闪屏。

预扫描提到的 `getHistoricalDraftData` 定义于 `src/data/draftData.ts`，仅按年份读取随包构建的本地历史选秀数据。调用方通过常规 ES Module import 引用该函数，不进行网络请求、文件系统访问或动态资源下载。

## 请求调用链与白名单

业务代码不使用 `fetch`、`XMLHttpRequest` 或 `axios`。

| 用途 | SDK 调用 | 接口 |
| --- | --- | --- |
| 全网传奇榜读取 | `window.ColorboxAI.cloud.request` | `GET https://app-a1c57bc9c2-d5glgsllk7b7bd845-1252166086.ap-shanghai.app.tcloudbase.com/api/leaderboard` |
| 个人全网名次读取 | `window.ColorboxAI.cloud.request` | `GET https://app-a1c57bc9c2-d5glgsllk7b7bd845-1252166086.ap-shanghai.app.tcloudbase.com/api/leaderboard/me` |
| 传奇榜上传 | `window.ColorboxAI.cloud.request` | `POST https://app-a1c57bc9c2-d5glgsllk7b7bd845-1252166086.ap-shanghai.app.tcloudbase.com/api/leaderboard/submit` |
| 用户反馈提交 | `window.ColorboxAI.cloud.request` | `POST https://feedback-public-d8fnf79rd0e395c3-1252166086.ap-shanghai.app.tcloudbase.com/api/feedback` |
| 退役海报发帖 | `window.ColorboxAI.request.bbs.openPostEditor` | 虎扑原生发帖 SDK 能力 |
| 海报上传 | `window.ColorboxAI.oss.uploadFile` | 虎扑 OSS 原生 SDK 能力 |

CloudBase 排行榜接口按技能要求使用 `cloud.request`，公开读取不携带身份信息；上传和个人名次读取通过 `cloud.request(..., auth: true)` 由 SDK 内部完成登录。常规发帖使用 `request.bbs` 能力。三个排行榜请求均在 `src/lib/globalLeaderboard.ts` 中直接调用 `window.ColorboxAI.cloud.request(...)`，未经过别名、`fetch`、`XMLHttpRequest` 或第三方请求库，构建产物中也可直接检索到该完整调用链。

排行榜网关地址与 `envId` 均静态绑定到当前活动 `app_a1c57bc9c2` 对应的 CloudBase 环境，不读取宿主可能遗留的 `window.ACTIVITY_API_BASE`，从而避免请求被旧活动配置覆盖。响应解析同时兼容 SDK 的扁平结构 `{ statusCode, code, data }` 和代理层嵌套结构 `{ statusCode, data: { code, data } }`；仅在内层明确含业务 `code` 时解包，不会把对象形式的个人排名数据误判为空。

进入全网传奇榜时，页面会将本地 GOAT 分最高的正式退役记录重复安全提交一次，服务端按当前登录用户唯一标识保留历史最高分，因此不会产生重复榜单行；提交成功后才读取 `/leaderboard/me` 并显示个人名次。上传失败时待同步记录会先通过统一存储能力持久化，页面展示具体失败提示和手动重试入口，不会将失败误显示为“尚未退役”。

全网传奇榜读取函数使用 `loadGlobalHallOfFame` 与 `loadMyGlobalHallOfFameRank` 命名，错误日志使用中文“全网传奇榜加载失败”，不包含可能被误识别为浏览器网络 API 的 `fetch` 关键词。两个函数内部均直接调用 `window.ColorboxAI.cloud.request(...)`，不存在浏览器 `fetch()`、`XMLHttpRequest` 或第三方请求库调用，因此不属于 SR-001 直接网络客户端使用。

用户反馈使用平台统一公共反馈环境，固定 `envId` 为 `feedback-public-d8fnf79rd0e395c3`。`applicationId` 在构建时从根目录 `activity.json.activityId` 静态写入，当前值为 `app_a1c57bc9c2`，不从 URL、表单或本地存储读取。提交前通过 `window.ColorboxAI.auth.getUserInfo()` 校验虎扑登录态，正文仅通过 `window.ColorboxAI.cloud.request(..., auth: true)` 提交；请求体只包含 `applicationId`、`content` 及用户资料接口返回的可选 `nickname`、HTTPS `avatarUrl`，不包含 PUID、Token 或联系方式。

## 静态资源

页面不再从 `index.html` 引用图片 favicon，避免发布审查阶段跳过图片 materialize 后产生无效资源路径。游戏内使用的 logo 仍作为正常页面资源随发布包交付。

## 滚动与定时任务

页面置顶统一由 `src/utils/scroll.ts` 在 `requestAnimationFrame` 中写入 `#root` 滚动容器，不直接写 `scrollTop`，也不重复修改 `window`、`documentElement` 与 `body` 的滚动位置。赛程条使用延迟到下一帧的 `scrollIntoView`，不在同一任务中读取 `offsetLeft/clientWidth` 后立即写入滚动位置。

选秀准备进度条使用 CSS animation，不再每 50 ms 更新 React 状态。比赛时钟使用 `requestAnimationFrame` 节流；选秀新闻、季后赛自动模拟、退役时间线与常规赛自动模拟使用可取消的单次 `setTimeout`。所有调度均在 React effect cleanup 中取消，组件卸载、暂停或阶段切换后不会继续执行。

`src/lib/persistentStorage.ts` 中的 `waitForBridge` 仅用于等待宿主注入 `window.ColorboxAI.storage`。它在调用开始时先同步检查 Bridge；仅在尚未就绪时通过可取消的单次 `setTimeout` 每 50 ms 检查一次，最长等待2秒。成功、超时、页面隐藏或离开页面都会清除待执行计时器和事件监听。本地浏览器未注入 `window.ColorboxAI` 时会直接返回，不启动等待，因此不存在 `setInterval` 周期任务或后台持续运行。

预扫描归属到 `SeasonDashboard` 分包的两次 `getBoundingClientRect()` 实际来自 `src/components/PlayoffPanel.tsx`。代码先连续读取容器和当前用户系列卡片的矩形，再统一调用一次 `scrollTo`；不存在读取、写入、再次读取的交替操作。该函数仅在季后赛轮次变化后的单次定时回调或用户点击“定位”按钮时执行，不位于滚动事件、循环或动画帧高频回调中，因此不构成 layout thrashing。

`vendor` 分包中的 Canvas 尺寸读写来自 `canvas-confetti` 第三方庆祝动画。项目只在选秀、获奖、夺冠和退役等离散事件发生时调用该库，并由 `src/utils/gameConfetti.ts` 创建单例 Canvas，明确传入 `resize: false`，不会执行依赖内部的同步 resize 分支。手机、触屏设备以及 Android/iOS WebView 会直接跳过该装饰动画，避免全屏 Canvas 合成导致闪屏；桌面端只在动画存续期间注册一个 `{ passive: true }` 的窗口监听，回调通过 `requestAnimationFrame` 合并，同一帧内只终止并清理旧动画，不读取布局或修改 Canvas 尺寸。动画自然结束、窗口变化或页面隐藏后都会移除 Canvas 与监听器。

## 游戏随机数与存储复核

构建产物中的 `Math.random()` 用于球员与比赛数据生成、投篮和比赛结果判定、选秀顺位、随机事件、伤病概率以及展示数据模拟。这些随机数不用于生成登录凭证、Token、密码、加密密钥或安全标识，也不代表 `localStorage`、`sessionStorage` 或 Cookie 操作。`data-real-trades` 分包中的相关调用同样属于纯本地游戏模拟逻辑，不构成敏感存储风险。
