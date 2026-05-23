# Dota 2 英雄伤害模型审核流程

本文档定义语义层完成后的英雄伤害模型维护流程。目标是：任何进入计算器或 LLM prompt 的数值，都能追溯到 provider 原始字段，并能解释它为什么被计入、只作为参考，或暂不支持。

## 单英雄复核清单

1. 确认 provider 中的可见技能列表。
2. 找出直接伤害字段。
3. 区分持续、跳伤、多波、普攻触发、概率触发和条件伤害。
4. 区分护甲降低、魔抗降低、法术增强、伤害加深、攻速、暴击等进攻修正。
5. 区分防御、控制、资源、机动、范围、召唤物和条件输入字段。
6. 不能准确建模的机制必须写明 `unsupported` 或 `reference_only` 原因。
7. 每个手工模型必须有 `review.status`。
8. 每个批次补充对应测试。
9. 运行 semantic audit，并检查审核 HTML 中的原始字段和模型字段对照。

## 批次分组

按机制分组，不按字母顺序。每个批次都要小到可以用测试、semantic audit、计算器输出和 prompt 输出完成复核。

### Batch A: 简单瞬时伤害

以固定瞬时伤害为主，建立直接伤害字段、伤害类型、蓝耗冷却和等级强势期格式的基线。

### Batch B: 持续和跳伤

覆盖持续伤害、跳伤、引导、光环、持续时间和部分作用时间。持续类技能不能默认永远打满，应暴露作用时间控制。

### Batch C: 普攻修正和触发

覆盖攻击特效、重击、暴击、分裂类攻击和攻击次数触发。模型必须暴露攻击次数、英雄攻击力、触发概率和有效攻击窗口。

### Batch D: 抗性和增伤修正

覆盖护甲降低、魔抗降低、伤害加深、法术增强等后续伤害修正。这类字段不能进入固定伤害总量，应作为 modifier reference。

### Batch E: 召唤物和代理单位

覆盖召唤物、守卫、幻象、支配单位和代理单位伤害。模型需要暴露召唤数量、攻击力、作用时间、攻击间隔和存活假设。

### Batch F: 百分比和缩放伤害

覆盖最大生命、当前生命、已损生命、已损魔法、属性、距离和叠层缩放。进入计算前必须声明所需条件输入。

### Batch G: 变身和复制技能边界

覆盖变身、复制技能、偷取技能和跨英雄机制。除非英雄本身依赖这类机制，否则优先级低于基础伤害批次。

### Batch H: 剩余功能型英雄

完成低直接伤害或以功能性为主的英雄。非伤害字段仍需语义化，这样 prompt 可以解释为什么它们不计入爆发。

## Maintenance Stage 1

Stage 1 已开始把持续、跳伤、引导、多波技能从自动候选模型升级为人工复核模型。

当前已复核 Batch B 首批英雄：

- Jakiro
- Viper
- Phoenix
- Leshrac
- Death Prophet
- Witch Doctor
- Ancient Apparition
- Venomancer

模型状态含义：

- `reviewed`：已经人工复核并纳入测试。
- `candidate`：候选模型，通常来自自动抽取或尚未人工确认。
- `auto-only`：只有自动模型覆盖，不能视为准确完成。

本阶段常用命令：

```bash
npm run damage:coverage
npm run semantic:audit
npm run damage:audit-pages -- --out audit-runs/damage-heroes-latest
npm test
```

审核页会展示 API 输出、当前模型 JSON、未引用的原始数值字段和可疑映射，供人工逐英雄校对。

## 必跑命令

复核单个英雄后运行：

```bash
node scripts/semantic-audit.js --hero "Hero Name"
```

结束一个批次前运行：

```bash
npm run damage:coverage
```

进入下一批次前运行：

```bash
npm test
```

## 覆盖率门槛

覆盖率报告必须展示：

- 英雄总数；
- 人工复核英雄数；
- 人工候选英雄数；
- 仅自动模型英雄数；
- 语义完整技能数；
- `unsupported` 技能及原因；
- fallback/inferred 技能。

复核批次的质量要求：

- 不允许模型条目缺失语义信息；
- 不允许 `unsupported` 没有原因；
- 不允许非伤害修正被计入固定原始伤害；
- 不允许百分比字段被误当成固定伤害，除非模型明确解释；
- 不允许 prompt 对明确的非伤害语义仍显示 `Unknown`。
