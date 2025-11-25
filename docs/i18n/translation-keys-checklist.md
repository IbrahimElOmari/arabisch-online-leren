# 🔍 Translation Keys Checklist

Automated check om ontbrekende vertaalsleutels te identificeren.

## Hoe te gebruiken

1. Run het check script:
```bash
npm run i18n:check
```

2. Review de output voor ontbrekende keys per taal

3. Voeg ontbrekende vertalingen toe aan de juiste locale files

---

## Verplichte Keys per Sectie

### Authentication (auth.*)
- [ ] `auth.login`
- [ ] `auth.logout`
- [ ] `auth.register`
- [ ] `auth.forgot_password`
- [ ] `auth.reset_password`
- [ ] `auth.email`
- [ ] `auth.password`
- [ ] `auth.confirm_password`

### Navigation (nav.*)
- [ ] `nav.home`
- [ ] `nav.dashboard`
- [ ] `nav.lessons`
- [ ] `nav.exercises`
- [ ] `nav.forum`
- [ ] `nav.chat`
- [ ] `nav.profile`
- [ ] `nav.settings`

### Dashboard (dashboard.*)
- [ ] `dashboard.welcome`
- [ ] `dashboard.progress`
- [ ] `dashboard.recent_activity`
- [ ] `dashboard.upcoming_lessons`
- [ ] `dashboard.achievements`

### Lessons (lessons.*)
- [ ] `lessons.title`
- [ ] `lessons.description`
- [ ] `lessons.start`
- [ ] `lessons.complete`
- [ ] `lessons.duration`

### Exercises (exercises.*)
- [ ] `exercises.title`
- [ ] `exercises.submit`
- [ ] `exercises.correct`
- [ ] `exercises.incorrect`
- [ ] `exercises.score`

### Forum (forum.*)
- [ ] `forum.new_post`
- [ ] `forum.reply`
- [ ] `forum.edit`
- [ ] `forum.delete`
- [ ] `forum.like`

### Chat (chat.*)
- [ ] `chat.send`
- [ ] `chat.typing`
- [ ] `chat.online`
- [ ] `chat.offline`

### Common (common.*)
- [ ] `common.save`
- [ ] `common.cancel`
- [ ] `common.delete`
- [ ] `common.edit`
- [ ] `common.confirm`
- [ ] `common.loading`
- [ ] `common.error`
- [ ] `common.success`

---

## Automated Check Script

```javascript
// scripts/check-i18n.js
const fs = require('fs');
const path = require('path');

const locales = ['nl', 'en', 'ar'];
const localeDir = path.join(__dirname, '../src/i18n/locales');

function loadLocale(lang) {
  const filePath = path.join(localeDir, `${lang}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(flattenKeys(value, newPrefix));
    } else {
      keys.push(newPrefix);
    }
  }
  return keys;
}

function checkMissingKeys() {
  const translations = {};
  const allKeys = new Set();

  // Load all locales
  for (const lang of locales) {
    translations[lang] = loadLocale(lang);
    const keys = flattenKeys(translations[lang]);
    keys.forEach(k => allKeys.add(k));
  }

  // Check for missing keys
  const missing = {};
  for (const lang of locales) {
    const langKeys = new Set(flattenKeys(translations[lang]));
    missing[lang] = [];
    for (const key of allKeys) {
      if (!langKeys.has(key)) {
        missing[lang].push(key);
      }
    }
  }

  // Report
  console.log('\\n🔍 Translation Coverage Report\\n');
  for (const lang of locales) {
    const total = allKeys.size;
    const found = total - missing[lang].length;
    const percentage = ((found / total) * 100).toFixed(1);
    
    console.log(`${lang.toUpperCase()}: ${found}/${total} keys (${percentage}%)`);
    
    if (missing[lang].length > 0) {
      console.log(`  Missing keys:`);
      missing[lang].forEach(key => console.log(`    - ${key}`));
    }
    console.log('');
  }

  // Exit with error if any missing
  const hasMissing = Object.values(missing).some(arr => arr.length > 0);
  process.exit(hasMissing ? 1 : 0);
}

checkMissingKeys();
```

## Package.json Script

```json
{
  "scripts": {
    "i18n:check": "node scripts/check-i18n.js"
  }
}
```

---

## CI/CD Integration

Voeg toe aan `.github/workflows/ci.yml`:

```yaml
- name: Check i18n Coverage
  run: npm run i18n:check
```

---

**Laatst bijgewerkt:** 25 november 2025
