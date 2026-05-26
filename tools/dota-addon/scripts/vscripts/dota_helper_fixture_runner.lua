if DotaHelperFixtureRunner == nil then
  DotaHelperFixtureRunner = class({})
end

local hasGeneratedFixture, GeneratedFixture = pcall(require, "generated.dota_helper_fixture")

function DotaHelperFixtureRunner:InitGameMode()
  print("[dota-helper] fixture runner initialized")
  if hasGeneratedFixture and GeneratedFixture ~= nil then
    self.fixture = GeneratedFixture
    self.fixtures = GeneratedFixture.fixtures or { GeneratedFixture }
    self.fixtureIndex = 0
    self:RegisterConsoleCommands()
    GameRules:GetGameModeEntity():SetThink("RunNextFixture", self, "dota_helper_fixture", 1.0)
  else
    self:RegisterConsoleCommands()
    GameRules:GetGameModeEntity():SetThink("RunSmokeFixture", self, "dota_helper_fixture_smoke", 1.0)
  end
end

function DotaHelperFixtureRunner:RegisterConsoleCommands()
  if self.consoleCommandsRegistered then return end
  self.consoleCommandsRegistered = true
  Convars:RegisterCommand("dota_helper_run_fixture", function()
    if self:ReloadFixture() then
      print("[dota-helper] re-running fixture batch")
      GameRules:GetGameModeEntity():SetThink("RunNextFixture", self, "dota_helper_fixture", 0.2)
    end
  end, "Reload and run dota-helper fixture batch", FCVAR_CHEAT)
end

function DotaHelperFixtureRunner:ReloadFixture()
  package.loaded["generated.dota_helper_fixture"] = nil
  local ok, fixture = pcall(require, "generated.dota_helper_fixture")
  if not ok or fixture == nil then
    print("[dota-helper] reload failed: " .. tostring(fixture))
    return false
  end
  self.fixture = fixture
  self.fixtures = fixture.fixtures or { fixture }
  self.fixtureIndex = 0
  self.pendingSequenceFixture = nil
  self.pendingActiveItemFixture = nil
  self.pendingInvisibilityBreakAttackWindow = nil
  self:CleanupFixtureUnits()
  return true
end

function DotaHelperFixtureRunner:RunSmokeFixture()
  print("[dota-helper] smoke fixture ready")
  print('{"id":"smoke","engine":{"observedDamage":0,"modifiers":[]}}')
  return nil
end

function DotaHelperFixtureRunner:RunFixture()
  self.fixtures = self.fixtures or { self.fixture }
  self.fixtureIndex = self.fixtureIndex or 0
  return self:RunNextFixture()
end

function DotaHelperFixtureRunner:RunNextFixture()
  self.fixtureIndex = (self.fixtureIndex or 0) + 1
  local fixture = self.fixtures and self.fixtures[self.fixtureIndex] or nil
  if fixture == nil then
    print("[dota-helper] fixture batch complete")
    return nil
  end
  print("[dota-helper] fixture loaded: " .. tostring(fixture.id))
  self.currentFixtureUnits = {}
  local ok, result = pcall(function()
    return self:RunConfiguredFixture(fixture)
  end)
  if not ok then
    self:PrintResult({
      id = fixture.id,
      engine = {
        observedDamage = 0,
        modifiers = {},
        error = tostring(result)
      }
    })
    self:CleanupFixtureUnits()
    return 0.2
  end
  if result == nil then
    return nil
  end
  self:PrintResult(result)
  self:CleanupFixtureUnits()
  return 0.2
end

function DotaHelperFixtureRunner:RunConfiguredFixture(fixture)
  if fixture.scenario ~= nil and fixture.scenario.type == "attack_window" then
    return self:RunAttackWindowFixture(fixture)
  end
  if fixture.scenario ~= nil and fixture.scenario.type == "active_item" then
    return self:RunActiveItemFixture(fixture)
  end
  if fixture.scenario ~= nil and fixture.scenario.type == "sequence" then
    return self:RunSequenceFixture(fixture)
  end
  return {
    id = fixture.id,
    engine = {
      observedDamage = 0,
      modifiers = { "unsupported_scenario" }
    }
  }
end

