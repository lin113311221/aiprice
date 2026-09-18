## JIAYOU_APP_HOST_PATH_20260918

- 正式 App 路径：`/app/jiayou/`（`https://aiprice.store/app/jiayou/`）
- 营销页保持：`/jiayou/`（主 CTA 指向 App；QMuse 链为「参赛/预览」）
- 部署命令不变：`tcb hosting deploy dist`
- 预构建 SPA：在 jiayou 仓跑 `npm run build:own-host` 后，设 `JIAYOU_DIST=/abs/path/to/dist-own-host`，或把产物放到本仓兄弟目录 `../jiayou/dist-own-host`（其次 `../jiayou/dist`），再执行 `node build.mjs`。目录不存在时写入占位 `index.html`，避免空目录一直 404。
- `build.mjs` 只覆盖 `src/**` 对应路径和 `dist/app/jiayou/`，不删除 `dist/jiayou/`，也不动 license-api / redeem / ask / 其他产品。
- **不要**在只有本仓 `src/jiayou` 的干净 `dist/` 上直接 `tcb hosting deploy dist`：这会只上传家有营销页 + App 目录，冲掉首页 / savault / ask / redeem。应在已有完整 hosting `dist/` 上跑本脚本后再部署，或先把线上其他产品拷进 `dist/`。
- Hash 路由的 Vite App 只需文件夹内有 `index.html`。本仓没有 redeem/ask 的 CloudBase rewrite 配置，因此未新增 SPA fallback，以免覆盖线上规则。
