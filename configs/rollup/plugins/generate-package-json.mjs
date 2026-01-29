import fsExtra from 'fs-extra';
import { dirname, resolve } from 'path';

const { ensureDir, writeFile, readJson } = fsExtra;

/**
 * Plugin to generate package.json files for each output format
 * @param {Object|Function} packageJsonContents - Contents to write to package.json, or a callback function
 *   that receives the existing package.json (if any) and returns the new/modified package.json
 * @returns {import('rollup').Plugin} Rollup plugin
 */
export function generatePackageJson(packageJsonContents) {
  return {
    name: 'generate-package-json',
    async writeBundle(outputOptions) {
      if (!packageJsonContents) {
        return;
      }

      const outputFile = outputOptions.file;
      const outputDir = outputOptions.dir;

      if (!outputFile && !outputDir) {
        return;
      }

      const targetDir = outputDir || dirname(outputFile);
      const packageJsonPath = resolve(process.cwd(), targetDir, 'package.json');
      const packageJsonDir = dirname(packageJsonPath);

      try {
        await ensureDir(packageJsonDir);

        let finalPackageJson;

        if (typeof packageJsonContents === 'function') {
          const rootPackageJsonPath = resolve(process.cwd(), 'package.json');
          let existingPackageJson;

          try {
            existingPackageJson = await readJson(rootPackageJsonPath);
          } catch (error) {
            throw new Error(`package.json not found at "${rootPackageJsonPath}"!`);
          }

          finalPackageJson = await packageJsonContents(existingPackageJson);
        } else {
          finalPackageJson = packageJsonContents;
        }

        if (!finalPackageJson || typeof finalPackageJson !== 'object') {
          throw new Error('generatePackageJson must return an object');
        }

        const content = JSON.stringify(finalPackageJson, null, 2) + '\n';
        await writeFile(packageJsonPath, content, 'utf8');

        const formatName = outputOptions.format || 'unknown';
        console.log(`Generating package.json for "${formatName}" format`);
      } catch (error) {
        console.error(`Failed to generate package.json:`, error);
        throw error;
      }
    },
  };
}
