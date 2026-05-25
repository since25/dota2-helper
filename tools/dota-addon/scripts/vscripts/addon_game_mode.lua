if DotaHelperFixtureRunner == nil then
  DotaHelperFixtureRunner = require("dota_helper_fixture_runner")
end

function Activate()
  GameRules.DotaHelperFixtureRunner = DotaHelperFixtureRunner()
  GameRules.DotaHelperFixtureRunner:InitGameMode()
end
