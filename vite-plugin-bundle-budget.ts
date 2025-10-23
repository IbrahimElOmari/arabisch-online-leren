import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

interface BundleBudget {
  main: number; // in KB
  chunk: number; // in KB
}

export function bundleBudgetPlugin(budget: BundleBudget): Plugin {
  return {
    name: 'vite-plugin-bundle-budget',
    apply: 'build',
    closeBundle: async () => {
      const distPath = path.resolve(process.cwd(), 'dist/assets');
      
      if (!fs.existsSync(distPath)) {
        console.warn('⚠️ Dist folder not found, skipping bundle budget check');
        return;
      }

      const files = fs.readdirSync(distPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));

      let mainSize = 0;
      let maxChunkSize = 0;
      const chunks: Array<{ name: string; size: number; gzipSize: number }> = [];

      for (const file of jsFiles) {
        const filePath = path.join(distPath, file);
        const content = fs.readFileSync(filePath);
        const size = content.length;
        const gzipBuffer = await gzipAsync(content);
        const gzipSize = gzipBuffer.length;

        chunks.push({ name: file, size, gzipSize });

        // Main bundle typically starts with 'index'
        if (file.startsWith('index')) {
          mainSize = gzipSize;
        }

        if (gzipSize > maxChunkSize) {
          maxChunkSize = gzipSize;
        }
      }

      // Convert budgets from KB to bytes
      const mainBudget = budget.main * 1024;
      const chunkBudget = budget.chunk * 1024;

      console.log('\n📊 Bundle Budget Report:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      chunks.forEach(chunk => {
        const sizeKB = (chunk.size / 1024).toFixed(2);
        const gzipKB = (chunk.gzipSize / 1024).toFixed(2);
        console.log(`  ${chunk.name}: ${gzipKB} KB (gzip) / ${sizeKB} KB (raw)`);
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      let failed = false;

      if (mainSize > mainBudget) {
        console.error(`❌ Main bundle exceeds budget: ${(mainSize / 1024).toFixed(2)} KB > ${budget.main} KB`);
        failed = true;
      } else {
        console.log(`✅ Main bundle: ${(mainSize / 1024).toFixed(2)} KB / ${budget.main} KB`);
      }

      if (maxChunkSize > chunkBudget) {
        console.error(`❌ Largest chunk exceeds budget: ${(maxChunkSize / 1024).toFixed(2)} KB > ${budget.chunk} KB`);
        failed = true;
      } else {
        console.log(`✅ Largest chunk: ${(maxChunkSize / 1024).toFixed(2)} KB / ${budget.chunk} KB`);
      }

      if (failed) {
        throw new Error('Bundle budget exceeded! Build failed.');
      }

      console.log('✅ All bundles within budget\n');
    },
  };
}