function DotaHelperFixtureRunner:PrepareFixtureActors(fixture)
  local attacker = self:CreateFixtureUnit(fixture.attackerUnitName, DOTA_TEAM_GOODGUYS, Vector(0, 0, 256))
  local target = self:CreateFixtureUnit(fixture.targetUnitName, DOTA_TEAM_BADGUYS, Vector(300, 0, 256))

  self:SetHeroLevel(attacker, fixture.heroLevel or 1)
  self:SetHeroLevel(target, fixture.target and fixture.target.level or 1)
  self:SetAbilityLevels(attacker, fixture.abilityLevels or {})
  self:PrepareTarget(target, fixture.target or {})
  self:AddItems(attacker, fixture.itemAbilityNames or {})
  self:DisableAutoAcquire(target)

  return attacker, target
end

function DotaHelperFixtureRunner:RunAttackWindowFixture(fixture)
  local attacker, target = self:PrepareFixtureActors(fixture)
  if fixture.scenario ~= nil and fixture.scenario.forceInvisibilityBreak then
    return self:RunInvisibilityBreakAttackWindow(fixture, attacker, target)
  end

  local beforeHealth = target:GetHealth()
  local targetArmor = self:CallNumber(target, "GetPhysicalArmorValue", false)
  local targetMagicResistance = self:MagicalResistancePercent(target)
  local attackerDamageMin = self:CallNumber(attacker, "GetDamageMin")
  local attackerDamageMax = self:CallNumber(attacker, "GetDamageMax")
  local attackerBaseDamageMin = self:CallNumber(attacker, "GetBaseDamageMin")
  local attackerBaseDamageMax = self:CallNumber(attacker, "GetBaseDamageMax")
  local attackerAverageTrueDamage = self:CallNumber(attacker, "GetAverageTrueAttackDamage", target)
  local attackerAverageTrueDamageNoTarget = self:CallNumber(attacker, "GetAverageTrueAttackDamage")
  local attackCount = fixture.scenario and fixture.scenario.attackCount or 1
  local attackFlagsConfig = fixture.scenario and fixture.scenario.attackFlags or nil
  local trials = self:FixtureTrials(fixture)
  local observedDamageSamples = {}
  local afterHealth = beforeHealth
  for trial = 1, trials do
    if trial > 1 and target.SetHealth ~= nil then
      target:SetHealth(beforeHealth)
    end
    for _ = 1, attackCount do
      self:PerformConfiguredAttack(attacker, target, attackFlagsConfig)
    end
    afterHealth = target:GetHealth()
    table.insert(observedDamageSamples, beforeHealth - afterHealth)
  end
  local observedDamage = observedDamageSamples[#observedDamageSamples] or 0
  local sampleStats = self:SampleStats(observedDamageSamples)

  return {
    id = fixture.id,
    engine = {
      observedDamage = observedDamage,
      targetHealthBefore = beforeHealth,
      targetHealthAfter = afterHealth,
      targetArmor = targetArmor,
      targetMagicResistance = targetMagicResistance,
      attackerDamageMin = attackerDamageMin,
      attackerDamageMax = attackerDamageMax,
      attackerBaseDamageMin = attackerBaseDamageMin,
      attackerBaseDamageMax = attackerBaseDamageMax,
      attackerAverageTrueDamage = attackerAverageTrueDamage,
      attackerAverageTrueDamageNoTarget = attackerAverageTrueDamageNoTarget,
      attackCount = attackCount,
      observedDamageSamples = sampleStats.samples,
      observedDamageMean = sampleStats.mean,
      observedDamageStdev = sampleStats.stdev,
      observedDamageMin = sampleStats.min,
      observedDamageMax = sampleStats.max,
      expectedAdjusted = fixture.expectedAdjusted,
      modifiers = { "attack_window" }
    }
  }
end

function DotaHelperFixtureRunner:RunInvisibilityBreakAttackWindow(fixture, attacker, target)
  local beforeHealth = target:GetHealth()
  local targetArmor = self:CallNumber(target, "GetPhysicalArmorValue", false)
  local targetMagicResistance = self:MagicalResistancePercent(target)
  local attackerDamageMin = self:CallNumber(attacker, "GetDamageMin")
  local attackerDamageMax = self:CallNumber(attacker, "GetDamageMax")
  local attackerBaseDamageMin = self:CallNumber(attacker, "GetBaseDamageMin")
  local attackerBaseDamageMax = self:CallNumber(attacker, "GetBaseDamageMax")
  local attackerAverageTrueDamage = self:CallNumber(attacker, "GetAverageTrueAttackDamage", target)
  local attackerAverageTrueDamageNoTarget = self:CallNumber(attacker, "GetAverageTrueAttackDamage")
  local attackCount = fixture.scenario and fixture.scenario.attackCount or 1
  local activeItem = self:FindFirstItem(attacker, { "item_invis_sword", "item_silver_edge" })
  self:PrepareInvisibilityBreak(attacker, target)

  self.pendingInvisibilityBreakAttackWindow = {
    id = fixture.id,
    fixture = fixture,
    attacker = attacker,
    target = target,
    beforeHealth = beforeHealth,
    targetArmor = targetArmor,
    targetMagicResistance = targetMagicResistance,
    attackerDamageMin = attackerDamageMin,
    attackerDamageMax = attackerDamageMax,
    attackerBaseDamageMin = attackerBaseDamageMin,
    attackerBaseDamageMax = attackerBaseDamageMax,
    attackerAverageTrueDamage = attackerAverageTrueDamage,
    attackerAverageTrueDamageNoTarget = attackerAverageTrueDamageNoTarget,
    attackCount = attackCount,
    expectedAdjusted = fixture.expectedAdjusted
  }
  GameRules:GetGameModeEntity():SetThink(
    "FinishInvisibilityBreakAttackWindow",
    self,
    "dota_helper_invisibility_break_attack_window",
    self:InvisibilityBreakDelaySeconds(activeItem)
  )
  return nil
end

function DotaHelperFixtureRunner:FinishInvisibilityBreakAttackWindow()
  local pending = self.pendingInvisibilityBreakAttackWindow
  if pending == nil then return nil end
  self.pendingInvisibilityBreakAttackWindow = nil
  local scenario = pending.fixture and pending.fixture.scenario or {}
  local attackFlagsConfig = scenario.attackFlags or {
    processProcs = true,
    useCastAttackOrb = true,
    skipCooldown = true,
    neverMiss = true
  }
  for _ = 1, pending.attackCount do
    self:PerformConfiguredAttack(pending.attacker, pending.target, attackFlagsConfig)
  end
  local afterHealth = pending.target:GetHealth()
  local observedDamage = pending.beforeHealth - afterHealth

  self:PrintResult({
    id = pending.id,
    engine = {
      observedDamage = observedDamage,
      targetHealthBefore = pending.beforeHealth,
      targetHealthAfter = afterHealth,
      targetArmor = pending.targetArmor,
      targetMagicResistance = pending.targetMagicResistance,
      attackerDamageMin = pending.attackerDamageMin,
      attackerDamageMax = pending.attackerDamageMax,
      attackerBaseDamageMin = pending.attackerBaseDamageMin,
      attackerBaseDamageMax = pending.attackerBaseDamageMax,
      attackerAverageTrueDamage = pending.attackerAverageTrueDamage,
      attackerAverageTrueDamageNoTarget = pending.attackerAverageTrueDamageNoTarget,
      attackCount = pending.attackCount,
      expectedAdjusted = pending.expectedAdjusted,
      modifiers = { "attack_window", "invisibility_break" }
    }
  })
  self:CleanupFixtureUnits()
  GameRules:GetGameModeEntity():SetThink("RunNextFixture", self, "dota_helper_fixture", 0.2)
  return nil
end

function DotaHelperFixtureRunner:RunActiveItemFixture(fixture)
  local attacker, target = self:PrepareFixtureActors(fixture)

  local beforeHealth = target:GetHealth()
  local targetArmor = self:CallNumber(target, "GetPhysicalArmorValue", false)
  local targetMagicResistance = self:MagicalResistancePercent(target)
  local activeItemName = self:ItemAbilityName(fixture.scenario and fixture.scenario.activeItemKey)
  local activeItem = self:FindFirstItem(attacker, { activeItemName })
  local activeItemLevel = self:CallNumber(activeItem, "GetLevel")
  local activeItemDamageSpecial = self:SpecialValue(activeItem, "damage")
  local castItem = self:CastActiveItem(attacker, target, activeItemName)
  self.pendingActiveItemFixture = {
    id = fixture.id,
    target = target,
    beforeHealth = beforeHealth,
    targetArmor = targetArmor,
    targetMagicResistance = targetMagicResistance,
    activeItemLevel = activeItemLevel,
    activeItemDamageSpecial = activeItemDamageSpecial,
    activeItemCast = castItem and 1 or 0,
    expectedAdjusted = fixture.expectedAdjusted
  }
  local delay = fixture.scenario and fixture.scenario.resultDelaySeconds or 1.0
  GameRules:GetGameModeEntity():SetThink("FinishActiveItemFixture", self, "dota_helper_active_item", delay)
  return nil
end

function DotaHelperFixtureRunner:RunSequenceFixture(fixture)
  local attacker, target = self:PrepareFixtureActors(fixture)
  local beforeHealth = target:GetHealth()
  local targetArmor = self:CallNumber(target, "GetPhysicalArmorValue", false)
  local targetMagicResistance = self:MagicalResistancePercent(target)
  local attackerBaseDamageMin = self:CallNumber(attacker, "GetBaseDamageMin")
  local attackerBaseDamageMax = self:CallNumber(attacker, "GetBaseDamageMax")
  local attackerAverageTrueDamage = self:CallNumber(attacker, "GetAverageTrueAttackDamage", target)

  self.pendingSequenceFixture = {
    id = fixture.id,
    fixture = fixture,
    attacker = attacker,
    target = target,
    steps = fixture.scenario and fixture.scenario.steps or {},
    stepIndex = 0,
    beforeHealth = beforeHealth,
    targetArmor = targetArmor,
    targetMagicResistance = targetMagicResistance,
    attackerBaseDamageMin = attackerBaseDamageMin,
    attackerBaseDamageMax = attackerBaseDamageMax,
    attackerAverageTrueDamage = attackerAverageTrueDamage,
    trials = self:FixtureTrials(fixture),
    trialIndex = 0,
    observedDamageSamples = {},
    attackCount = 0,
    activeItemLevel = nil,
    activeItemDamageSpecial = nil,
    activeItemCast = 0,
    sequenceDurationSeconds = fixture.scenario and fixture.scenario.durationSeconds,
    expectedAdjusted = fixture.expectedAdjusted
  }
  GameRules:GetGameModeEntity():SetThink("RunNextSequenceTrial", self, "dota_helper_sequence_trial", 0)
  return nil
end

function DotaHelperFixtureRunner:RunNextSequenceTrial()
  local pending = self.pendingSequenceFixture
  if pending == nil then return nil end
  pending.trialIndex = (pending.trialIndex or 0) + 1
  pending.stepIndex = 0
  pending.attackCount = 0
  pending.activeItemLevel = nil
  pending.activeItemDamageSpecial = nil
  pending.activeItemCast = 0
  pending.lastStepType = nil
  if pending.target.SetHealth ~= nil then
    pending.target:SetHealth(pending.beforeHealth)
  end
  GameRules:GetGameModeEntity():SetThink("RunNextSequenceStep", self, "dota_helper_sequence_step", 0)
  return nil
end

function DotaHelperFixtureRunner:RunNextSequenceStep()
  local pending = self.pendingSequenceFixture
  if pending == nil then return nil end

  if pending.lastStepType == "active_item" then
    self:DisableAutoAcquire(pending.attacker)
  end

  pending.stepIndex = pending.stepIndex + 1
  local step = pending.steps[pending.stepIndex]
  if step == nil then
    local scenario = pending.fixture and pending.fixture.scenario or {}
    local delay = scenario.resultDelaySeconds or 1.0
    GameRules:GetGameModeEntity():SetThink("FinishSequenceTrial", self, "dota_helper_sequence_trial", delay)
    return nil
  end

  local stepResult = self:RunSequenceStep(pending.fixture, step, pending.attacker, pending.target)
  pending.attackCount = pending.attackCount + (stepResult.attackCount or 0)
  if stepResult.activeItemLevel ~= nil then pending.activeItemLevel = stepResult.activeItemLevel end
  if stepResult.activeItemDamageSpecial ~= nil then pending.activeItemDamageSpecial = stepResult.activeItemDamageSpecial end
  if stepResult.activeItemCast ~= nil then pending.activeItemCast = stepResult.activeItemCast end
  pending.lastStepType = step.type

  return self:SequenceStepPostDelaySeconds(step)
end

function DotaHelperFixtureRunner:FinishSequenceTrial()
  local pending = self.pendingSequenceFixture
  if pending == nil then return nil end
  local afterHealth = pending.target:GetHealth()
  table.insert(pending.observedDamageSamples, pending.beforeHealth - afterHealth)
  pending.lastAfterHealth = afterHealth
  if pending.trialIndex < pending.trials then
    GameRules:GetGameModeEntity():SetThink("RunNextSequenceTrial", self, "dota_helper_sequence_trial", 0.05)
    return nil
  end
  return self:FinishSequenceFixture()
end

function DotaHelperFixtureRunner:SequenceStepPostDelaySeconds(step)
  if step ~= nil and type(step.postDelaySeconds) == "number" then
    return step.postDelaySeconds
  end
  if step ~= nil and step.type == "active_item" then
    return 0.5
  end
  return 0
end

function DotaHelperFixtureRunner:RunSequenceStep(fixture, step, attacker, target)
  if step.type == "active_item" then
    local activeItemName = self:ItemAbilityName(step.activeItemKey)
    local activeItem = self:FindFirstItem(attacker, { activeItemName })
    local activeItemLevel = self:CallNumber(activeItem, "GetLevel")
    local activeItemDamageSpecial = self:SpecialValue(activeItem, "damage")
    local castItem = self:CastActiveItem(attacker, target, activeItemName)
    return {
      activeItemLevel = activeItemLevel,
      activeItemDamageSpecial = activeItemDamageSpecial,
      activeItemCast = castItem and 1 or 0
    }
  end
  if step.type == "attack_window" then
    if step.forceInvisibilityBreak then
      self:PrepareInvisibilityBreak(attacker, target)
    end
    local attackCount = step.attackCount or 1
    local attackFlagsConfig = step.attackFlags or (fixture.scenario and fixture.scenario.attackFlags) or nil
    for _ = 1, attackCount do
      self:PerformConfiguredAttack(attacker, target, attackFlagsConfig)
    end
    self:DisableAutoAcquire(attacker)
    self:StopUnit(attacker)
    self:StopUnit(target)
    return { attackCount = attackCount }
  end
  return {}
end

function DotaHelperFixtureRunner:FinishSequenceFixture()
  local pending = self.pendingSequenceFixture
  if pending == nil then return nil end
  self.pendingSequenceFixture = nil
  local afterHealth = pending.lastAfterHealth or pending.target:GetHealth()
  local observedDamage = pending.observedDamageSamples[#pending.observedDamageSamples] or (pending.beforeHealth - afterHealth)
  local sampleStats = self:SampleStats(pending.observedDamageSamples)

  self:PrintResult({
    id = pending.id,
    engine = {
      observedDamage = observedDamage,
      targetHealthBefore = pending.beforeHealth,
      targetHealthAfter = afterHealth,
      targetArmor = pending.targetArmor,
      targetMagicResistance = pending.targetMagicResistance,
      attackerBaseDamageMin = pending.attackerBaseDamageMin,
      attackerBaseDamageMax = pending.attackerBaseDamageMax,
      attackerAverageTrueDamage = pending.attackerAverageTrueDamage,
      attackCount = pending.attackCount,
      activeItemLevel = pending.activeItemLevel,
      activeItemDamageSpecial = pending.activeItemDamageSpecial,
      activeItemCast = pending.activeItemCast,
      observedDamageSamples = sampleStats.samples,
      observedDamageMean = sampleStats.mean,
      observedDamageStdev = sampleStats.stdev,
      observedDamageMin = sampleStats.min,
      observedDamageMax = sampleStats.max,
      expectedAdjusted = pending.expectedAdjusted,
      modifiers = { "sequence" }
    }
  })
  self:CleanupFixtureUnits()
  GameRules:GetGameModeEntity():SetThink("RunNextFixture", self, "dota_helper_fixture", 0.2)
  return nil
end

function DotaHelperFixtureRunner:FinishActiveItemFixture()
  local pending = self.pendingActiveItemFixture
  if pending == nil then return nil end
  self.pendingActiveItemFixture = nil
  local afterHealth = pending.target:GetHealth()
  local observedDamage = pending.beforeHealth - afterHealth

  self:PrintResult({
    id = pending.id,
    engine = {
      observedDamage = observedDamage,
      targetHealthBefore = pending.beforeHealth,
      targetHealthAfter = afterHealth,
      targetArmor = pending.targetArmor,
      targetMagicResistance = pending.targetMagicResistance,
      activeItemLevel = pending.activeItemLevel,
      activeItemDamageSpecial = pending.activeItemDamageSpecial,
      activeItemCast = pending.activeItemCast,
      expectedAdjusted = pending.expectedAdjusted,
      modifiers = { "active_item" }
    }
  })
  self:CleanupFixtureUnits()
  GameRules:GetGameModeEntity():SetThink("RunNextFixture", self, "dota_helper_fixture", 0.2)
  return nil
end

function DotaHelperFixtureRunner:CreateFixtureUnit(unitName, team, origin)
  local unit = CreateUnitByName(unitName, origin, true, nil, nil, team)
  if unit == nil then
    error("CreateUnitByName failed for " .. tostring(unitName))
  end
  if self.currentFixtureUnits ~= nil then
    table.insert(self.currentFixtureUnits, unit)
  end
  return unit
end

function DotaHelperFixtureRunner:CleanupFixtureUnits()
  for _, unit in ipairs(self.currentFixtureUnits or {}) do
    if unit ~= nil and UTIL_Remove ~= nil then
      pcall(UTIL_Remove, unit)
    end
  end
  self.currentFixtureUnits = {}
end

function DotaHelperFixtureRunner:DisableAutoAcquire(unit)
  if unit == nil then return end
  if unit.SetIdleAcquire ~= nil then pcall(unit.SetIdleAcquire, unit, false) end
  if unit.SetForceAttackTarget ~= nil then pcall(unit.SetForceAttackTarget, unit, nil) end
end

function DotaHelperFixtureRunner:StopUnit(unit)
  if unit == nil then return end
  if unit.Stop ~= nil then pcall(unit.Stop, unit) end
  if unit.Hold ~= nil then pcall(unit.Hold, unit) end
  if unit.Interrupt ~= nil then pcall(unit.Interrupt, unit) end
end

function DotaHelperFixtureRunner:AttackFlagsFor(config)
  local attackFlags = config or {}
  return {
    useCastAttackOrb = attackFlags.useCastAttackOrb == true,
    processProcs = attackFlags.processProcs == true,
    skipCooldown = attackFlags.skipCooldown ~= false,
    neverMiss = attackFlags.neverMiss ~= false
  }
end

function DotaHelperFixtureRunner:PerformConfiguredAttack(attacker, target, attackFlagsConfig)
  local attackFlags = self:AttackFlagsFor(attackFlagsConfig)
  attacker:PerformAttack(
    target,
    attackFlags.useCastAttackOrb,
    attackFlags.processProcs,
    attackFlags.skipCooldown,
    false,
    false,
    false,
    attackFlags.neverMiss
  )
end

function DotaHelperFixtureRunner:FixtureTrials(fixture)
  local trials = tonumber(fixture and fixture.trials or 1) or 1
  if trials < 1 then return 1 end
  return math.floor(trials)
end

function DotaHelperFixtureRunner:SampleStats(samples)
  local count = #samples
  local sum = 0
  local minValue = nil
  local maxValue = nil
  for _, value in ipairs(samples) do
    sum = sum + value
    if minValue == nil or value < minValue then minValue = value end
    if maxValue == nil or value > maxValue then maxValue = value end
  end
  local mean = count > 0 and sum / count or 0
  local variance = 0
  if count > 1 then
    for _, value in ipairs(samples) do
      variance = variance + ((value - mean) * (value - mean))
    end
    variance = variance / (count - 1)
  end
  return {
    samples = samples,
    mean = mean,
    stdev = math.sqrt(variance),
    min = minValue,
    max = maxValue
  }
end

function DotaHelperFixtureRunner:SetHeroLevel(unit, targetLevel)
  if unit.HeroLevelUp == nil or unit.GetLevel == nil then return end
  while unit:GetLevel() < targetLevel do
    unit:HeroLevelUp(false)
  end
end

function DotaHelperFixtureRunner:SetAbilityLevels(unit, abilityLevels)
  if unit.FindAbilityByName == nil then return end
  for _, entry in ipairs(abilityLevels or {}) do
    local ability = unit:FindAbilityByName(entry.abilityName)
    if ability ~= nil and ability.SetLevel ~= nil then
      ability:SetLevel(entry.level or 1)
    end
  end
end

function DotaHelperFixtureRunner:PrepareTarget(target, targetConfig)
  local health = targetConfig.health or 10000
  if target.SetBaseMaxHealth ~= nil then target:SetBaseMaxHealth(health) end
  if target.SetMaxHealth ~= nil then target:SetMaxHealth(health) end
  if target.SetHealth ~= nil then target:SetHealth(health) end
  self:CalibrateTargetArmor(target, targetConfig.armor)
  if target.SetBaseMagicalResistanceValue ~= nil and targetConfig.magicResistancePercent ~= nil then
    target:SetBaseMagicalResistanceValue(targetConfig.magicResistancePercent)
  end
end

function DotaHelperFixtureRunner:CalibrateTargetArmor(target, desiredArmor)
  if desiredArmor == nil or target.SetPhysicalArmorBaseValue == nil then return end
  target:SetPhysicalArmorBaseValue(0)
  local nonBaseArmor = self:CallNumber(target, "GetPhysicalArmorValue", false) or 0
  target:SetPhysicalArmorBaseValue(desiredArmor - nonBaseArmor)
end

function DotaHelperFixtureRunner:MagicalResistancePercent(target)
  local baseValue = self:CallNumber(target, "GetBaseMagicalResistanceValue")
  if baseValue ~= nil then return baseValue end
  local scriptValue = self:CallNumber(target, "Script_GetMagicalArmorValue", false, nil)
  if scriptValue ~= nil then return scriptValue end
  return self:CallNumber(target, "GetMagicalArmorValue")
end

function DotaHelperFixtureRunner:AddItems(unit, itemAbilityNames)
  for _, itemName in ipairs(itemAbilityNames) do
    if unit.AddItemByName ~= nil then
      unit:AddItemByName(itemName)
    else
      local item = CreateItem(itemName, unit, unit)
      unit:AddItem(item)
    end
  end
end

function DotaHelperFixtureRunner:PrepareInvisibilityBreak(attacker, target)
  local item = self:FindFirstItem(attacker, { "item_invis_sword", "item_silver_edge" })
  if item == nil then return false end
  self:ReadyAbility(item)
  if attacker.CastAbilityNoTarget ~= nil then
    pcall(attacker.CastAbilityNoTarget, attacker, item, -1)
    return true
  end
  if item.OnSpellStart ~= nil then
    pcall(item.OnSpellStart, item)
    return true
  end
  return false
end

function DotaHelperFixtureRunner:InvisibilityBreakDelaySeconds(item)
  local fadeTime = self:SpecialValue(item, "windwalk_fade_time")
  if type(fadeTime) ~= "number" then fadeTime = 0.3 end
  return fadeTime + 0.1
end

function DotaHelperFixtureRunner:CastActiveItem(attacker, target, itemName)
  if itemName == nil then return false end
  local item = self:FindFirstItem(attacker, { itemName })
  if item == nil then return false end
  self:ReadyAbility(item)
  if item.OnSpellStart ~= nil then
    if attacker.SetCursorCastTarget ~= nil then
      pcall(attacker.SetCursorCastTarget, attacker, target)
    end
    local ok = pcall(item.OnSpellStart, item)
    if ok then
      self:DisableAutoAcquire(attacker)
      return true
    end
  end
  if attacker.CastAbilityOnTarget ~= nil then
    local ok = pcall(attacker.CastAbilityOnTarget, attacker, target, item, -1)
    if ok then return true end
  end
  return false
end

function DotaHelperFixtureRunner:FindFirstItem(unit, itemNames)
  if unit.FindItemInInventory == nil then return nil end
  for _, itemName in ipairs(itemNames) do
    local item = unit:FindItemInInventory(itemName)
    if item ~= nil then return item end
  end
  return nil
end

function DotaHelperFixtureRunner:ReadyAbility(ability)
  if ability == nil then return end
  if ability.SetLevel ~= nil and self:CallNumber(ability, "GetLevel") == 0 then ability:SetLevel(1) end
  if ability.EndCooldown ~= nil then ability:EndCooldown() end
  if ability.SetCurrentCharges ~= nil then ability:SetCurrentCharges(1) end
end

function DotaHelperFixtureRunner:SpecialValue(ability, key)
  if ability == nil or ability.GetSpecialValueFor == nil then return nil end
  local ok, value = pcall(ability.GetSpecialValueFor, ability, key)
  if ok and type(value) == "number" then return value end
  return nil
end

function DotaHelperFixtureRunner:ItemAbilityName(itemKey)
  if itemKey == nil then return nil end
  local text = tostring(itemKey)
  if string.sub(text, 1, 5) == "item_" then return text end
  return "item_" .. text
end

function DotaHelperFixtureRunner:CallNumber(unit, methodName, ...)
  local method = unit[methodName]
  if method == nil then return nil end
  local ok, value = pcall(method, unit, ...)
  if not ok then
    ok, value = pcall(method, unit)
  end
  if ok and type(value) == "number" then return value end
  return nil
end

function DotaHelperFixtureRunner:PrintResult(result)
  print(self:EncodeResult(result))
end

function DotaHelperFixtureRunner:EncodeResult(result)
  local engine = result.engine or {}
  local text = '{"id":"' .. self:EscapeJson(result.id) .. '","engine":{"observedDamage":' .. tostring(engine.observedDamage or 0)
  text = self:AppendNumberField(text, "targetHealthBefore", engine.targetHealthBefore)
  text = self:AppendNumberField(text, "targetHealthAfter", engine.targetHealthAfter)
  text = self:AppendNumberField(text, "targetArmor", engine.targetArmor)
  text = self:AppendNumberField(text, "targetMagicResistance", engine.targetMagicResistance)
  text = self:AppendNumberField(text, "attackerDamageMin", engine.attackerDamageMin)
  text = self:AppendNumberField(text, "attackerDamageMax", engine.attackerDamageMax)
  text = self:AppendNumberField(text, "attackerBaseDamageMin", engine.attackerBaseDamageMin)
  text = self:AppendNumberField(text, "attackerBaseDamageMax", engine.attackerBaseDamageMax)
  text = self:AppendNumberField(text, "attackerAverageTrueDamage", engine.attackerAverageTrueDamage)
  text = self:AppendNumberField(text, "attackerAverageTrueDamageNoTarget", engine.attackerAverageTrueDamageNoTarget)
  text = self:AppendNumberField(text, "attackCount", engine.attackCount)
  text = self:AppendNumberField(text, "activeItemLevel", engine.activeItemLevel)
  text = self:AppendNumberField(text, "activeItemDamageSpecial", engine.activeItemDamageSpecial)
  text = self:AppendNumberField(text, "activeItemCast", engine.activeItemCast)
  text = self:AppendNumberArrayField(text, "observedDamageSamples", engine.observedDamageSamples)
  text = self:AppendNumberField(text, "observedDamageMean", engine.observedDamageMean)
  text = self:AppendNumberField(text, "observedDamageStdev", engine.observedDamageStdev)
  text = self:AppendNumberField(text, "observedDamageMin", engine.observedDamageMin)
  text = self:AppendNumberField(text, "observedDamageMax", engine.observedDamageMax)
  text = self:AppendNumberField(text, "expectedAdjusted", engine.expectedAdjusted)
  text = text .. ',"modifiers":' .. self:EncodeStringArray(engine.modifiers or {})
  if engine.error ~= nil then
    text = text .. ',"error":"' .. self:EscapeJson(engine.error) .. '"'
  end
  return text .. '}}'
end

function DotaHelperFixtureRunner:AppendNumberField(text, key, value)
  if type(value) ~= "number" then return text end
  return text .. ',"' .. key .. '":' .. tostring(value)
end

function DotaHelperFixtureRunner:AppendNumberArrayField(text, key, values)
  if type(values) ~= "table" then return text end
  local parts = {}
  for _, value in ipairs(values) do
    if type(value) == "number" then
      table.insert(parts, tostring(value))
    end
  end
  return text .. ',"' .. key .. '":[' .. table.concat(parts, ',') .. ']'
end

function DotaHelperFixtureRunner:EncodeStringArray(values)
  local parts = {}
  for _, value in ipairs(values) do
    table.insert(parts, '"' .. self:EscapeJson(value) .. '"')
  end
  return '[' .. table.concat(parts, ',') .. ']'
end

function DotaHelperFixtureRunner:EscapeJson(value)
  local text = tostring(value or "")
  text = string.gsub(text, "\\", "\\\\")
  text = string.gsub(text, '"', '\\"')
  text = string.gsub(text, "\n", "\\n")
  return text
end

return DotaHelperFixtureRunner
