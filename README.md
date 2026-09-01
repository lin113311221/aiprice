# aiprice — 大模型 API 比价数据（Agent 友好）

> 在线比价站：**https://ask.aiprice.store**
> 同一价格库，同时提供给网页、公开 API 和 MCP，人和 Agent 读到的是同一份数据。

收录 **42 个主流大模型 × 14 家厂商**（深度求索 / 阿里云百炼 / 火山引擎 / 智谱 / Moonshot / MiniMax / 腾讯 / 百度 / 讯飞 / 零一万物 / Google / OpenAI / Anthropic / xAI），包含：

- 输入 / 输出 / 缓存读价格（每百万 token，美元，国产模型按 7.25 汇率换算）
- **DeepSeek 峰谷双价**（`alt` 字段：高峰时段价）
- **多渠道比价**（`channels` 字段：原厂 / OpenRouter / 硅基流动）
- 上下文长度、免费额度、官方定价页与 API key 申请直达链接
- 28 个模型的第三方智能指数（Artificial Analysis 等公开基准）、Aider 225 题实测花费、单任务成本、帕累托前沿

## 给 Agent 用：MCP

在任何支持 MCP 的客户端里加：

```json
{
  "mcpServers": {
    "aiprice": {
      "url": "https://ask.aiprice.store/api/mcp"
    }
  }
}
```

提供 5 个工具：`search_models`（搜模型）/ `get_prices`（查价格）/ `compare_costs`（按用量估算月费）/ `find_best_value`（按每美元智能找最优）/ `get_benchmarks`（查评测分）。

## 给程序用：公开 API

```bash
# 全量价格库
curl "https://ask.aiprice.store/api/models"

# 只要国内可用、按混合价排序
curl "https://ask.aiprice.store/api/models?cn=1&sort=mixed"

# 按你的用量（输入 5M / 输出 2M token / 缓存命中 30%）算各家月费
curl "https://ask.aiprice.store/api/compare?in=5&out=2&cache=30"

# 给 LLM 直接读的纯文本价格表
curl "https://ask.aiprice.store/api/llms.txt"
```

其他端点：`/api/health` `/api/schema` `/api/vendors`。无需鉴权，响应带 5 分钟边缘缓存。

## 字段说明

| 字段 | 含义 |
|---|---|
| `in` / `out` / `cache` | 每百万 token 的输入 / 输出 / 缓存读价（USD） |
| `ctx` | 上下文长度（token） |
| `cn` | 是否国内可直接访问 |
| `tier` | `lite` 轻量 / `balanced` 主力 / `flagship` 旗舰 |
| `alt` | 峰谷定价（目前 DeepSeek：高峰价；低谷价为平峰 ×0.5，见 note） |
| `channels.openrouter` | OpenRouter 价格（官方价 + 5.5% 平台费，估算） |
| `channels.siliconflow` | 硅基流动价格（主流模型与官方同价） |

## 数据更新与纠错

价格随时变动，**以各家官方定价页为准**。发现过时或错误，欢迎开 Issue 指出（带上官方定价页链接最佳）。数据文件在 `data/` 目录，与线上站点同源。

## License

代码与整理方式 MIT；价格数据归各模型厂商所有，转载注明出处即可。

---

**English**: Curated LLM API pricing for 42 models / 14 vendors — prices, context, free tiers, peak/off-peak rates (DeepSeek), channel comparison (official / OpenRouter / SiliconFlow), third-party intelligence benchmarks, and real task costs. Free JSON API + MCP server at https://ask.aiprice.store/api — same dataset the website uses. Issues for price corrections welcome.
