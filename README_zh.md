# React Quick Starter

一个现代化的全栈启动模板，结合了用于 Web 应用的 **Next.js 16** 和 **React 19**，以及用于跨平台桌面应用的 **Electron** + **electron-builder**。使用 TypeScript、Tailwind CSS v4 和 shadcn/ui 组件构建。

[English Documentation](./README.md)

## 特性

- ⚡️ **Next.js 16** 配合 App Router 和 React 19
- 🖥️ **Electron** 用于原生桌面应用（Windows、macOS、Linux），通过 electron-builder 打包
- 🎨 **Tailwind CSS v4** 支持 CSS 变量和暗色模式
- 🧩 **shadcn/ui** 组件库，基于 Radix UI 原语
- 📦 **Zustand** 轻量级状态管理
- 🔤 **Geist 字体** 通过 next/font 优化
- 🎯 **TypeScript** 提供类型安全
- 🎭 **Lucide Icons** 精美的图标库
- 📚 **Fumadocs** 文档站点，作为 pnpm workspace 子包
- 📱 双重部署：从同一代码库部署 Web 应用或桌面应用

## 前置要求

在开始之前，请确保已安装以下内容：

### Web 开发所需

- **Node.js** 20.x 或更高版本（[下载](https://nodejs.org/)）
- **pnpm** 8.x 或更高版本（推荐）或 npm/yarn

  ```bash
  npm install -g pnpm
  ```

### 桌面开发所需

无需额外的原生工具链。`pnpm install` 会自动下载与平台匹配的 Electron 二进制（Electron 已加入 `pnpm.onlyBuiltDependencies` 白名单，允许其 postinstall 脚本运行）。electron-builder 在 Windows / Linux 上无需 Rust、Python 或 Visual Studio Build Tools。macOS 代码签名与公证为可选项。

## 安装

1. **克隆仓库**

   ```bash
   git clone <your-repo-url>
   cd react-quick-starter
   ```

2. **安装依赖**

   ```bash
   pnpm install
   # 或
   npm install
   # 或
   yarn install
   ```

3. **验证安装**

   ```bash
   # 检查 Next.js 是否就绪（Web 模式）
   pnpm dev

   # 编译 Electron 主进程（健康检查）
   pnpm electron:compile
   ```

## 开发

### Web 应用开发

#### 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

这将在 [http://localhost:3000](http://localhost:3000) 启动 Next.js 开发服务器。当您编辑文件时，页面会自动重新加载。

#### 关键开发文件

- `app/page.tsx` - 主着陆页
- `app/layout.tsx` - 根布局及全局配置
- `app/globals.css` - 全局样式和 Tailwind 配置
- `components/ui/` - 可复用的 UI 组件（shadcn/ui）
- `lib/utils.ts` - 工具函数

### 桌面应用开发

#### 启动 Electron 开发模式

```bash
pnpm electron:dev
```

此命令通过 `concurrently` 同时：

1. 启动 Next.js 开发服务器（`http://localhost:3000`）
2. 用 `wait-on` 等待服务器就绪后，通过 `tsc` 编译 Electron 主进程
3. 设置 `ELECTRON_START_URL=http://localhost:3000` 启动 Electron
4. 启用 Next.js 渲染端的热重载（修改 `electron/` 中的文件后需重新执行 `pnpm electron:compile`）

#### Electron 开发文件

- `electron/main.ts` - 主进程：`BrowserWindow`、应用生命周期、CSP（通过 `session.webRequest.onHeadersReceived`）、IPC 处理器
- `electron/preload.ts` - 通过 `contextBridge.exposeInMainWorld('electronAPI', {...})` 向渲染进程暴露类型化接口
- `electron/ipc/<name>.ts` - 纯函数 IPC 处理器（可独立单元测试）
- `electron/tsconfig.json` - 主进程 TS 编译配置（CommonJS，输出到 `dist-electron/`）
- `electron/icons/` - 构建图标（`icon.ico`、`icon.icns`、`icon.png`）
- `package.json` 的 `build` 字段 - electron-builder 配置

### 从渲染端调用主进程

该模板内置了一个类型安全的 IPC 桥接示例（`greet`）。新增 IPC 命令的模式如下：

1. **在 `electron/ipc/my-command.ts` 中编写纯函数**：

   ```ts
   export function myCommand(arg: string): string {
     if (!arg.trim()) throw new Error("arg cannot be empty")
     return `got ${arg}`
   }
   ```

2. **在 `electron/main.ts` 的 `registerIpc()` 中注册**：

   ```ts
   import { myCommand } from "./ipc/my-command"

   ipcMain.handle("my-command", (_event, arg: unknown) => {
     if (typeof arg !== "string") throw new Error("arg must be a string")
     return myCommand(arg)
   })
   ```

3. **在 `electron/preload.ts` 中暴露**：

   ```ts
   const electronAPI = {
     greet: (name: string) => ipcRenderer.invoke("greet", name),
     myCommand: (arg: string) => ipcRenderer.invoke("my-command", arg),
   } as const
   ```

4. **在 `types/electron.d.ts` 中扩展类型**：

   ```ts
   declare global {
     interface Window {
       electronAPI?: {
         greet: (name: string) => Promise<string>
         myCommand: (arg: string) => Promise<string>
       }
     }
   }
   ```

5. **在 `lib/electron.ts` 中加入类型化封装**：

   ```ts
   export async function myCommand(arg: string): Promise<string> {
     if (!window.electronAPI) {
       throw new Error("myCommand() invoked while not running in Electron")
     }
     return window.electronAPI.myCommand(arg)
   }
   ```

`lib/electron.ts` 是唯一调用 `window.electronAPI` 的地方——业务代码从中导入具名函数。使用 `isElectron()` 来保护依赖桌面运行时的代码路径。

## 可用脚本

### 前端脚本

| 命令                 | 描述                                              |
| -------------------- | ------------------------------------------------- |
| `pnpm dev`           | 在端口 3000 启动 Next.js 开发服务器               |
| `pnpm build`         | 构建 Next.js 应用用于生产（输出到 `out/` 目录）   |
| `pnpm start`         | 启动 Next.js 生产服务器（执行 `pnpm build` 之后） |
| `pnpm lint`          | 运行 ESLint 检查代码质量                          |
| `pnpm lint:fix`      | 自动修复 ESLint 问题                              |
| `pnpm format`        | 用 Prettier 格式化所有文件                        |
| `pnpm format:check`  | 检查格式而不写入                                  |
| `pnpm typecheck`     | 运行 TypeScript 类型检查（不生成产物）            |
| `pnpm test`          | 运行 Jest 单元测试                                |
| `pnpm test:watch`    | 监听模式运行 Jest                                 |
| `pnpm test:coverage` | 运行 Jest 并生成覆盖率报告                        |

### Electron（桌面）脚本

| 命令                          | 描述                                       |
| ----------------------------- | ------------------------------------------ |
| `pnpm electron:dev`           | 同时启动 Next.js 与 Electron，支持热重载   |
| `pnpm electron:compile`       | 编译主进程 + preload TS → `dist-electron/` |
| `pnpm electron:compile:watch` | 主进程编译的 watch 模式                    |
| `pnpm electron:build`         | 为当前平台构建生产安装包                   |
| `pnpm electron:build:win`     | 构建 Windows 安装包（NSIS + MSI）          |
| `pnpm electron:build:mac`     | 构建 macOS 包（DMG + ZIP，x64 + arm64）    |
| `pnpm electron:build:linux`   | 构建 Linux 包（AppImage + deb）            |

### 文档站点脚本（Fumadocs — 端口 3001）

| 命令              | 描述                                     |
| ----------------- | ---------------------------------------- |
| `pnpm docs:dev`   | 在端口 3001 启动 Fumadocs 开发服务器     |
| `pnpm docs:build` | 构建文档生产版本（输出到 `docs/.next/`） |
| `pnpm docs:start` | 在端口 3001 启动文档生产服务器           |

### 添加 UI 组件（shadcn/ui）

```bash
# 添加新组件（例如 Card）
pnpm dlx shadcn@latest add card

# 添加多个组件
pnpm dlx shadcn@latest add button card dialog
```

## 项目结构

```
react-quick-starter/
├── app/                      # Next.js App Router（主应用）
│   ├── layout.tsx           # 根布局，包含字体和元数据
│   ├── page.tsx             # 主着陆页
│   ├── globals.css          # 全局样式和 Tailwind 配置
│   └── favicon.ico          # 应用图标
├── components/              # React 组件
│   └── ui/                  # shadcn/ui 组件（Button 等）
├── lib/                     # 工具函数
│   └── utils.ts            # 辅助函数（cn 等）
├── public/                  # 静态资源（图片、SVG）
├── electron/               # Electron 桌面应用
│   ├── main.ts             # 主进程入口（BrowserWindow、CSP、IPC）
│   ├── preload.ts          # 通过 contextBridge 向渲染端暴露类型化 API
│   ├── ipc/                # 纯函数 IPC 处理器（可独立单测）
│   │   └── greet.ts
│   ├── icons/              # 应用图标（ico、icns、png）供 electron-builder 使用
│   └── tsconfig.json       # CommonJS 编译配置（输出到 dist-electron/）
├── types/
│   └── electron.d.ts       # 渲染端 `Window.electronAPI` 类型增强
├── dist-electron/          # 编译后的主进程 + preload（gitignored）
├── release/                # electron-builder 输出目录：安装包（gitignored）
├── docs/                    # Fumadocs 文档站点（workspace 子包）
│   ├── app/                # Next.js App Router（文档）
│   │   ├── layout.tsx      # 根布局，含 RootProvider
│   │   ├── page.tsx        # 重定向到 /docs
│   │   ├── global.css      # Tailwind v4 + Fumadocs 主题
│   │   ├── docs/           # 文档路由
│   │   │   ├── layout.tsx  # 含侧边栏的 DocsLayout
│   │   │   └── [[...slug]]/ # 动态 MDX 页面
│   │   └── api/search/     # Orama 搜索 API 路由
│   ├── lib/source.ts       # Fumadocs 内容加载器
│   ├── content/docs/       # MDX 内容文件
│   ├── source.config.ts    # 内容集合配置
│   ├── next.config.ts      # Next.js 配置（无静态导出）
│   └── package.json        # 文档包依赖
├── pnpm-workspace.yaml      # pnpm monorepo 配置
├── components.json          # shadcn/ui 配置
├── next.config.ts          # Next.js 配置（主应用）
├── tsconfig.json           # TypeScript 配置
├── eslint.config.mjs       # ESLint 配置
└── package.json            # 根依赖和脚本
```

## 配置

### 环境变量

将 `.env.example` 复制为 `.env.local` 开始使用：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local` 填入实际值。`lib/env.ts` 模块会在首次访问时校验必需变量。

**重要提示**：

- 只有以 `NEXT_PUBLIC_` 为前缀的变量会暴露给浏览器
- 切勿将 `.env.local` 提交到版本控制
- 使用 `.env.example` 记录所需的变量

### Electron 配置

桌面应用配置分散在两处：

**窗口/生命周期/IPC** — `electron/main.ts`（`createWindow()`）：

```ts
const win = new BrowserWindow({
  width: 800,
  height: 600,
  title: "react-quick-starter",
  resizable: true,
  fullscreen: false,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
})
```

**打包** — `package.json` 中的 `build` 字段（electron-builder）：

```jsonc
{
  "build": {
    "appId": "com.reactquickstarter.desktop",
    "productName": "react-quick-starter",
    "asar": true,
    "directories": { "output": "release", "buildResources": "electron/icons" },
    "files": ["dist-electron/**/*", "out/**/*", "package.json"],
    "win": {
      "target": [{ "target": "nsis" }, { "target": "msi" }],
      "icon": "electron/icons/icon.ico",
    },
    "mac": {
      "target": [
        { "target": "dmg", "arch": ["x64", "arm64"] },
        { "target": "zip", "arch": ["x64", "arm64"] },
      ],
      "icon": "electron/icons/icon.icns",
    },
    "linux": {
      "target": [{ "target": "AppImage" }, { "target": "deb" }],
      "icon": "electron/icons/icon.png",
    },
  },
}
```

### 路径别名

在 `components.json` 和 `tsconfig.json` 中配置：

```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

可用别名：

- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/ui` → `components/ui/`
- `@/hooks` → `hooks/`
- `@/utils` → `lib/utils.ts`

### Tailwind CSS 配置

项目使用 Tailwind CSS v4，具有以下特性：

- 使用 CSS 变量进行主题化（在 `app/globals.css` 中定义）
- 通过 `class` 策略支持暗色模式
- 使用 CSS 变量的自定义调色板
- shadcn/ui 样式系统

## 生产构建

### 构建 Web 应用

```bash
# 构建静态导出
pnpm build

# 输出目录：out/
# 将 out/ 目录部署到任何静态托管服务
```

构建会在 `out/` 目录中创建一个静态导出，已针对生产环境进行优化。

### 构建桌面应用

```bash
# 为当前平台构建（Windows: NSIS+MSI；macOS: DMG+ZIP；Linux: AppImage+deb）
pnpm electron:build

# 输出目录：release/
```

平台快捷指令：

```bash
pnpm electron:build:win    # Windows: NSIS + MSI
pnpm electron:build:mac    # macOS:   DMG + ZIP（x64 + arm64）
pnpm electron:build:linux  # Linux:   AppImage + deb
```

直接调用 electron-builder（高级标志，例如 `--publish=always`）：

```bash
pnpm build && pnpm electron:compile && pnpm exec electron-builder --win --x64 --publish=never
```

## 部署

### 文档站点部署

文档站点（`docs/`）是一个完整的 Next.js 服务端应用，与主应用独立部署。

```bash
# 构建文档
pnpm docs:build

# 输出：docs/.next/
# 部署到任意 Node.js 托管平台：Vercel、Netlify、Railway 等
```

在 **Vercel** 上，导入项目时将根目录设置为 `docs/`。

### Web 部署

#### Vercel（推荐）

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 [Vercel](https://vercel.com/new) 上导入项目
3. Vercel 会自动检测 Next.js 并部署

#### Netlify

```bash
# 构建命令
pnpm build

# 发布目录
out
```

#### 静态托管（Nginx、Apache 等）

1. 构建项目：`pnpm build`
2. 将 `out/` 目录上传到您的服务器
3. 配置服务器以提供静态文件

### 桌面部署

#### Windows

- 分发 `release/` 中的 `.exe`（NSIS，推荐）或 `.msi`
- NSIS 已配置为 `oneClick: false`，并允许用户自定义安装目录

#### macOS

- 分发 `release/` 中的 `.dmg`
- 用户将应用拖到「应用程序」文件夹
- **注意**：在 App Store 之外分发时，需使用 Developer ID Application 证书签名。在 `package.json` 的 `build.mac.hardenedRuntime` / `build.mac.entitlements` 下配置，并通过环境变量提供签名密钥（详见 `CI_CD.md`）。

#### Linux

- 分发 `release/` 中的 `.AppImage`
- 用户使其可执行并运行：`chmod +x app.AppImage && ./app.AppImage`
- 同时也产出 `.deb`（Debian/Ubuntu）

#### 代码签名（生产环境推荐）

- **Windows**：通过环境变量提供 `CSC_LINK`（PFX）+ `CSC_KEY_PASSWORD`（或在 `package.json` 的 `build.win` 字段配置）
- **macOS**：需要 Apple 开发者账户；提供 `APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD`、`APPLE_TEAM_ID` 用于公证
- **Linux**：可选

详细说明请参见 [electron-builder 代码签名指南](https://www.electron.build/code-signing)。

## 开发工作流

### 典型开发周期

1. **启动开发服务器**

   ```bash
   pnpm dev  # 用于 Web 开发
   # 或
   pnpm electron:dev  # 用于桌面开发
   ```

2. **进行更改**
   - 编辑 `app/`、`components/` 或 `lib/` 中的文件
   - 更改会在浏览器/桌面应用中自动重新加载

3. **添加新组件**

   ```bash
   pnpm dlx shadcn@latest add [component-name]
   ```

4. **检查代码**

   ```bash
   pnpm lint
   ```

5. **构建和测试**

   ```bash
   pnpm build           # 测试 Web/静态导出构建
   pnpm electron:build  # 测试当前平台桌面构建
   ```

### 最佳实践

- **代码风格**：遵循 ESLint 规则（`pnpm lint`）
- **提交规范**：通过 `commit-msg` 钩子（commitlint）强制 Conventional Commits。clone 后运行一次 `pnpm install` —— `prepare` 脚本会自动安装钩子。
- **组件**：保持组件小而可复用
- **状态**：使用 Zustand 管理全局状态，使用 React hooks 管理局部状态
- **样式**：使用 Tailwind 工具类，尽可能避免自定义 CSS
- **类型**：利用 TypeScript 实现类型安全

## 故障排除

### 常见问题

**端口 3000 已被占用**

```bash
# 终止使用端口 3000 的进程
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

**Electron 构建失败**

```bash
# 大多数失败来自陈旧的安装或缺失的主进程编译产物。
# 干净重建：
rm -rf node_modules dist-electron release
pnpm install
pnpm electron:compile
pnpm electron:build
```

**模块未找到错误**

```bash
# 清除 Next.js 缓存
rm -rf .next

# 重新安装所有 workspace 依赖
rm -rf node_modules docs/node_modules pnpm-lock.yaml
pnpm install
```

**文档中出现 `Cannot find module 'collections/server'`**

该模块由 fumadocs-mdx 自动生成。运行一次文档开发服务器即可生成：

```bash
pnpm docs:dev
```

## 了解更多

### Next.js 资源

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 功能和 API
- [学习 Next.js](https://nextjs.org/learn) - 交互式 Next.js 教程
- [Next.js GitHub](https://github.com/vercel/next.js) - Next.js 仓库

### Electron 资源

- [Electron 文档](https://www.electronjs.org/docs/latest) - Electron 官方文档
- [electron-builder 文档](https://www.electron.build/) - 打包与代码签名指南
- [Electron GitHub](https://github.com/electron/electron) - Electron 仓库

### UI 和样式

- [shadcn/ui](https://ui.shadcn.com/) - 组件库文档
- [Tailwind CSS](https://tailwindcss.com/docs) - Tailwind CSS 文档
- [Radix UI](https://www.radix-ui.com/) - Radix UI 原语

### 状态管理

- [Zustand](https://zustand-demo.pmnd.rs/) - Zustand 文档

### 文档

- [Fumadocs](https://fumadocs.dev/) - Fumadocs 文档框架

## 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'feat: add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开 Pull Request

## 许可证

本项目是开源的，采用 [MIT 许可证](LICENSE)。

## 支持

如果您遇到任何问题或有疑问：

- 查看[故障排除](#故障排除)部分
- 查阅 [Next.js 文档](https://nextjs.org/docs)
- 查阅 [Electron 文档](https://www.electronjs.org/docs/latest)
- 查阅 [electron-builder 文档](https://www.electron.build/)
- 在 GitHub 上提出 issue
