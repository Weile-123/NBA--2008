import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { buildSync } from 'esbuild';

const tests = readdirSync(new URL('../tests/', import.meta.url))
  .filter((name) => name.endsWith('.test.ts'))
  .sort();

const temporaryRoot = resolve(process.cwd());
const temporaryDirectory = mkdtempSync(join(temporaryRoot, '.test-run-'));

try {
  const outputFile = join(temporaryDirectory, 'tests.cjs');
  const imports = tests
    .map((testFile) => `import ${JSON.stringify(resolve('tests', testFile))};`)
    .join('\n');

  buildSync({
    stdin: {
      contents: imports,
      loader: 'ts',
      resolveDir: process.cwd(),
      sourcefile: 'tests-entry.ts',
    },
    outfile: outputFile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    sourcemap: 'inline',
    logLevel: 'silent',
  });

  const result = spawnSync(process.execPath, [outputFile], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  const resolvedTemporaryDirectory = resolve(temporaryDirectory);
  const isSafeTemporaryDirectory =
    isAbsolute(resolvedTemporaryDirectory) &&
    resolvedTemporaryDirectory.startsWith(`${temporaryRoot}${sep}`) &&
    resolvedTemporaryDirectory !== temporaryRoot;

  if (isSafeTemporaryDirectory) {
    rmSync(resolvedTemporaryDirectory, { recursive: true, force: true });
  }
}
