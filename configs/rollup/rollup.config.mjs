import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { generatePackageJson } from './plugins/generate-package-json.mjs';

const config = {
  input: 'src/index.ts',
  external: ['rxjs'],
  output: [
    {
      file: 'dist/esm/index.js',
      format: 'es',
      sourcemap: true,
      plugins: [
        generatePackageJson({
          type: 'module',
          sideEffects: false,
        }),
      ],
    },
    {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      plugins: [
        generatePackageJson({
          type: 'commonjs',
          sideEffects: false,
        }),
      ],
    },
    {
      file: 'dist/umd/index.js',
      format: 'umd',
      name: 'rxjsPoll',
      sourcemap: true,
      globals: {
        rxjs: 'rxjs',
      },
    },
    {
      file: 'dist/umd/index.min.js',
      format: 'umd',
      name: 'rxjsPoll',
      sourcemap: true,
      globals: {
        rxjs: 'rxjs',
      },
      plugins: [terser()],
    },
  ],
  plugins: [
    typescript({
      tsconfig: './configs/ts/tsconfig.build.json',
      declaration: false,
      declarationMap: false,
      outputToFilesystem: true,
    }),
  ],
};

export default config;
