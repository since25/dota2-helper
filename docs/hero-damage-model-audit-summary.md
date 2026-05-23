# 英雄伤害模型复核问题汇总

## 总览
- 复核文件：126 个英雄。
- 已复核：126 个。
- 格式统一：126 个文件均包含状态、模型概览、复核结论、技能复核。
- 明确需要修复或增强：124 个英雄。
- 核心模型暂不需要立即修改：`Bane`、`Death Prophet`。

这份汇总来自 `docs/hero-audit-notes/*.md` 的人工复核结论，用于指导下一阶段实际修改 `damageModels/heroes/*.js`、`damageModels/resolver.js`、`damageModels/schema.js` 和相关测试。

## 问题类型

### 1. 字段取错或字段语义误读
这些问题会直接导致计算结果错误，优先级最高。

- `Pugna / Nether Blast`：当前取 `structure_damage_mod`，对英雄应取 `blast_damage`。
- `Void Spirit / Astral Step`：当前取 `pop_damage_delay`，应取 `pop_damage`。
- `Winter Wyvern / Arctic Burn`：当前把 `damage_duration` 当 DPS，实际应使用 `percent_damage`。
- `Pudge / Meat Shield`：`damage_block` 是格挡，不是对敌伤害。
- `Treant Protector / Living Armor`：`damage_block_base` 是格挡，不是伤害。
- `Visage / Gravekeeper's Cloak`：`minimum_damage` 是触发阈值，不是伤害。
- `Techies / Blast Off!`：`hp_cost` 是自身生命代价，不是对敌百分比伤害。
- `Storm Spirit / Ball Lightning`：不是目标已损魔法百分比伤害，应按飞行距离/消耗建模。
- `Snapfire / Firesnap Cookie`：不是距离缩放伤害，是固定撞击伤害。
- `Spirit Breaker / Nether Strike`：不是距离缩放伤害，是固定额外伤害并触发重击语境。

### 2. 持续伤害、引导伤害、短时 tick 被当成瞬时
这些问题会让爆发时间窗不准确，尤其影响对线换血和斩杀线。

- `Ogre Magi / Ignite`：每秒燃烧伤害，应为 `sustained_dps`。
- `Pudge / Rot`：开关型持续伤害，不是瞬时伤害。
- `Oracle / Purifying Flames`：对敌伤害是瞬时，后续治疗是持续，当前持续模型方向错误。
- `Queen of Pain / Shadow Strike`：初始伤害 + 周期伤害。
- `Silencer / Arcane Curse`：初始伤害 + 持续伤害 + 惩罚延长。
- `Warlock / Shadow Word`：持续治疗/伤害。
- `Wraith King / Wraithfire Blast`：初始伤害 + DOT。
- `Venomancer / Venomous Gale`、`Snakebite`、`Noxious Plague`：均需要初始伤害 + 持续伤害复合模型。
- `Viper / Nethertoxin`：最低到最高 DPS 的成长曲线不能直接按满额计算。

### 3. 多波、多段、命中次数、弹跳次数缺输入
这些问题通常不能默认打满，需要 UI 或 API 输入实际命中次数。

- `Sand King / Epicenter`：按波数乘每波伤害，需 `wave_count`。
- `Primal Beast / Pulverize`：按脉冲次数或持续施法时间。
- `Pangolier / Swashbuckle`、`Rolling Thunder`：刺击/碰撞次数。
- `Shadow Shaman / Shackles`、`Mass Serpent Ward`：引导时长和守卫攻击次数。
- `Snapfire / Mortimer Kisses`：火团命中次数 + 地面燃烧时间。
- `Tinker / March of the Machines`：机器命中次数。
- `Witch Doctor / Paralyzing Cask`：弹跳次数和每跳递增伤害。
- `Tiny / Avalanche`、`Tree Volley`：短时 tick 和树木命中次数。
- `Zeus / Nimbus`：雷云雷击次数。

### 4. 普攻、暴击、被动、概率触发需要攻击窗口
这些模型不能作为独立固定伤害，必须结合攻击次数、触发模式、攻击力和属性。

- `Slardar / Bash of the Deep`：每 3 次攻击触发一次重击。
- `Sniper / Headshot`：概率额外物理伤害；`Take Aim` 可让爆头确定触发。
- `Riki / Backstab`、`Blink Strike`、`Tricks of the Trade`：敏捷、背刺角度和攻击次数。
- `Phantom Assassin / Stifling Dagger`、`Coup de Grace`：攻击伤害、暴击模式。
- `Ursa / Fury Swipes`、`Overpower`：按攻击序列叠层。
- `Troll Warlord / Berserker's Rage`、`Fervor`：概率残废和攻速叠层。
- `Tusk / Walrus PUNCH!`、`Tag Team`：一次暴击攻击和多次攻击附加伤害。
- `Windranger / Focus Fire`：攻击窗口，不是独立技能伤害。
- `Weaver / Geminate Attack`：额外攻击和额外伤害。

