This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 本地演示（无需数据库或后端）

```bash
npm run dev:demo
```

打开 http://127.0.0.1:3010/dashboard 。自动使用演示账号，可通过页面上方的演示导航查看首页、命盘报告、历史对话、咨询和统计看板。

- 使用当前页面组件和固定模拟数据，不调用真实后端或模型；命盘不是按示例生日计算的结果。
- 发送咨询会显示固定流式回复；历史列表支持搜索与查看。六爻历史为空，编辑、删除、支付等未模拟操作返回明确错误，不会转发线上。
- 仅在 `NODE_ENV=development` 且 `NEXT_PUBLIC_LOCAL_PREVIEW=1` 时启用；生产构建不会启用演示认证或模拟 API。
- 使用独立端口 3010、构建目录 `.next-demo`，不需要修改 `.env.local`，不会写入或替换真实登录 token。
- 停止服务后运行 `npm run dev` 即恢复普通开发模式。聊天页面可能保留该演示端口下的浏览器缓存。
- 本模式用于页面与交互预览，不能替代排盘算法、数据库、真实登录和支付验收。
