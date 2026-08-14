# 情绪星星瓶可安装 PWA 设计规格

## 目标

将当前 GitHub Pages 网站升级为可从手机浏览器安装到主屏幕的 Progressive Web App（PWA）。安装后应用以独立窗口运行，并能在短暂断网时启动和使用已缓存的界面。

本阶段不生成 Android APK，不提交应用商店，不增加账号、云端数据库或跨设备同步。

## 用户体验

### 安卓

用户打开独立安装引导页 `install.html`。在支持 `beforeinstallprompt` 的 Chrome、Edge 或兼容浏览器中，页面显示“安装到手机”按钮。点击后调用浏览器提供的可信安装窗口。

如果浏览器未提供可编程安装事件，页面显示浏览器菜单安装说明，不伪造安装成功状态。

### iPhone 和 iPad

Safari 不提供与 Chromium 相同的安装事件。安装引导页显示简短步骤：点击分享按钮，选择“添加到主屏幕”，确认名称并添加。

引导页通过说明文字明确提示：iOS 主屏幕 Web App 可能使用与 Safari 页面不同的本地存储空间，Safari 中已有记录不保证自动迁移。

### 已安装状态

当页面运行在 `display-mode: standalone` 或 `navigator.standalone` 环境时，安装引导页显示“已经安装”，隐藏安装按钮和重复说明，并提供“打开情绪星星瓶”按钮。

## 页面与导航

- 保持现有 `index.html` 主界面结构和视觉体验，不在主操作流程中增加持续显示的安装横幅。
- 新建 `install.html`，作为独立安装渠道。
- 主页面仅增加 Manifest、Apple 图标与 PWA 元数据，以及 Service Worker 注册脚本。
- 发布完成后向用户提供两个地址：正常使用地址和安装引导地址。

## Web App Manifest

新增根目录 `manifest.webmanifest`，包含：

- `id`: `./`
- `name`: `我的情绪星星瓶`
- `short_name`: `星星瓶`
- `description`: `把每一种情绪折成星星，慢慢认识自己。`
- `lang`: `zh-CN`
- `start_url`: `./index.html`
- `scope`: `./`
- `display`: `standalone`
- `background_color`: `#08102d`
- `theme_color`: `#08102d`
- `orientation`: `any`
- `prefer_related_applications`: `false`
- 192×192 和 512×512 PNG 图标，均提供 `any maskable` 用途。

复用并验证现有 `assets/icon-192.png` 与 `assets/icon-512.png`。若尺寸、透明边距或图像质量不符合要求，再从现有猫咪星星瓶素材生成替代图标。

## Service Worker

新增根目录 `sw.js`，作用域覆盖整个应用目录。

### 预缓存

安装阶段预缓存完整应用外壳：

- `./`
- `./index.html`
- `./install.html`
- `./manifest.webmanifest`
- `./styles.css`
- 当前全部运行时 JavaScript 模块
- 当前页面和安装页使用的图片与应用图标

缓存清单必须来自当前生产依赖，不能复用旧版本中已经失效的 `hello-kitty.png` 单文件清单。

### 请求策略

- 页面导航：网络优先。网络成功时返回最新页面；网络失败时回退到缓存的 `index.html` 或对应缓存页面。
- 同源静态资源：缓存优先，同时后台更新缓存。
- 非 GET、跨域请求和浏览器扩展请求不由 Service Worker 接管。
- 仅缓存成功的同源响应，不缓存错误响应。

### 生命周期与更新

- 缓存名称包含明确版本号。
- 安装成功后使用 `skipWaiting()`。
- 激活阶段删除所有旧的本应用缓存，并调用 `clients.claim()`。
- Service Worker 注册使用相对根路径，并设置 `updateViaCache: 'none'`，降低脚本被旧 HTTP 缓存阻挡的风险。
- 新版本在下一次加载或导航时接管；本阶段不增加强制刷新弹窗。

## 安装引导页

