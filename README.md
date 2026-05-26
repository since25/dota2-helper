# Dota 2 Helper

这是一个面向 Dota 2 阵容分析与伤害模型审核的本地 Web 工具。当前项目重点已经从“简单 LLM 建议页”扩展到“本地数据驱动的中文阵容分析、英雄伤害模型、伤害组合计算器和人工审核工作流”。

## 当前功能

- 中文英雄名、别名与常用简称输入。
- 基于 `dotaconstants` 的英雄、技能、物品和版本数据上下文。
- 支持 OpenAI-compatible 的 AI 端点，可切换到自建 LLM 服务。
- 输出中文 Dota 对局建议，并要求 LLM 不编造本地数据之外的数值。
- 关键等级强势期与爆发窗口分析。
- 单英雄伤害组合计算器，支持等级、技能组件、持续时间、普攻相关输入、敌方护甲与魔抗。
- 全英雄伤害模型覆盖与语义审计。
- 批量导出 `/api/damage/heroes/:hero` 的 JSON 与 HTML 审核页面。

## 项目结构

常用入口：

- `server.js`：Express 后端、静态文件服务、AI 请求代理、数据 API。
- `index.html` / `script.js` / `style.css`：主阵容分析页面。
- `damage-calculator.html` / `damage-calculator.js` / `damage-calculator.css`：伤害组合计算器页面。
- `dotaDataContext.js`：构建给 LLM 的 Dota 数据上下文与中文 prompt。
- `damageExtractor.js`：从原始技能数据中提取伤害组件。
- `damageCalculator.js`：伤害计算器后端逻辑。
- `damageModels/`：英雄伤害模型、语义层、resolver 和覆盖统计。
- `dataProviders/`：数据源适配层，默认 `dotaconstants`，实验支持 `dota2-datawrapper`。
- `scripts/`：数据探测、语义审计、覆盖率统计、审核页面导出等脚本。
- `audit-runs/`：审核页导出结果目录。
- `test/`：Node test 测试集。

## 环境要求

- Node.js 18+，推荐 Node.js 20+。
- npm。
- 本地运行 LLM 建议功能时，需要配置一个 OpenAI-compatible 的模型接口；如果只看静态页面、数据 API 或伤害计算器，可以先不配置 AI key。

## 安装依赖

```bash
npm install
```

## 环境变量配置

在项目根目录创建 `.env` 文件。不要把真实 `.env` 提交到仓库。

### 基础配置

```bash
PORT=3002
APP_URL=http://localhost:3002
```

`PORT` 默认为 `3002`。如果不配置，服务会启动在 `http://localhost:3002`。

### AI 端点配置

项目调用的是 OpenAI-compatible Chat Completions API。自建 LLM 推荐使用：

```bash
AI_PROVIDER=openai-compatible
AI_API_BASE_URL=http://localhost:8000/v1
AI_API_KEY=你的_api_key_或留空
AI_MODEL=你的模型名
AI_INCLUDE_REASONING_EFFORT=false
```

如果使用 Groq 默认路径，可以配置：

```bash
GROQ_API_KEY=你的_groq_key
```

当前默认 Groq base url 是 `https://api.groq.com/openai/v1`，默认模型在 `aiClient.js` 中定义。

### 数据源配置

默认数据源：

```bash
DOTA_DATA_PROVIDER=dotaconstants
```

实验数据源：

```bash
DOTA_DATA_PROVIDER=datawrapper
```

目前主线仍以 `dotaconstants` 为稳定数据源，`dota2-datawrapper` 已接入为实验 provider，用于后续对比和迁移。

### 支付与限流

本 fork 已移除上游遗留的 Stripe 会员支付、Upstash Redis 订阅 token 和免费次数限流逻辑。当前服务只需要本地 Dota 数据、AI 端点配置和 Node 运行环境。

服务器部署不需要 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`STRIPE_PRICE_ID`、`KV_REST_API_URL`、`KV_REST_API_TOKEN`、`UPSTASH_REDIS_REST_URL` 或 `UPSTASH_REDIS_REST_TOKEN`。

部署到服务器后，如果看到 `Cannot find package 'dota2-datawrapper'`，说明运行目录的 `node_modules` 没有按当前依赖安装。进入部署目录执行 `npm ci` 或 `npm install` 后重启服务即可。

### 本机 Dota 2 引擎复核器

`tools/dota-addon/` 包含一个本机 Dota 2 Workshop Tools 复核器，用于把计算器 fixture 放进游戏引擎中测量。它只用于开发校准，不随服务器运行，也不要求远端服务器安装 Dota 2。

常用命令：

```bash
npm run engine:fixture -- <scenario.json> tools/dota-addon/generated/fixture.json
npm run engine:compare -- tools/dota-addon/generated/fixture.json <engine-result.json>
```

