if DotaHelperFixtureRunner == nil then
  DotaHelperFixtureRunner = class({})
end

local hasGeneratedFixture, GeneratedFixture = pcall(require, "generated.dota_helper_fixture")

function DotaHelperFixtureRunner:InitGameMode()
  print("[dota-helper] fixture runner initialized")
  if hasGeneratedFixture and GeneratedFixture ~= nil then
    self.fixture = GeneratedFixture
    GameRules:GetGameModeEntity():SetThink("RunFixture", self, "dota_helper_fixture", 1.0)
  else
    GameRules:GetGameModeEntity():SetThink("RunSmokeFixture", self, "dota_helper_fixture_smoke", 1.0)
  end
end

function DotaHelperFixtureRunner:RunSmokeFixture()
  print("[dota-helper] smoke fixture ready")
  print('{"id":"smoke","engine":{"observedDamage":0,"modifiers":[]}}')
  return nil
end

function DotaHelperFixtureRunner:RunFixture()
  print("[dota-helper] fixture loaded: " .. tostring(self.fixture.id))
  local ok, result = pcall(function()
    return self:RunConfiguredFixture(self.fixture)
  end)
  if not ok then
    self:PrintResult({
      id = self.fixture.id,
      engine = {
        observedDamage = 0,
        modifiers = {},
        error = tostring(result)
      }
    })
    return nil
  end
  self:PrintResult(result)
  return nil
end

function DotaHelperFixtureRunner:RunConfiguredFixture(fixture)
  if fixture.scenario ~= nil and fixture.scenario.type == "attack_window" then
    return self:RunAttackWindowFixture(fixture)
  end
  if fixture.scenario ~= nil and fixture.scenario.type == "active_item" then
    return self:RunActiveItemFixture(fixture)
  end
  return {
    id = fixture.id,
    engine = {
      observedDamage = 0,
      modifiers = { "unsupported_scenario" }
    }
  }
end

function DotaHelperFixtureRunner:RunAttackWindowFixture(fixture)
  local attacker = self:CreateFixtureUnit(fixture.attackerUnitName, DOTA_TEAM_GOODGUYS, Vector(0, 0, 256))
  local target = self:CreateFixtureUnit(fixture.targetUnitName, DOTA_TEAM_BADGUYS, Vector(300, 0, 256))

  self:SetHeroLevel(attacker, fixture.heroLevel or 1)
  self:SetHeroLevel(target, fixture.target and fixture.target.level or 1)
  self:PrepareTarget(target, fixture.target or {})
  self:AddItems(attacker, fixture.itemAbilityNames or {})
  if fixture.scenario ~= nil and fixture.scenario.forceInvisibilityBreak then
    self:PrepareInvisibilityBreak(attacker, target)
  end

  local beforeHealth = target:GetHealth()
  local targetArmor = self:CallNumber(target, "GetPhysicalArmorValue", false)
  local attackerDamageMin = self:CallNumber(attacker, "GetDamageMin")
  local attackerDamageMax = self:CallNumber(attacker, "GetDamageMax")
  local attackerBaseDamageMin = self:CallNumber(attacker, "GetBaseDamageMin")
  local attackerBaseDamageMax = self:CallNumber(attacker, "GetBaseDamageMax")
  local attackerAverageTrueDamage = self:CallNumber(attacker, "GetAverageTrueAttackDamage", target)
  local attackerAverageTrueDamageNoTarget = self:CallNumber(attacker, "GetAverageTrueAttackDamage")
  local attackCount = fixture.scenario and fixture.scenario.attackCount or 1
  for _ = 1, attackCount do
    attacker:PerformAttack(target, true, true, true, false, false, false, true)
  end
  local afterHealth = target:GetHealth()
  local observedDamage = beforeHealth - afterHealth

  return {
    id = fixture.id,
    engine = {
      observedDamage = observedDamage,
      targetHealthBefore = beforeHealth,
      targetHealthAfter = afterHealth,
      targetArmor = targetArmor,
      attackerDamageMin = attackerDamageMin,
      attackerDamageMax = attackerDamageMax,
      attackerBaseDamageMin = attackerBaseDamageMin,
      attackerBaseDamageMax = attackerBaseDamageMax,
      attackerAverageTrueDamage = attackerAverageTrueDamage,
      attackerAverageTrueDamageNoTarget = attackerAverageTrueDamageNoTarget,
      attackCount = attackCount,
      expectedAdjusted = fixture.expectedAdjusted,
      modifiers = { "attack_window" }
    }
  }
