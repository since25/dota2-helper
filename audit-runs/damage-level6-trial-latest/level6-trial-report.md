# 6级伤害 trial 校验报告
- 生成时间：2026-05-23T11:45:59.001Z
- API：http://localhost:3002
- 抽样：10/10 通过，通过率 100.0%
- 阈值：70.0%
- 是否继续全量：是
- 全量：126/126 通过，通过率 100.0%
## 判定规则
- 6级默认有 6 个技能点：最高理论伤害普通技能 3级，另外两个可计算普通技能 1级，大招 1级。
- 额外加入 3 次普攻；如果选中的被动攻击序列已经消费 3 次普攻，则不再重复加入基础普攻。
- 敌方护甲 0，魔抗 25%。百分比生命默认目标 1000 当前/最大生命。
## 结果明细
| 英雄 | 通过 | API 原始 | 理论原始 | 原始偏差 | API 抗性后 | 理论抗性后 | 抗性后偏差 | 技能方案 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 亚巴顿（Abaddon） | 是 | 668 | 668 | 0 | 569.25 | 569.25 | 0 | Mist Coil Lv3<br>Aphotic Shield Lv1<br>Curse of Avernus Lv1 |
| 炼金术士（Alchemist） | 是 | 876 | 876 | 0 | 876 | 876 | 0 | Acid Spray Lv3<br>Unstable Concoction Throw Lv1 |
| 远古冰魄（Ancient Apparition） | 是 | 725 | 725 | 0 | 592.5 | 592.5 | 0 | Ice Vortex Lv3<br>Cold Feet Lv1<br>Chilling Touch Lv1<br>Ice Blast Lv1 |
| 敌法师（Anti-Mage） | 是 | 207 | 207 | 0 | 207 | 207 | 0 |  |
| 天穹守望者（Arc Warden） | 是 | 661 | 661 | 0 | 568.5 | 568.5 | 0 | Flux Lv3<br>Spark Wraith Lv1 |
| 斧王（Axe） | 是 | 879 | 879 | 0 | 879 | 879 | 0 | Battle Hunger Lv3<br>Counter Helix Lv1<br>Culling Blade Lv1 |
| 祸乱之源（Bane） | 是 | 976.5 | 976.5 | 0 | 976.5 | 976.5 | 0 | Brain Sap Lv3<br>Enfeeble Lv1<br>Fiend's Grip Lv1 |
| 蝙蝠骑士（Batrider） | 是 | 1646 | 1646 | 0 | 1296 | 1296 | 0 | Firefly Lv3<br>Flamebreak Lv1<br>Flaming Lasso Lv1 |
| 兽王（Beastmaster） | 是 | 673 | 673 | 0 | 573 | 573 | 0 | Summon Raptors Lv3<br>Wild Axes Lv1<br>Drums of Slom Lv1<br>Primal Roar Lv1 |
| 血魔（Bloodseeker） | 是 | 479 | 479 | 0 | 479 | 479 | 0 | Blood Rite Lv3 |
| 赏金猎人（Bounty Hunter） | 是 | 213 | 213 | 0 | 213 | 213 | 0 |  |
| 酒仙（Brewmaster） | 是 | 644.5 | 644.5 | 0 | 564.5 | 564.5 | 0 | Thunder Clap Lv3<br>Cinder Brew Lv1<br>Primal Split Lv1 |
| 钢背兽（Bristleback） | 是 | 275 | 275 | 0 | 275 | 275 | 0 | Quill Spray Lv3 |
| 育母蜘蛛（Broodmother） | 是 | 415 | 415 | 0 | 360 | 360 | 0 | Spawn Spiderlings Lv1 |
| 半人马战行者（Centaur Warrunner） | 是 | 465 | 465 | 0 | 412.5 | 412.5 | 0 | Hoof Stomp Lv3 |
| 混沌骑士（Chaos Knight） | 是 | 387 | 387 | 0 | 349.5 | 349.5 | 0 | Chaos Bolt Lv3 |
| 陈（Chen） | 是 | 307 | 307 | 0 | 307 | 307 | 0 | Penitence Lv3 |
| 克林克兹（Clinkz） | 是 | 183 | 183 | 0 | 183 | 183 | 0 |  |
| 发条技师（Clockwerk） | 是 | 436 | 436 | 0 | 377.25 | 377.25 | 0 | Rocket Flare Lv3<br>Hookshot Lv1 |
| 水晶室女（Crystal Maiden） | 是 | 564 | 564 | 0 | 474 | 474 | 0 | Crystal Nova Lv3<br>Frostbite Lv1 |
| 黑暗贤者（Dark Seer） | 是 | 1985 | 1985 | 0 | 1547.5 | 1547.5 | 0 | Ion Shell Lv3<br>Vacuum Lv1<br>Wall of Replica Lv1 |
| 邪影芳灵（Dark Willow） | 是 | 1015 | 1015 | 0 | 813.75 | 813.75 | 0 | Bramble Maze Lv3<br>Bedlam Lv1<br>Shadow Realm Lv1 |
| 破晓辰星（Dawnbreaker） | 是 | 432 | 432 | 0 | 386.5 | 386.5 | 0 | Celestial Hammer Lv3<br>Starbreaker Lv1<br>Solar Guardian Lv1 |
| 戴泽（Dazzle） | 是 | 624 | 624 | 0 | 624 | 624 | 0 | Poison Touch Lv3<br>Shadow Wave Lv1 |
| 死亡先知（Death Prophet） | 是 | 844 | 844 | 0 | 706.5 | 706.5 | 0 | Spirit Siphon Lv3<br>Crypt Swarm Lv1 |
| 干扰者（Disruptor） | 是 | 1482 | 1482 | 0 | 1159.5 | 1159.5 | 0 | Thunder Strike Lv3<br>Static Storm Lv1 |
| 末日使者（Doom） | 是 | 1252 | 1252 | 0 | 1073.25 | 1073.25 | 0 | Scorched Earth Lv3<br>Infernal Blade Lv1<br>Doom Lv1 |
| 龙骑士（Dragon Knight） | 是 | 2372 | 2372 | 0 | 1834.5 | 1834.5 | 0 | Fireball Lv1<br>Breathe Fire Lv1<br>Dragon Tail Lv1<br>Elder Dragon Form Lv1 |
| 卓尔游侠（Drow Ranger） | 是 | 219.5 | 219.5 | 0 | 219.5 | 219.5 | 0 | Frost Arrows Lv3 |
| 大地之灵（Earth Spirit） | 是 | 1109 | 1109 | 0 | 882.75 | 882.75 | 0 | Enchant Remnant Lv1<br>Boulder Smash Lv1<br>Geomagnetic Grip Lv1<br>Magnetize Lv1 |
| 撼地者（Earthshaker） | 是 | 604 | 604 | 0 | 507.75 | 507.75 | 0 | Fissure Lv3<br>Aftershock Lv1<br>Echo Slam Lv1 |
| 上古巨神（Elder Titan） | 是 | 397 | 397 | 0 | 384.5 | 384.5 | 0 | Echo Stomp Lv3<br>Astral Spirit Lv1 |
| 灰烬之灵（Ember Spirit） | 是 | 1184 | 1184 | 0 | 942.75 | 942.75 | 0 | Flame Guard Lv3<br>Activate Fire Remnant Lv1<br>Searing Chains Lv1<br>Fire Remnant Lv1 |
| 魅惑魔女（Enchantress） | 是 | 244 | 244 | 0 | 244 | 244 | 0 | Enchant Lv3 |
| 谜团（Enigma） | 是 | 756 | 756 | 0 | 734.75 | 734.75 | 0 | Malefice Lv3<br>Demonic Summoning Lv1<br>Black Hole Lv1 |
| 虚空假面（Faceless Void） | 是 | 260 | 260 | 0 | 253.5 | 253.5 | 0 | Time Lock Lv3 |
| 天涯墨客（Grimstroke） | 是 | 492 | 492 | 0 | 420 | 420 | 0 | Stroke of Fate Lv3<br>Phantom's Embrace Lv1<br>Ink Swell Lv1 |
| 矮人直升机（Gyrocopter） | 是 | 467 | 467 | 0 | 397.5 | 397.5 | 0 | Homing Missile Lv3<br>Rocket Barrage Lv1 |
| 森海飞霞（Hoodwink） | 是 | 720.5 | 720.5 | 0 | 603 | 603 | 0 | Bushwhack Lv3<br>Hunter's Boomerang Lv1<br>Acorn Shot Lv1 |
| 哈斯卡（Huskar） | 是 | 190.5 | 190.5 | 0 | 190.5 | 190.5 | 0 |  |
| 祈求者（Invoker） | 是 | 361 | 361 | 0 | 361 | 361 | 0 | Sun Strike Lv1 |
| 艾欧（Io） | 是 | 252 | 252 | 0 | 252 | 252 | 0 |  |
| 杰奇洛（Jakiro） | 是 | 1638 | 1638 | 0 | 1281.75 | 1281.75 | 0 | Dual Breath Lv3<br>Liquid Fire Lv1<br>Ice Path Lv1<br>Macropyre Lv1 |
| 主宰（Juggernaut） | 是 | 907 | 907 | 0 | 732 | 732 | 0 | Blade Fury Lv3 |
| 光之守卫（Keeper of the Light） | 是 | 673.5 | 673.5 | 0 | 553.5 | 553.5 | 0 | Illuminate Lv3<br>Will-O-Wisp Lv1 |
| 凯（Kez） | 是 | 273 | 273 | 0 | 273 | 273 | 0 | Talon Toss Lv1 |
| 昆卡（Kunkka） | 是 | 1005 | 1005 | 0 | 810 | 810 | 0 | Torrent Lv3<br>Tidal Wave Lv1<br>Ghostship Lv1 |
| 军团指挥官（Legion Commander） | 是 | 435 | 435 | 0 | 410 | 410 | 0 | Overwhelming Odds Lv3<br>Moment of Courage Lv1<br>Duel Lv1 |
| 拉席克（Leshrac） | 是 | 1452 | 1452 | 0 | 1400.75 | 1400.75 | 0 | Diabolic Edict Lv3<br>Split Earth Lv1<br>Lightning Storm Lv1 |
| 巫妖（Lich） | 是 | 786.5 | 786.5 | 0 | 645 | 645 | 0 | Frost Shield Lv3<br>Frost Blast Lv1<br>Chain Frost Lv1 |
| 噬魂鬼（Lifestealer） | 是 | 342 | 342 | 0 | 304.5 | 304.5 | 0 | Infest Lv1 |
| 莉娜（Lina） | 是 | 870 | 870 | 0 | 708.75 | 708.75 | 0 | Dragon Slave Lv3<br>Light Strike Array Lv1<br>Laguna Blade Lv1 |
| 莱恩（Lion） | 是 | 1042 | 1042 | 0 | 833.25 | 833.25 | 0 | Earth Spike Lv3<br>Finger of Death Lv1 |
| 德鲁伊（Lone Druid） | 是 | 1080 | 1080 | 0 | 855 | 855 | 0 | Entangle Lv1 |
| 露娜（Luna） | 是 | 435 | 435 | 0 | 378.75 | 378.75 | 0 | Lucent Beam Lv3 |
| 狼人（Lycan） | 是 | 248.5 | 248.5 | 0 | 248.5 | 248.5 | 0 | Summon Wolves Lv3 |
| 马格纳斯（Magnus） | 是 | 675 | 675 | 0 | 581.25 | 581.25 | 0 | Horn Toss Lv1<br>Shockwave Lv1 |
| 玛西（Marci） | 是 | 1340 | 1340 | 0 | 1080 | 1080 | 0 | Dispose Lv3<br>Unleash Lv1 |
| 玛尔斯（Mars） | 是 | 546 | 546 | 0 | 463.5 | 463.5 | 0 | Spear of Mars Lv3<br>Arena Of Blood Lv1 |
| 美杜莎（Medusa） | 是 | 237 | 237 | 0 | 237 | 237 | 0 | Gorgon's Grasp Lv1<br>Split Shot Lv1 |
| 米波（Meepo） | 是 | 380 | 380 | 0 | 367.5 | 367.5 | 0 | MegaMeepo Lv1<br>Poof Lv1 |
| 米拉娜（Mirana） | 是 | 426 | 426 | 0 | 369.75 | 369.75 | 0 | Starstorm Lv3 |
| 齐天大圣（Monkey King） | 是 | 672 | 672 | 0 | 599.5 | 599.5 | 0 | Primal Spring Lv3<br>Tree Dance Lv1<br>Boundless Strike Lv1 |
| 变体精灵（Morphling） | 是 | 406.5 | 406.5 | 0 | 350.25 | 350.25 | 0 | Waveform Lv3 |
| 琼英碧灵（Muerta） | 是 | 207 | 207 | 0 | 207 | 207 | 0 |  |
| 娜迦海妖（Naga Siren） | 是 | 239 | 239 | 0 | 226.5 | 226.5 | 0 | Rip Tide Lv3 |
| 自然先知（Nature's Prophet） | 是 | 587 | 587 | 0 | 513.25 | 513.25 | 0 | Sprout Lv3<br>Nature's Call Lv1<br>Curse of the Oldgrowth Lv1<br>Wrath of Nature Lv1 |
| 瘟疫法师（Necrophos） | 是 | 195 | 195 | 0 | 195 | 195 | 0 |  |
| 暗夜魔王（Night Stalker） | 是 | 480 | 480 | 0 | 420 | 420 | 0 | Void Lv3 |
| 司夜刺客（Nyx Assassin） | 是 | 613 | 613 | 0 | 531.75 | 531.75 | 0 | Mind Flare Lv1<br>Impale Lv1 |
| 食人魔魔法师（Ogre Magi） | 是 | 792 | 792 | 0 | 664.5 | 664.5 | 0 | Ignite Lv3<br>Fireblast Lv1<br>Fire Shield Lv1 |
| 全能骑士（Omniknight） | 是 | 222 | 222 | 0 | 222 | 222 | 0 |  |
| 神谕者（Oracle） | 是 | 550 | 550 | 0 | 457.5 | 457.5 | 0 | Purifying Flames Lv3<br>Fortune's End Lv1 |
| 殁境神蚀者（Outworld Destroyer） | 是 | 498 | 498 | 0 | 430.5 | 430.5 | 0 | Astral Imprisonment Lv3 |
| 石鳞剑士（Pangolier） | 是 | 633 | 633 | 0 | 633 | 633 | 0 | Swashbuckle Lv3<br>Shield Crash Lv1 |
| 幻影刺客（Phantom Assassin） | 是 | 341.4 | 341.4 | 0 | 341.4 | 341.4 | 0 | Stifling Dagger Lv3 |
| 幻影长矛手（Phantom Lancer） | 是 | 475.3 | 475.3 | 0 | 420.3 | 420.3 | 0 | Spirit Lance Lv3<br>Juxtapose Lv1 |
| 凤凰（Phoenix） | 是 | 1138 | 1138 | 0 | 903 | 903 | 0 | Sun Ray Lv3<br>Icarus Dive Lv1<br>Fire Spirits Lv1<br>Supernova Lv1 |
| 獸（Primal Beast） | 是 | 555 | 555 | 0 | 480 | 480 | 0 | Pulverize Lv1 |
| 帕克（Puck） | 是 | 664 | 664 | 0 | 549 | 549 | 0 | Illusory Orb Lv3<br>Waning Rift Lv1<br>Dream Coil Lv1 |
| 帕吉（Pudge） | 是 | 896 | 896 | 0 | 810.5 | 810.5 | 0 | Meat Hook Lv3<br>Rot Lv1<br>Dismember Lv1 |
| 帕格纳（Pugna） | 是 | 474.5 | 474.5 | 0 | 413.25 | 413.25 | 0 | Nether Blast Lv3 |
| 痛苦女王（Queen of Pain） | 是 | 798 | 798 | 0 | 733 | 733 | 0 | Scream Of Pain Lv3<br>Sonic Wave Lv1 |
| 剃刀（Razor） | 是 | 376 | 376 | 0 | 343.5 | 343.5 | 0 | Storm Surge Lv3<br>Eye of the Storm Lv1 |
| 力丸（Riki） | 是 | 288 | 288 | 0 | 288 | 288 | 0 | Tricks of the Trade Lv3<br>Blink Strike Lv1 |
| 傀儡师（Ringmaster） | 是 | 204 | 204 | 0 | 204 | 204 | 0 |  |
| 拉比克（Rubick） | 是 | 463 | 463 | 0 | 400.5 | 400.5 | 0 | Fade Bolt Lv3 |
| 沙王（Sand King） | 是 | 2791 | 2791 | 0 | 2171 | 2171 | 0 | Sand Storm Lv3<br>Burrowstrike Lv1<br>Stinger Lv1<br>Epicenter Lv1 |
| 暗影恶魔（Shadow Demon） | 是 | 983 | 983 | 0 | 908 | 908 | 0 | Demonic Cleanse Lv1<br>Disruption Lv1<br>Demonic Purge Lv1 |
| 影魔（Shadow Fiend） | 是 | 651 | 651 | 0 | 534.75 | 534.75 | 0 | Shadowraze Lv3<br>Shadowraze Lv1<br>Shadowraze Lv1<br>Requiem of Souls Lv1 |
| 暗影萨满（Shadow Shaman） | 是 | 903.5 | 903.5 | 0 | 847.25 | 847.25 | 0 | Urnaconda Lv1<br>Ether Shock Lv1<br>Shackles Lv1<br>Mass Serpent Ward Lv1 |
| 沉默术士（Silencer） | 是 | 447 | 447 | 0 | 384 | 384 | 0 | Arcane Curse Lv3 |
| 天怒法师（Skywrath Mage） | 是 | 1369.25 | 1369.25 | 0 | 1077.19 | 1077.19 | 0 | Concussive Shot Lv3<br>Arcane Bolt Lv1<br>Mystic Flare Lv1 |
| 斯拉达（Slardar） | 是 | 436 | 436 | 0 | 436 | 436 | 0 | Bash of the Deep Lv3<br>Slithereen Crush Lv1 |
| 斯拉克（Slark） | 是 | 432 | 432 | 0 | 375.75 | 375.75 | 0 | Dark Pact Lv3 |
| 电炎绝手（Snapfire） | 是 | 1330 | 1330 | 0 | 1068.75 | 1068.75 | 0 | Spit Out Lv1<br>Firesnap Cookie Lv1<br>Scatterblast Lv1<br>Mortimer Kisses Lv1 |
| 狙击手（Sniper） | 是 | 697 | 697 | 0 | 572 | 572 | 0 | Concussive Grenade Lv1<br>Headshot Lv1<br>Assassinate Lv1 |
| 幽鬼（Spectre） | 是 | 359 | 359 | 0 | 316.5 | 316.5 | 0 | Spectral Dagger Lv3 |
| 裂魂人（Spirit Breaker） | 是 | 252 | 252 | 0 | 252 | 252 | 0 |  |
| 风暴之灵（Storm Spirit） | 是 | 213 | 213 | 0 | 213 | 213 | 0 |  |
| 斯温（Sven） | 是 | 480 | 480 | 0 | 420 | 420 | 0 | Storm Hammer Lv3 |
| 工程师（Techies） | 是 | 967 | 967 | 0 | 867 | 867 | 0 | Minefield Sign Lv1<br>Proximity Mines Lv1 |
| 圣堂刺客（Templar Assassin） | 是 | 211.5 | 211.5 | 0 | 211.5 | 211.5 | 0 |  |
| 恐怖利刃（Terrorblade） | 是 | 470 | 470 | 0 | 420 | 420 | 0 | Terror Wave Lv1<br>Conjure Image Lv1 |
| 潮汐猎人（Tidehunter） | 是 | 764 | 764 | 0 | 640.25 | 640.25 | 0 | Gush Lv3<br>Anchor Smash Lv1<br>Ravage Lv1 |
| 伐木机（Timbersaw） | 是 | 828 | 828 | 0 | 688 | 688 | 0 | Flamethrower Lv1<br>Timber Chain Lv1<br>Chakram Lv1 |
| 修补匠（Tinker） | 是 | 630 | 630 | 0 | 582.75 | 582.75 | 0 | Laser Lv3<br>Warp Flare Lv1<br>March of the Machines Lv1 |
| 小小（Tiny） | 是 | 615 | 615 | 0 | 525 | 525 | 0 | Avalanche Lv3<br>Toss Lv1 |
| 树精卫士（Treant Protector） | 是 | 1338 | 1338 | 0 | 1083 | 1083 | 0 | Nature's Grasp Lv3<br>Leech Seed Lv1<br>Overgrowth Lv1 |
| 巨魔战将（Troll Warlord） | 是 | 423 | 423 | 0 | 370.5 | 370.5 | 0 | Whirling Axes (Melee) Lv3<br>Whirling Axes (Ranged) Lv1<br>Berserker's Rage Lv1 |
| 巨牙海民（Tusk） | 是 | 921 | 921 | 0 | 744.75 | 744.75 | 0 | Walrus Kick Lv1<br>Ice Shards Lv1<br>Snowball Lv1 |
| 孽主（Underlord） | 是 | 743 | 743 | 0 | 618 | 618 | 0 | Firestorm Lv3<br>Pit of Malice Lv1 |
| 不朽尸王（Undying） | 是 | 251 | 251 | 0 | 241.5 | 241.5 | 0 | Soul Rip Lv3 |
| 熊战士（Ursa） | 是 | 349 | 349 | 0 | 305.25 | 305.25 | 0 | Earthshock Lv3 |
| 复仇之魂（Vengeful Spirit） | 是 | 672 | 672 | 0 | 555.75 | 555.75 | 0 | Magic Missile Lv3<br>Wave of Terror Lv1<br>Nether Swap Lv1 |
| 剧毒术士（Venomancer） | 是 | 1048 | 1048 | 0 | 851.63 | 851.63 | 0 | Snakebite Lv3<br>Venomous Gale Lv1<br>Poison Sting Lv1<br>Noxious Plague Lv1 |
| 冥界亚龙（Viper） | 是 | 1380.5 | 1380.5 | 0 | 1083.38 | 1083.38 | 0 | Nethertoxin Lv3<br>Corrosive Skin Lv1<br>Poison Attack Lv1<br>Viper Strike Lv1 |
| 维萨吉（Visage） | 是 | 467 | 467 | 0 | 467 | 467 | 0 | Stone Form Lv3<br>Stone Form Lv1 |
| 虚无之灵（Void Spirit） | 是 | 845 | 845 | 0 | 705 | 705 | 0 | Dissimilate Lv3<br>Aether Remnant Lv1<br>Resonant Pulse Lv1<br>Astral Step Lv1 |
| 术士（Warlock） | 是 | 879 | 879 | 0 | 789 | 789 | 0 | Shadow Word Lv3<br>Upheaval Lv1<br>Chaotic Offering Lv1 |
| 编织者（Weaver） | 是 | 400 | 400 | 0 | 360 | 360 | 0 | Shukuchi Lv3<br>The Swarm Lv1 |
| 风行者（Windranger） | 是 | 285 | 285 | 0 | 285 | 285 | 0 |  |
| 寒冬飞龙（Winter Wyvern） | 是 | 990.5 | 990.5 | 0 | 790.5 | 790.5 | 0 | Arctic Burn Lv3<br>Splinter Blast Lv1 |
| 巫医（Witch Doctor） | 是 | 1204 | 1204 | 0 | 1074.75 | 1074.75 | 0 | Maledict Lv3<br>Paralyzing Cask Lv1<br>Death Ward Lv1 |
| 冥魂大帝（Wraith King） | 是 | 567 | 567 | 0 | 507 | 507 | 0 | Wraithfire Blast Lv3<br>Bone Guard Lv1 |
| 宙斯（Zeus） | 是 | 955 | 955 | 0 | 772.5 | 772.5 | 0 | Lightning Bolt Lv3<br>Arc Lightning Lv1<br>Heavenly Jump Lv1<br>Thundergod's Wrath Lv1 |
