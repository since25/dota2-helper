# devilesk/dota-hero-calculator 参考挖掘记录

本阶段只把 `devilesk/dota-hero-calculator` 作为 UI 与数据中间层参考，不直接复用它的旧版本数值。

## 可借鉴点

- 页面形态是单页英雄实验室：英雄等级、属性面板、技能等级、物品商店和结果面板在一个工作台内联动。
- 数据被预处理成统一对象：英雄、技能、物品都使用 `attributes` 数组承载 `{ name, tooltip, value }`，技能额外保留 `damage`、`cooldown`、`manacost` 数组。
- 物品保留 `ItemShopTags`、`ItemQuality`、`ItemAliases`，适合用于商店筛选和展示分组。
- UI 把物品“加入背包”和“启用/禁用物品”区分开，这对后续模拟装备栏、主动效果、光环开关有参考价值。
- 它单独建模了幻象、召唤单位、技能构筑和图表输出。当前项目先不做全量复刻，但保留为后续阶段方向。

## 不直接采用点

- 数据停留在很旧的补丁，不作为当前数值来源。
- Knockout、jQuery、旧 sprite pipeline 不进入当前项目。
- 保存 build、bug report、外部 PHP 接口不进入当前阶段。

## 本项目采用方案

- 新增 `calculatorWorkbench.js`，把当前项目的 `damageModels`、`itemModels`、英雄属性推导为前端工作台模型。
- `damage-calculator.html/js/css` 改为三栏工作台：英雄面板、技能/商店/已选物品、结果面板。
- 商店分组不使用旧项目的 `ItemShopTags`，而是优先用当前语义类型分为伤害物品、修正/光环、神杖/魔晶、其他可选。
- 计算仍走 `/api/damage/calculate`，避免前端和后端出现两套公式。