end

function DotaHelperFixtureRunner:RunActiveItemFixture(fixture)
  local attacker = self:CreateFixtureUnit(fixture.attackerUnitName, DOTA_TEAM_GOODGUYS, Vector(0, 0, 256))
  local target = self:CreateFixtureUnit(fixture.targetUnitName, DOTA_TEAM_BADGUYS, Vector(300, 0, 256))

  self:SetHeroLevel(attacker, fixture.heroLevel or 1)
  self:SetHeroLevel(target, fixture.target and fixture.target.level or 1)
  self:PrepareTarget(target, fixture.target or {})
  self:AddItems(attacker, fixture.itemAbilityNames or {})

  local beforeHealth = target:GetHealth()
  local targetArmor = self:CallNumber(target, "GetPhysicalArmorValue", false)
  local activeItemName = self:ItemAbilityName(fixture.scenario and fixture.scenario.activeItemKey)
  local castItem = self:CastActiveItem(attacker, target, activeItemName)
  local afterHealth = target:GetHealth()
  local observedDamage = beforeHealth - afterHealth

  return {
    id = fixture.id,
    engine = {
      observedDamage = observedDamage,
      targetHealthBefore = beforeHealth,
      targetHealthAfter = afterHealth,
      targetArmor = targetArmor,
      activeItemCast = castItem and 1 or 0,
      expectedAdjusted = fixture.expectedAdjusted,
      modifiers = { "active_item" }
    }
  }
end

function DotaHelperFixtureRunner:CreateFixtureUnit(unitName, team, origin)
  local unit = CreateUnitByName(unitName, origin, true, nil, nil, team)
  if unit == nil then
    error("CreateUnitByName failed for " .. tostring(unitName))
  end
  return unit
end

function DotaHelperFixtureRunner:SetHeroLevel(unit, targetLevel)
  if unit.HeroLevelUp == nil or unit.GetLevel == nil then return end
  while unit:GetLevel() < targetLevel do
    unit:HeroLevelUp(false)
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

function DotaHelperFixtureRunner:CastActiveItem(attacker, target, itemName)
  if itemName == nil then return false end
  local item = self:FindFirstItem(attacker, { itemName })
  if item == nil then return false end
  self:ReadyAbility(item)
  if attacker.CastAbilityOnTarget ~= nil then
    local ok = pcall(attacker.CastAbilityOnTarget, attacker, target, item, -1)
    if ok then return true end
  end
  if item.OnSpellStart ~= nil then
    if attacker.SetCursorCastTarget ~= nil then
      pcall(attacker.SetCursorCastTarget, attacker, target)
    end
    local ok = pcall(item.OnSpellStart, item)
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
  if ability.EndCooldown ~= nil then ability:EndCooldown() end
  if ability.SetCurrentCharges ~= nil then ability:SetCurrentCharges(1) end
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
  text = self:AppendNumberField(text, "attackerDamageMin", engine.attackerDamageMin)
  text = self:AppendNumberField(text, "attackerDamageMax", engine.attackerDamageMax)
  text = self:AppendNumberField(text, "attackerBaseDamageMin", engine.attackerBaseDamageMin)
  text = self:AppendNumberField(text, "attackerBaseDamageMax", engine.attackerBaseDamageMax)
  text = self:AppendNumberField(text, "attackerAverageTrueDamage", engine.attackerAverageTrueDamage)
  text = self:AppendNumberField(text, "attackerAverageTrueDamageNoTarget", engine.attackerAverageTrueDamageNoTarget)
  text = self:AppendNumberField(text, "attackCount", engine.attackCount)
  text = self:AppendNumberField(text, "activeItemCast", engine.activeItemCast)
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