`engine:fixture` 会同时生成给 Node 对比用的 JSON，以及给 Workshop Tools 加载用的 `tools/dota-addon/scripts/vscripts/generated/dota_helper_fixture.lua`。

### 调试脚本配置

真实 LLM trial 可选：

```bash
AI_TRIAL_TIMEOUT_MS=120000
AI_TRIAL_MAX_COMPLETION_TOKENS=4096
```

审核页导出脚本可选：

```bash
DAMAGE_AUDIT_BASE_URL=http://localhost:3002
```

## 启动方式

普通启动：

```bash
npm start
```

开发启动，使用 `nodemon` 自动重启：

```bash
npm run dev
```

默认访问：

- 主页面：`http://localhost:3002/`
- 伤害计算器：`http://localhost:3002/damage-calculator.html`
- 英雄列表 API：`http://localhost:3002/api/heroes`
- 单英雄伤害模型 API：`http://localhost:3002/api/damage/heroes/Jakiro`
- 调试接口：`http://localhost:3002/api/debug`

## 常用脚本

运行全部测试：

```bash
npm test
```

查看伤害模型覆盖情况：

```bash
npm run damage:coverage
```

运行语义审计：

```bash
npm run semantic:audit
```

抓取 Dotabuff 技能页面快照：

```bash
npm run dotabuff:fetch -- --hero Abaddon
```

探测 `dota2-datawrapper`：

```bash
npm run data:probe
```

比较 `dotaconstants` 与 `datawrapper`：

```bash
npm run data:compare
```

运行真实 provider prompt trial：

```bash
npm run data:prompt-trial
```

## 伤害模型审核页导出

新增脚本：

```bash
npm run damage:audit-pages
```

默认会：

1. 请求 `/api/heroes` 获取英雄列表。
2. 批量请求 `/api/damage/heroes/:hero`。
3. 为每个英雄生成一份 `.json` 原始快照。
4. 为每个英雄生成一份 `.html` 人工可读审核页。
5. 生成 `index.html` 总索引。
6. 生成 `manifest.json` 导出清单。

默认输出目录：

```text
audit-runs/damage-heroes-<timestamp>/
```

指定固定输出目录：

```bash
npm run damage:audit-pages -- --out audit-runs/damage-heroes-latest
```

只导出部分英雄：

```bash
npm run damage:audit-pages -- --heroes Jakiro,Slardar
```

指定 API 地址：

```bash
npm run damage:audit-pages -- --base-url http://localhost:3002
```

控制并发：

```bash
npm run damage:audit-pages -- --concurrency 4
```

严格模式：只要有英雄导出失败，就让脚本以非 0 状态退出，适合 CI。

```bash
npm run damage:audit-pages -- --strict
```

如果某个英雄 API 返回错误，脚本也会生成该英雄的错误 HTML 页和 `.error.json`，这样索引页仍然可以完整展示所有待审核入口。

示例输出入口：

```text
audit-runs/damage-heroes-latest/index.html
```

## Dotabuff 语义校对快照

Dotabuff 作为人工语义校对来源，不作为计算器的主结构化数据源。脚本只保存公开页面快照和请求元数据，不绕过 Cloudflare challenge、登录或反爬限制。

抓取单个英雄：

```bash
npm run dotabuff:fetch -- --hero Abaddon
```

抓取全部英雄：

```bash
npm run dotabuff:fetch -- --all --continue-on-error
```

如果普通 HTTP 抓取遇到 `403` 或 challenge，可使用本地 Chrome/Playwright 渲染抓取：

```bash
npm run dotabuff:capture -- --hero Abaddon --force
npm run dotabuff:capture -- --all --force --continue-on-error
```

将已保存的 Dotabuff HTML/text 快照解析成结构化语义字段：

```bash
npm run dotabuff:parse -- --hero Abaddon --compare
npm run dotabuff:parse -- --all --compare
```

常用参数：

```bash
npm run dotabuff:fetch -- --out data/dotabuff/ability-pages
npm run dotabuff:fetch -- --force
npm run dotabuff:fetch -- --delay-ms 2000
```

输出目录：

```text
data/dotabuff/ability-pages/
```

每个英雄会生成：

```text
abaddon.html
abaddon.text.txt
abaddon.meta.json
```

解析后会生成：

```text
data/dotabuff/parsed/abaddon.json
data/dotabuff/comparison/abaddon.json
```

如果 Dotabuff 返回 `403`、`429` 或 Cloudflare challenge，脚本会写入 `.meta.json` 记录失败原因，但不会尝试绕过。后续人工审核时，建议先用这些快照校对语义，再把结论写入 `docs/hero-audit-notes/` 和 `damageModels/heroes/`。

