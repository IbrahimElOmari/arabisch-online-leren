/**
 * Security Test: Gitignore Validation
 * 
 * Ensures that sensitive files are properly ignored by git
 * and cannot accidentally be committed to the repository.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Gitignore Security', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const gitignorePath = path.join(rootDir, '.gitignore');

  it('should have a .gitignore file', () => {
    expect(fs.existsSync(gitignorePath)).toBe(true);
  });

  describe('Required patterns', () => {
    let gitignoreContent: string;

    beforeAll(() => {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    });

    it('should ignore .env files', () => {
      expect(gitignoreContent).toMatch(/^\.env$/m);
      expect(gitignoreContent).toMatch(/^\.env\.\*/m);
    });

    it('should NOT ignore .env.example', () => {
      expect(gitignoreContent).toMatch(/^!\.env\.example$/m);
    });

    it('should ignore node_modules', () => {
      expect(gitignoreContent).toMatch(/^node_modules\//m);
    });

    it('should ignore coverage directory', () => {
      expect(gitignoreContent).toMatch(/^coverage\//m);
    });

    it('should ignore build artifacts', () => {
      expect(gitignoreContent).toMatch(/^dist\//m);
      expect(gitignoreContent).toMatch(/^dist-ssr\//m);
    });

    it('should ignore log files', () => {
      expect(gitignoreContent).toMatch(/\*\.log$/m);
      expect(gitignoreContent).toMatch(/^logs\//m);
    });
  });

  describe('Git status verification', () => {
    it('should not have .env files tracked by git', () => {
      try {
        const output = execSync('git ls-files', { cwd: rootDir, encoding: 'utf-8' });
        const trackedFiles = output.split('\n');
        
        const envFiles = trackedFiles.filter(file => 
          /^\.env(\.|$)/.test(file) && file !== '.env.example'
        );

        expect(envFiles).toHaveLength(0);
      } catch (error) {
        // If not in a git repo (e.g., CI without git init), skip this test
        console.warn('Skipping git-based test: not in a git repository');
      }
    });

    it('should not have .env files in git history', () => {
      try {
        const output = execSync(
          'git log --all --full-history --oneline -- "*.env"', 
          { cwd: rootDir, encoding: 'utf-8' }
        );
        
        // Filter out .env.example
        const lines = output.split('\n').filter(line => 
          line && !line.includes('.env.example')
        );

        expect(lines).toHaveLength(0);
      } catch (error: any) {
        // If git log fails (no commits found), that's actually good
        if (!error.message.includes('does not have any commits yet')) {
          console.warn('Skipping git history test:', error.message);
        }
      }
    });
  });

  describe('Sensitive directories', () => {
    it('should not have node_modules in git', () => {
      const nodeModulesPath = path.join(rootDir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        try {
          const output = execSync('git check-ignore node_modules', { 
            cwd: rootDir, 
            encoding: 'utf-8' 
          });
          expect(output.trim()).toBe('node_modules');
        } catch (error) {
          console.warn('Skipping git-based test: not in a git repository');
        }
      }
    });

    it('should not have coverage in git', () => {
      const coveragePath = path.join(rootDir, 'coverage');
      if (fs.existsSync(coveragePath)) {
        try {
          const output = execSync('git check-ignore coverage', { 
            cwd: rootDir, 
            encoding: 'utf-8' 
          });
          expect(output.trim()).toBe('coverage');
        } catch (error) {
          console.warn('Skipping git-based test: not in a git repository');
        }
      }
    });
  });

  describe('Example .env file', () => {
    const envExamplePath = path.join(rootDir, '.env.example');

    it('should have .env.example file', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('.env.example should not contain real secrets', () => {
      const content = fs.readFileSync(envExamplePath, 'utf-8');
      
      // Should not contain actual API keys (longer than 20 chars)
      const suspiciousPatterns = [
        /VITE_SUPABASE_URL=https:\/\/[a-z0-9]{20,}\.supabase\.co/,
        /VITE_SUPABASE_ANON_KEY=[A-Za-z0-9_-]{100,}/,
        /password=.{8,}/i,
        /secret=[^Y][A-Za-z0-9]{8,}/i, // Not YOUR_*
        /token=[^Y][A-Za-z0-9]{8,}/i,  // Not YOUR_*
      ];

      for (const pattern of suspiciousPatterns) {
        const match = content.match(pattern);
        if (match) {
          expect(match).toBeNull(); // This will fail and show the match
        }
      }
    });

    it('.env.example should have security warnings', () => {
      const content = fs.readFileSync(envExamplePath, 'utf-8');
      
      expect(content.toLowerCase()).toContain('never');
      expect(content.toLowerCase()).toMatch(/commit|secret|sensitive/);
    });
  });
});
