import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const startedAt = performance.now();

async function tryImportPackage(packageName) {
  try {
    const mod = await import(packageName);
    return { ok: true, mod };
  } catch (error) {
    return { ok: false, error };
  }
}

function inspectModule(mod) {
  const keys = Object.keys(mod || {}).sort();
  const defaultKeys = mod?.default && typeof mod.default === 'object'
    ? Object.keys(mod.default).sort()
    : [];
  return { keys, defaultKeys };
}

function writeOutput(payload) {
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(`# dota2-datawrapper probe\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`);
}

const result = await tryImportPackage('dota2-datawrapper');
const payload = {
  packageName: 'dota2-datawrapper',
  status: result.ok ? 'available' : 'missing',
  durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
  findings: [],
  samples: {
    module: null,
    hero: null,
    item: null,
    ability: null,
    patch: null
  }
};

if (!result.ok) {
  payload.findings.push({
    level: 'blocking',
    message: result.error.message
  });
  writeOutput(payload);
  process.exit(0);
}

payload.samples.module = inspectModule(result.mod);
payload.findings.push({
  level: 'info',
  message: 'Package imported successfully. Use module keys to design the experimental provider.'
});

const artifactPath = path.join(process.cwd(), 'test-runs', `${new Date().toISOString().replace(/[:.]/g, '-')}-datawrapper-probe.json`);
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`);
payload.artifactPath = artifactPath;

writeOutput(payload);
