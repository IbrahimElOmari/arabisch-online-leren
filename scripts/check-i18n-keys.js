#!/usr/bin/env node

/**
 * I18N Keys Validation Script (A2)
 * Checks for:
 * 1. Missing keys across language files
 * 2. Unused keys in code
 * 3. Consistency across nl/en/ar
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const SRC_DIR = path.join(__dirname, '../src');

// Load translation files
const nl = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'nl.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8'));
const ar = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'ar.json'), 'utf-8'));

// Get all keys from an object (nested)
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Get all used keys in source code
function getUsedKeys(dir) {
  const usedKeys = new Set();
  const tRegex = /t\(['"`]([^'"`]+)['"`]/g;
  
  function scanDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        scanDir(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        let match;
        while ((match = tRegex.exec(content)) !== null) {
          usedKeys.add(match[1]);
        }
      }
    }
  }
  
  scanDir(dir);
  return Array.from(usedKeys);
}

// Main validation
const nlKeys = getAllKeys(nl);
const enKeys = getAllKeys(en);
const arKeys = getAllKeys(ar);
const usedKeys = getUsedKeys(SRC_DIR);

let hasErrors = false;

// Check for missing keys
const missingInEn = nlKeys.filter(k => !enKeys.includes(k));
const missingInAr = nlKeys.filter(k => !arKeys.includes(k));

if (missingInEn.length > 0) {
  console.error('❌ Missing keys in en.json:');
  missingInEn.forEach(k => console.error(`   - ${k}`));
  hasErrors = true;
}

if (missingInAr.length > 0) {
  console.error('❌ Missing keys in ar.json:');
  missingInAr.forEach(k => console.error(`   - ${k}`));
  hasErrors = true;
}

// Check for unused keys
const unusedKeys = nlKeys.filter(k => !usedKeys.includes(k));
if (unusedKeys.length > 0) {
  console.warn('⚠️  Unused translation keys:');
  unusedKeys.forEach(k => console.warn(`   - ${k}`));
}

// Check for keys used but not defined
const undefinedKeys = usedKeys.filter(k => !nlKeys.includes(k));
if (undefinedKeys.length > 0) {
  console.error('❌ Keys used in code but not defined:');
  undefinedKeys.forEach(k => console.error(`   - ${k}`));
  hasErrors = true;
}

if (!hasErrors) {
  console.log('✅ All i18n keys are valid!');
  console.log(`   📊 Total keys: ${nlKeys.length}`);
  console.log(`   📊 Used keys: ${usedKeys.length}`);
  console.log(`   📊 Unused keys: ${unusedKeys.length}`);
} else {
  process.exit(1);
}