`install.html` 使用现有夜空、星星瓶、猫咪和圆角卡片视觉语言，但保持轻量：

- 应用图标、名称和一句产品说明。
- 安卓/Chromium 安装按钮。
- iPhone/iPad 三步安装说明。
- 已安装状态提示。
- 返回或打开主应用的按钮。
- 离线与本地数据说明。

安装逻辑放在独立 `js/install.js` 中，负责：

- 捕获并保存一次 `beforeinstallprompt` 事件。
- 只有存在有效事件时才启用安装按钮。
- 调用 `prompt()` 后读取用户选择结果。
- 监听 `appinstalled` 并更新页面状态。
- 识别 iOS、standalone 和不支持可编程安装的浏览器。
- 不记录或上传设备信息。

## 本地数据与离线边界

- 星星记录继续使用 `emotion-star-jar:v1` localStorage 键。
- Service Worker 只缓存程序文件，不读取、复制或上传星星内容。
- 同一安装实例在离线状态下可以使用已经缓存的界面和本地记录。
- 不承诺跨浏览器、跨设备或 Safari 与 iOS 主屏幕 Web App 之间自动同步。
- 清理浏览器或应用站点数据仍可能删除记录，安装页面需对此给出简短提示。

## 错误处理

- Service Worker 注册失败不阻止主应用运行；在控制台记录可诊断错误，不显示虚假安装提示。
- 预缓存任一必需资源失败时，本次 Service Worker 安装失败，保留上一可用版本。
- 安装提示被用户取消时恢复按钮状态，并显示“可稍后再安装”。
- 当前浏览器不支持可编程安装时，展示手动操作说明。
- 离线且目标资源未缓存时返回明确的离线回退页面或已缓存主页面，不返回空白响应。

## 安全与隐私

- PWA 继续通过 GitHub Pages HTTPS 提供。
- Service Worker 只处理当前 GitHub Pages 应用作用域内的同源请求。
- 不添加第三方分析、推送通知、后台同步或设备权限。
- 不把用户星星记录写入 Cache Storage。

## 验证与验收

### 静态与自动测试

- Manifest JSON 可解析且包含全部必需字段。
- 192 和 512 图标的实际像素尺寸正确。
- `index.html` 与 `install.html` 均正确链接 Manifest。
- Service Worker 预缓存清单中的每个本地资源真实存在。
- Service Worker 脚本语法通过。
- 安装页状态逻辑覆盖：可安装、取消、已安装、iOS 手动引导和不支持五种情况。
- 保持现有 24 项应用测试全部通过。

### 浏览器验证

- GitHub Pages 上 Manifest、Service Worker 和图标均返回 HTTP 200。
- Chromium DevTools 能解析 Manifest，Service Worker 激活并控制页面。
- 安卓/Chromium 安装按钮能够触发浏览器安装窗口。
- 安装后从桌面图标以 standalone 模式打开主应用。
- 在线加载一次后，切换离线仍能打开主页面和安装页。
- 发布新缓存版本后旧缓存被清理，恢复联网后能获取新版文件。
- iPhone/iPad 的最终“添加到主屏幕”操作需在真实 Safari 设备上人工确认；没有实机证据时不得声称已验证。

## 发布与本地包

- 继续发布到 `Ray-Jiang747/emotion-star-jar` 的 `codex/desktop-multi-view` Pages 分支。
- 发布后更新桌面独立本地发布包，加入 Manifest、Service Worker、安装页、安装脚本与图标。
- 本地双击 `index.html` 不支持 Service Worker；本地验证必须通过 HTTP 服务器运行。

## 不在本阶段范围内

- Android APK、WebAPK 文件下载或应用商店提交。
- Apple App Store、Google Play、华为应用市场发布。
- 推送通知、后台同步、相机、定位或通讯录权限。
- 账号登录、云端备份和跨设备同步。
- 从 Safari 自动迁移记录到 iOS 主屏幕 Web App。
