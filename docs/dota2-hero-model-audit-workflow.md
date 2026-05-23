# Dota 2 Hero Damage Model Audit Workflow

This document defines the next-stage workflow for auditing all hero damage models after the semantic layer is in place. The goal is to make every curated number explainable before it can be used by the calculator or LLM prompt.

## Per-Hero Review Checklist

1. Confirm visible abilities from provider data.
2. Identify direct damage fields.
3. Identify sustained, wave, tick, attack, chance, and conditional damage.
4. Identify offensive modifiers such as armor reduction, magic resistance reduction, spell amp, damage amp, attack speed, and crit.
5. Identify defensive, control, resource, mobility, range, area, summon, and condition fields.
6. Mark unmodeled mechanics as `unsupported` with a concrete reason.
7. Add semantic tests for every curated entry.
8. Run semantic audit for the hero.
9. Inspect the prompt line for the hero and confirm Chinese labels are clear.

## Batch Groups

Use mechanism clusters instead of alphabetical order. Each batch should be small enough to review with tests, semantic audit, calculator output, and prompt output before moving to the next batch.

### Batch A: Simple Nukes And Direct-Damage Supports

Focus on heroes whose damage model is mostly fixed instant damage. These heroes establish the baseline for direct damage fields, damage type labels, mana and cooldown context, and level spike formatting.

### Batch B: Sustained And Tick Damage

Focus on damage-over-time, tick, channel, aura, duration, and partial-active-duration mechanics. These heroes should use active duration controls instead of assuming every sustained ability always deals full theoretical damage.

### Batch C: Attack Modifiers And Procs

Focus on attack modifiers, bashes, crits, cleave-like attacks, and attack-count procs. These models must expose required inputs such as attack count, hero attack damage, proc chance, and active attack window.

### Batch D: Resistance And Amplification Modifiers

Focus on armor reduction, magic resistance reduction, damage amplification, spell amplification, and other values that modify later damage. These values must stay out of fixed raw damage and appear as modifier references.

### Batch E: Summons And Unit Proxies

Focus on summons, wards, illusions, dominated units, and unit proxy damage. These models must expose summon count, summon attack damage, active duration, attack interval, and survival assumptions.

### Batch F: Percent And Scaling Damage

Focus on percent-health, missing-health, missing-mana, attribute-scaling, distance-scaling, and stack-scaling damage. These models must declare condition inputs before calculator totals or LLM context can use them.

### Batch G: Transform And Copied-Skill Edge Cases

Focus on transformations, copied skills, stolen spells, shapeshifts, and other cross-hero mechanics. These are lower priority for first-pass totals unless the current hero naturally depends on copied ability data.

### Batch H: Remaining Utility And Low-Damage Heroes

Finish the remaining heroes with low direct damage or mostly utility mechanics. Non-damage fields still need semantics so the prompt can explain why they are not counted as burst damage.

## Required Commands

Run semantic audit after each hero:

```bash
node scripts/semantic-audit.js --hero "Hero Name"
```

Run coverage before ending a batch:

```bash
npm run damage:coverage
```

Run the full test suite before moving to the next batch:

```bash
npm test
```

## Coverage Gates

The coverage report must expose:

- total heroes;
- curated heroes;
- curated abilities;
- semantic-complete abilities;
- unsupported abilities with reason;
- inferred fallback abilities.

For a reviewed batch, the expected direction is:

- no curated entry missing semantic metadata;
- no unsupported entry without a reason;
- no non-damage modifier counted as raw fixed damage;
- no percent-like field routed as flat damage unless the model explicitly explains why;
- no prompt line using `Unknown` for a non-damage semantic reference.
