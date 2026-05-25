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

  local beforeHealth = target:GetHealth()
  attacker:PerformAttack(target, true, true, true, false, false, false, true)
  local afterHealth = target:GetHealth()
  local observedDamage = beforeHealth - afterHealth

  return {
    id = fixture.id,
    engine = {
      observedDamage = observedDamage,
      modifiers = { "attack_window" }
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
  if target.SetBaseMaxHealth ~= nil then target:SetBaseMaxHealth(10000) end
  if target.SetMaxHealth ~= nil then target:SetMaxHealth(10000) end
  if target.SetHealth ~= nil then target:SetHealth(10000) end
  if target.SetPhysicalArmorBaseValue ~= nil and targetConfig.armor ~= nil then
    target:SetPhysicalArmorBaseValue(targetConfig.armor)
  end
  if target.SetBaseMagicalResistanceValue ~= nil and targetConfig.magicResistancePercent ~= nil then
    target:SetBaseMagicalResistanceValue(targetConfig.magicResistancePercent)
  end
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

function DotaHelperFixtureRunner:PrintResult(result)
  print(self:EncodeResult(result))
end

function DotaHelperFixtureRunner:EncodeResult(result)
  local engine = result.engine or {}
  local text = '{"id":"' .. self:EscapeJson(result.id) .. '","engine":{"observedDamage":' .. tostring(engine.observedDamage or 0)
  text = text .. ',"modifiers":' .. self:EncodeStringArray(engine.modifiers or {})
  if engine.error ~= nil then
    text = text .. ',"error":"' .. self:EscapeJson(engine.error) .. '"'
  end
  return text .. '}}'
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
