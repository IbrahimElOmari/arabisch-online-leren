#!/bin/bash

# ==================================================
# TYPESCRIPT ERROR FIXING SCRIPT
# ==================================================
# This script systematically fixes TypeScript strict mode errors
# Run this after copying strict tsconfig files
# ==================================================

set -e

echo "🔧 Starting TypeScript Error Fixing Process..."
echo ""

# Step 1: Copy strict configs
echo "📋 Step 1: Copying strict TypeScript configurations..."
if [ -f "manual-paste/tsconfig.json" ] && [ -f "manual-paste/tsconfig.app.json" ]; then
  cp manual-paste/tsconfig.json ./tsconfig.json
  cp manual-paste/tsconfig.app.json ./tsconfig.app.json
  echo "✅ Configs copied"
else
  echo "❌ Config files not found in manual-paste/"
  exit 1
fi

echo ""

# Step 2: Generate error report
echo "📊 Step 2: Generating typecheck error report..."
pnpm typecheck 2>&1 | tee typecheck-errors-full.log
ERROR_COUNT=$(grep "error TS" typecheck-errors-full.log | wc -l)
echo "Found $ERROR_COUNT TypeScript errors"

echo ""

# Step 3: Categorize errors
echo "🏷️  Step 3: Categorizing errors..."

# Unused variables
grep "error TS6133" typecheck-errors-full.log > errors-unused-vars.log || true
UNUSED_COUNT=$(cat errors-unused-vars.log | wc -l)
echo "  - Unused variables: $UNUSED_COUNT"

# Unused imports  
grep "error TS6192" typecheck-errors-full.log > errors-unused-imports.log || true
UNUSED_IMPORTS=$(cat errors-unused-imports.log | wc -l)
echo "  - Unused imports: $UNUSED_IMPORTS"

# Type mismatches
grep "error TS23" typecheck-errors-full.log > errors-type-mismatch.log || true
TYPE_ERRORS=$(cat errors-type-mismatch.log | wc -l)
echo "  - Type mismatches: $TYPE_ERRORS"

# Cannot find name
grep "error TS2304" typecheck-errors-full.log > errors-undefined.log || true
UNDEFINED_ERRORS=$(cat errors-undefined.log | wc -l)
echo "  - Undefined names: $UNDEFINED_ERRORS"

echo ""

# Step 4: Auto-fix what we can
echo "🔨 Step 4: Auto-fixing unused imports with ESLint..."
pnpm exec eslint --fix "src/**/*.{ts,tsx}" || true
echo "✅ ESLint fixes applied"

echo ""

# Step 5: Generate fix guide
echo "📖 Step 5: Generating fix guide..."

cat > typescript-fix-guide.md << 'EOF'
# TypeScript Error Fix Guide

## Summary
Generated: $(date)
Total Errors: $ERROR_COUNT

## Categories
1. Unused Variables (TS6133): $UNUSED_COUNT
2. Unused Imports (TS6192): $UNUSED_IMPORTS  
3. Type Mismatches (TS23xx): $TYPE_ERRORS
4. Undefined Names (TS2304): $UNDEFINED_ERRORS

## Fix Priorities

### Priority 1: Critical (Breaks functionality)
```bash
# Review errors-undefined.log
cat errors-undefined.log

# Fix by:
# - Re-adding accidentally removed imports
# - Fixing typos in variable names
```

### Priority 2: Type Safety (Prevents bugs)
```bash
# Review errors-type-mismatch.log
cat errors-type-mismatch.log

# Fix by:
# - Adding null checks: if (!value) return;
# - Using optional chaining: value?.property
# - Updating interface types to match DB schema
```

### Priority 3: Code Quality (Non-blocking)
```bash
# Review errors-unused-vars.log and errors-unused-imports.log

# Fix by:
# - Delete truly unused code
# - Prefix intentionally unused with _: const _unused = ...
# - Add // eslint-disable-next-line if needed temporarily
```

## Automated Fixes

### Remove Unused Imports
```bash
# ESLint can auto-remove most unused imports
pnpm exec eslint --fix src/**/*.{ts,tsx}
```

### Fix Unused Variables
```bash
# Find and prefix with underscore
find src -name "*.tsx" -exec sed -i 's/const \([a-zA-Z]*\) =/const _\1 =/g' {} +
```

## Manual Review Needed

Files requiring manual attention (undefined names, type mismatches):
```
$(cat errors-undefined.log errors-type-mismatch.log | cut -d'(' -f1 | sort -u)
```

## Verification
After fixes:
```bash
pnpm typecheck
# Target: 0 errors
```
EOF

echo "✅ Fix guide created: typescript-fix-guide.md"

echo ""

# Step 6: Recheck
echo "🔍 Step 6: Rechecking errors after auto-fixes..."
pnpm typecheck 2>&1 | tee typecheck-errors-after.log
NEW_ERROR_COUNT=$(grep "error TS" typecheck-errors-after.log | wc -l)
FIXED_COUNT=$((ERROR_COUNT - NEW_ERROR_COUNT))

echo ""
echo "📊 Results:"
echo "  Before: $ERROR_COUNT errors"
echo "  After:  $NEW_ERROR_COUNT errors"
echo "  Fixed:  $FIXED_COUNT errors"
echo ""

if [ $NEW_ERROR_COUNT -eq 0 ]; then
  echo "🎉 All TypeScript errors fixed!"
else
  echo "⚠️  $NEW_ERROR_COUNT errors remaining - see typescript-fix-guide.md"
fi

echo ""
echo "📁 Generated files:"
echo "  - typecheck-errors-full.log (all errors)"
echo "  - typecheck-errors-after.log (remaining errors)"
echo "  - typescript-fix-guide.md (manual fix guide)"
echo "  - errors-*.log (categorized errors)"
echo ""
echo "✅ Script complete"