## 当前开发进度

### 已完成

- 主页面前端已完成中文化方向调整，并移除了旧的免费次数/订阅提示元素。
- 英雄中文名、别名和显示名已统一到本地映射层，避免下拉列表出现大量重复别名。
- AI 端点已支持 OpenAI-compatible 自建服务，通过 `.env` 切换。
- LLM prompt 已改为中文输出、禁止编造本地未提供数值，并明确传入本地数据来源。
- 数据层默认使用 `dotaconstants`，并保留 `dota2-datawrapper` 实验 provider。
- 已补充英雄基础属性推导，避免把基础生命等字段误当成完整血量。
- 已建立伤害语义层，区分瞬时伤害、持续伤害、多波伤害、普攻触发、属性缩放、百分比伤害、护甲削减、增伤、资源消耗等类型。
- 已完成 126 个 canonical 英雄的伤害模型入口覆盖。
- 已覆盖 733 个可见技能模型入口。
- 覆盖率已区分三类状态：`manual reviewed` 表示人工复核，`manual candidate` 表示人工候选但未完成复核，`auto-only` 表示仅由自动模型覆盖。
- 已有手工复核模型：Slardar、Sand King、Queen of Pain、Lion、Lina、Axe、Shadow Fiend、Phantom Assassin、Faceless Void、Venomancer、Jakiro、Viper、Phoenix、Leshrac、Death Prophet、Witch Doctor、Ancient Apparition。
- 其余英雄仍通过自动模型生成首轮可审计配置，不能视为已经人工确认准确。
- 已修正多个错误分类：
  - Disruptor 伤害阈值不再被当成爆发伤害。
  - Sand King 的持续伤害、普攻触发和多波伤害分离。
  - Slardar 的被动按攻击次数建模。
  - Jakiro 的 `Liquid Fire` 识别为持续伤害，并保留 `duration/tick_rate`。
  - Jakiro 的 `Liquid Frost` 保留持续效果元数据。
  - Jakiro、Viper、Phoenix、Leshrac、Death Prophet、Witch Doctor、Ancient Apparition、Venomancer 已进入 Batch B 持续/跳伤人工复核模型。
  - Primal Beast 的攻击力百分比倍率不再被当成固定伤害。
- 已完成独立伤害组合计算器，支持手动敌方护甲、魔抗、持续作用时间和部分普攻相关输入。
- 已新增批量审核页导出脚本，用于人工逐英雄校验；页面会显示当前模型 JSON、未引用原始数值字段和可疑映射。
- 已修复 `Outworld Destroyer` / `Ringmaster` 与 dotaconstants 中 `Outworld Devourer` / `Ring Master` 的命名兼容问题。

### 当前已知问题

- 自动模型只是首轮覆盖，不代表 126 个英雄都已人工确认准确。复杂机制仍需要逐英雄审核。
- `Liquid Frost` 的持续期间“Jakiro 其他攻击/技能追加伤害”目前只保留持续时间元数据，还未建成完整增伤组件。
- 当前模型 schema 仍以单技能单主组件为主，复合技能的“初始伤害 + 持续伤害 + 百分比/条件爆发”还需要下一阶段扩展。
- 物品层的伤害、护甲削减、魔抗削减、主动技能和神杖/魔晶收益仍需要继续扩展。
- `dota2-datawrapper` 仍处于实验阶段，后续需要和 `dotaconstants` 做字段完整性对比后再决定迁移范围。

### 下一阶段建议

- 使用 `npm run damage:audit-pages -- --out audit-runs/damage-heroes-latest` 导出全英雄审核页。
- 继续 Batch B，优先把剩余持续/跳伤/引导英雄从 `auto-only` 升级为 `reviewed`。
- 优先校验持续伤害、普攻触发、百分比伤害、召唤物、分身、变身、复制技能和装备联动。
- 扩展复合技能模型，支持同一技能同时包含初始伤害、持续伤害、每跳伤害和条件爆发。
- 补齐物品语义层，特别是黯灭、强袭、冰甲、纷争、虚灵、血棘、神杖、魔晶等会改变伤害窗口的道具。

## 数据来源说明

当前稳定数据来源是 `dotaconstants`。它是由 Dota 2 游戏文件解析出来的预生成 JSON 包。项目目前把它作为默认本地结构化数据源。

`dota2-datawrapper` 已作为实验 provider 引入，目标是在后续阶段评估其数据丰富度，并逐步替换或补充现有数据层。

## 备注

本项目当前还在快速迭代阶段。伤害模型页面和审核脚本的目标不是一次性保证所有英雄都完全正确，而是让错误能被批量暴露、人工校验、逐步固化为可测试的模型。