### 5. 召唤物、幻象、守卫、单位代理缺统一模型
这类英雄会被当前固定技能爆发严重低估或误算。

- `Phantom Lancer`、`Terrorblade`、`Chaos Knight`、`Naga Siren`：幻象输出需要幻象数量、输出比例、攻击次数。
- `Shadow Demon / Disruption`：生成幻象，不是施法瞬时伤害。
- `Visage / Summon Familiars`、`Stone Form`：佣兽攻击次数和落地命中数量。
- `Warlock / Chaotic Offering`、`Eldritch Summoning`：地狱火/小鬼攻击或爆炸。
- `Wraith King / Bone Guard`：骷髅数量和攻击次数。
- `Venomancer / Plague Ward`、`Shadow Shaman / Mass Serpent Ward`：守卫攻击次数。
- `Undying / Tombstone`：僵尸攻击次数。
- `Beastmaster`、`Brewmaster`、`Lone Druid` 等召唤单位也应进入同一层。

### 6. 百分比生命、魔法、属性、资源缩放缺公式
这些模型需要目标状态或施法者状态输入。

- `Outworld Destroyer / Arcane Orb`、`Sanity's Eclipse`：当前魔法值、双方魔法差。
- `Phoenix / Sun Ray`：基础 DPS + 目标最大生命百分比。
- `Techies / M.A.D.`：基础伤害 + 最大魔法值百分比。
- `Silencer / Last Word`、`Glaives of Wisdom`：智力差、智力系数。
- `Skywrath Mage / Arcane Bolt`：基础伤害 + 智力系数。
- `Pudge / Dismember`：基础 DPS + 力量系数。
- `Sven / Wrath of God`、`God's Strength`：力量和攻击力乘区。
- `Zeus / Static Field`：敌方当前生命百分比。
- `Spectre / Dispersion`：承受伤害和距离。

### 7. 修正项不应作为独立伤害
这些字段应进入 modifier 层，而不是出现在直接伤害列表。

- 护甲降低：`Slardar / Corrosive Haze`、`Vengeful Spirit / Wave of Terror`、`Tidehunter / Gush`、`Shadow Fiend / Presence of the Dark Lord`。
- 魔法伤害加深/魔抗降低：`Pugna / Decrepify`、`Skywrath Mage / Ancient Seal`、`Zeus / Static Field` 触发层、`Techies / Proximity Mines` 魔抗降低。
- 攻击力/攻速增益：`Sven / God's Strength`、`Terrorblade / Metamorphosis`、`Windranger / Focus Fire`、`Troll Warlord / Battle Trance`。
- 防御/治疗/护盾：`Pudge / Meat Shield`、`Treant / Living Armor`、`Omniknight / Repel`、`Winter Wyvern / Cold Embrace`。

## 修复优先级

### P0：会直接生成错误伤害数值
- 字段取错：`Pugna`、`Void Spirit`、`Winter Wyvern`、`Pudge`、`Treant`、`Visage`。
- 非伤害字段被当伤害：格挡、护盾、阈值、持续时间、延迟时间。
- 明显瞬时/持续方向反了：`Oracle / Purifying Flames`、`Ogre Magi / Ignite`、`Pudge / Rot`。

### P1：主流爆发线缺关键伤害
- 复合 DOT：`Venomancer`、`Viper`、`Silencer`、`Wraith King`。
- 多波/多段：`Sand King`、`Snapfire`、`Primal Beast`、`Pangolier`。
- 百分比/属性缩放：`OD`、`Skywrath Mage`、`Pudge`、`Phoenix`、`Zeus`。

### P2：输出窗口和长期伤害
- 普攻/暴击/概率：`PA`、`Slardar`、`Ursa`、`Sniper`、`Riki`、`Troll Warlord`。
- 召唤物/幻象：`Terrorblade`、`Phantom Lancer`、`Warlock`、`Visage`、`Wraith King`。
- 伤害修正链：减甲、魔抗降低、伤害加深、攻击力加成。

## 下一步产物
- 先扩展模型语义和 resolver，避免每个英雄重复手写特殊逻辑。
- 再按 P0/P1/P2 分批修改英雄模型。
- 每批修改后运行 `npm test` 和 `npm run damage:audit-pages`，用导出的 HTML 做人工抽查。
