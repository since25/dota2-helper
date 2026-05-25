# Dota Engine Magic Resistance Calibration

Date: 2026-05-25

## Result

The local Dota Lua verifier keeps fixture `target.magicResistancePercent` in `0-100` percentage units.

Real probe evidence:

```json
{
  "id": "magic_resistance_50_dagon_probe",
  "engine": {
    "observedDamage": 200,
    "targetMagicResistance": 50,
    "activeItemDamageSpecial": 400,
    "expectedAdjusted": 200
  }
}
```

Interpretation:

- `SetBaseMagicalResistanceValue(50)` produced an engine-readable target resistance of `50`.
- Dagon's `400` magical damage was reduced to `200`.
- The verifier should not divide `magicResistancePercent` by `100` before calling `SetBaseMagicalResistanceValue`.

## Verification Command

```bash
npm run engine:compare -- \
  test-runs/dota-engine-verification/magic-resistance-50-fixture.json \
  test-runs/dota-engine-verification/magic-resistance-50-engine-result.json
```

The comparer reported:

```json
{
  "expected": 200,
  "observed": 200,
  "magicResistanceCheck": {
    "expected": 50,
    "observed": 50,
    "delta": 0,
    "pass": true
  },
  "pass": true
}
```
