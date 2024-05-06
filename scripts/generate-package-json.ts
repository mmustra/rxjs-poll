import { writeJSON } from 'fs-extra';
import { resolve } from 'path';

const modules = [
  { name: 'esm', type: 'module' },
  { name: 'cjs', type: 'commonjs' },
];

modules.forEach((module) => {
  const { name, ...options } = module;
  const packageJson = {
    ...options,
    sideEffects: false,
  };

  const packageJsonPath = resolve(process.cwd(), `./dist/${name}/package.json`);

  console.log(`Generating package.json for "${name}"`);

  /* eslint-disable @typescript-eslint/no-floating-promises */
  writeJSON(packageJsonPath, packageJson, { spaces: 2 });
});
