/**
 * i18n Key Synchronization Script
 * 
 * This script ensures all language files have the same keys.
 * Run with: npx tsx scripts/sync-i18n.ts
 * 
 * Usage in CI:
 * - Add to package.json: "i18n:check": "tsx scripts/sync-i18n.ts --check"
 * - Add to CI pipeline to fail on missing translations
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(process.cwd(), 'src/locales');
const SUPPORTED_LANGUAGES = ['nl', 'en', 'ar', 'fr', 'de', 'tr', 'ur'];
const BASE_LANGUAGE = 'nl';

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

/**
 * Get all keys from a translation object as dot-notation paths
 */
function getKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...getKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Load all translation files for a language
 */
function loadLanguageFiles(lang: string): Record<string, TranslationObject> {
  const langDir = path.join(LOCALES_DIR, lang);
  const files: Record<string, TranslationObject> = {};
  
  if (!fs.existsSync(langDir)) {
    return files;
  }
  
  const jsonFiles = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));
  
  for (const file of jsonFiles) {
    const content = fs.readFileSync(path.join(langDir, file), 'utf-8');
    files[file] = JSON.parse(content);
  }
  
  return files;
}

/**
 * Check for missing keys across all languages
 */
function checkMissingKeys(): { lang: string; file: string; missingKeys: string[] }[] {
  const baseFiles = loadLanguageFiles(BASE_LANGUAGE);
  const issues: { lang: string; file: string; missingKeys: string[] }[] = [];
  
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === BASE_LANGUAGE) continue;
    
    const langFiles = loadLanguageFiles(lang);
    
    for (const [fileName, baseContent] of Object.entries(baseFiles)) {
      const langContent = langFiles[fileName];
      
      if (!langContent) {
        // Entire file missing
        issues.push({
          lang,
          file: fileName,
          missingKeys: ['[ENTIRE FILE MISSING]'],
        });
        continue;
      }
      
      const baseKeys = getKeys(baseContent);
      const langKeys = getKeys(langContent);
      const missingKeys = baseKeys.filter(k => !langKeys.includes(k));
      
      if (missingKeys.length > 0) {
        issues.push({ lang, file: fileName, missingKeys });
      }
    }
  }
  
  return issues;
}

/**
 * Generate missing keys report
 */
function generateReport(issues: ReturnType<typeof checkMissingKeys>): string {
  if (issues.length === 0) {
    return '✅ All translation files are synchronized!';
  }
  
  let report = '❌ Missing translations found:\n\n';
  
  for (const issue of issues) {
    report += `Language: ${issue.lang}\n`;
    report += `File: ${issue.file}\n`;
    report += `Missing keys:\n`;
    for (const key of issue.missingKeys) {
      report += `  - ${key}\n`;
    }
    report += '\n';
  }
  
  return report;
}

/**
 * Create missing language directories and files
 */
function createMissingFiles(): void {
  const baseFiles = loadLanguageFiles(BASE_LANGUAGE);
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const langDir = path.join(LOCALES_DIR, lang);
    
    // Create language directory if missing
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
      console.log(`Created directory: ${langDir}`);
    }
    
    // Create missing files with base content (marked for translation)
    for (const [fileName, baseContent] of Object.entries(baseFiles)) {
      const filePath = path.join(langDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        const markedContent = markForTranslation(baseContent, lang);
        fs.writeFileSync(filePath, JSON.stringify(markedContent, null, 2));
        console.log(`Created file: ${filePath}`);
      }
    }
  }
}

/**
 * Mark content for translation by prefixing values
 */
function markForTranslation(obj: TranslationObject, lang: string): TranslationObject {
  const result: TranslationObject = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = markForTranslation(value as TranslationObject, lang);
    } else {
      result[key] = `[${lang.toUpperCase()}] ${value}`;
    }
  }
  
  return result;
}

// Main execution
const isCheck = process.argv.includes('--check');
const isCreate = process.argv.includes('--create');

if (isCreate) {
  console.log('Creating missing translation files...\n');
  createMissingFiles();
  console.log('\nDone! Review and translate the created files.');
} else {
  const issues = checkMissingKeys();
  const report = generateReport(issues);
  console.log(report);
  
  if (isCheck && issues.length > 0) {
    process.exit(1);
  }
}

export { checkMissingKeys, generateReport, createMissingFiles };
