if DotaHelperFixtureRunner == nil then
  DotaHelperFixtureRunner = class({})
end

function DotaHelperFixtureRunner:InitGameMode()
  print("[dota-helper] fixture runner initialized")
  GameRules:GetGameModeEntity():SetThink("RunSmokeFixture", self, "dota_helper_fixture_smoke", 1.0)
end

function DotaHelperFixtureRunner:RunSmokeFixture()
  print("[dota-helper] smoke fixture ready")
  print('{"id":"smoke","engine":{"observedDamage":0,"modifiers":[]}}')
  return nil
end

return DotaHelperFixtureRunner
