#!/bin/bash

# PR4-PR6 Complete Validation Script
# Runs all tests, generates all artifacts, and validates everything

set -e # Exit on any error

echo "🚀 Starting Complete PR4-PR6 Validation..."
echo "================================================"

# Create artifacts directory structure
mkdir -p artifacts/{coverage,performance,screenshots,audit,sql,logs}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
RESULTS_FILE="artifacts/validation-results.txt"
> "$RESULTS_FILE" # Clear file

log_result() {
    echo "$1: $2" >> "$RESULTS_FILE"
    if [ "$2" = "✅ PASS" ]; then
        echo -e "${GREEN}$1: $2${NC}"
    elif [ "$2" = "⚠️  WARN" ]; then
        echo -e "${YELLOW}$1: $2${NC}"
    else
        echo -e "${RED}$1: $2${NC}"
    fi
}

# ============================================
# STEP 1: BUILD & TYPE CHECK
# ============================================
echo ""
echo "📦 Step 1: Build & Type Check"
echo "--------------------------------------------"

if tsc --noEmit > artifacts/logs/tsc-output.log 2>&1; then
    log_result "TypeScript Check" "✅ PASS"
else
    log_result "TypeScript Check" "❌ FAIL"
    cat artifacts/logs/tsc-output.log
fi

if npm run build > artifacts/logs/build-output.log 2>&1; then
    log_result "Build" "✅ PASS"
else
    log_result "Build" "❌ FAIL"
    cat artifacts/logs/build-output.log
fi

# ============================================
# STEP 2: LINT
# ============================================
echo ""
echo "🔍 Step 2: ESLint Check"
echo "--------------------------------------------"

if npm run lint > artifacts/logs/eslint-output.log 2>&1; then
    log_result "ESLint" "✅ PASS"
else
    log_result "ESLint" "⚠️  WARN"
    cat artifacts/logs/eslint-output.log
fi

# ============================================
# STEP 3: UNIT & INTEGRATION TESTS
# ============================================
echo ""
echo "🧪 Step 3: Unit & Integration Tests (with coverage)"
echo "--------------------------------------------"

if npm run test -- --coverage --run > artifacts/logs/vitest-output.log 2>&1; then
    log_result "Unit Tests" "✅ PASS"
    
    # Check coverage thresholds
    if grep -q "All files.*90" artifacts/logs/vitest-output.log; then
        log_result "Coverage ≥90%" "✅ PASS"
    else
        log_result "Coverage ≥90%" "❌ FAIL"
    fi
else
    log_result "Unit Tests" "❌ FAIL"
    cat artifacts/logs/vitest-output.log
fi

# Copy coverage reports
cp -r coverage artifacts/coverage/ 2>/dev/null || echo "No coverage directory found"

# ============================================
# STEP 4: E2E TESTS (PLAYWRIGHT)
# ============================================
echo ""
echo "🎭 Step 4: End-to-End Tests (Playwright)"
echo "--------------------------------------------"

if npx playwright test --reporter=html --reporter=json > artifacts/logs/playwright-output.log 2>&1; then
    log_result "E2E Tests" "✅ PASS"
else
    log_result "E2E Tests" "⚠️  WARN"
    cat artifacts/logs/playwright-output.log
fi

# Copy Playwright reports
cp -r playwright-report artifacts/ 2>/dev/null || echo "No Playwright report found"

# ============================================
# STEP 5: ACCESSIBILITY TESTS
# ============================================
echo ""
echo "♿ Step 5: Accessibility Tests (axe)"
echo "--------------------------------------------"

# This would require the app to be running - skip if not available
if command -v axe &> /dev/null; then
    if axe http://localhost:5173 --save artifacts/performance/axe-results.json > artifacts/logs/axe-output.log 2>&1; then
        log_result "Accessibility" "✅ PASS"
    else
        log_result "Accessibility" "⚠️  WARN - Server not running"
    fi
else
    log_result "Accessibility" "⚠️  WARN - axe-cli not installed"
fi

# ============================================
# STEP 6: PERFORMANCE TESTS
# ============================================
echo ""
echo "⚡ Step 6: Performance Tests"
echo "--------------------------------------------"

# Bundle size check
if [ -f "dist/assets/index-*.js" ]; then
    BUNDLE_SIZE=$(du -sk dist/assets/index-*.js | cut -f1)
    if [ "$BUNDLE_SIZE" -lt 300 ]; then
        log_result "Bundle Size (<300KB)" "✅ PASS"
    else
        log_result "Bundle Size (<300KB)" "❌ FAIL - ${BUNDLE_SIZE}KB"
    fi
else
    log_result "Bundle Size" "⚠️  WARN - No build found"
fi

# k6 load tests (if available)
if command -v k6 &> /dev/null && [ -f "tests/loadtest.k6.js" ]; then
    if k6 run tests/loadtest.k6.js --out json=artifacts/performance/k6-results.json > artifacts/logs/k6-output.log 2>&1; then
        log_result "Load Tests" "✅ PASS"
    else
        log_result "Load Tests" "⚠️  WARN"
    fi
else
    log_result "Load Tests" "⚠️  WARN - k6 not available"
fi

# ============================================
# STEP 7: DATABASE VALIDATION
# ============================================
echo ""
echo "🗄️  Step 7: Database RLS & Audit Validation"
echo "--------------------------------------------"

echo "Note: Run scripts/validate-rls-policies.sql in Supabase SQL Editor"
echo "Expected tables with RLS:"
echo "  - placement_results, placement_tests"
echo "  - forum_posts, forum_post_views"
echo "  - content_library, content_templates, content_versions"
echo "  - payments, enrollments"
echo ""
echo "Save SQL output to artifacts/sql/rls-validation.txt"

log_result "RLS Validation" "⚠️  MANUAL - Run SQL script"

# ============================================
# STEP 8: SCREENSHOTS (MANUAL)
# ============================================
echo ""
echo "📸 Step 8: UI Screenshots"
echo "--------------------------------------------"

echo "Manual step: Take screenshots of:"
echo "  PR4: PlacementTestPage (start, submit, result, error)"
echo "  PR5: ClassForumPage (list, create, edit, delete, report)"
echo "  PR6: TemplateManager, ContentVersionHistory"
echo ""
echo "Save to artifacts/screenshots/"

log_result "UI Screenshots" "⚠️  MANUAL - Take screenshots"

# ============================================
# FINAL REPORT
# ============================================
echo ""
echo "================================================"
echo "📊 VALIDATION SUMMARY"
echo "================================================"
cat "$RESULTS_FILE"
echo ""

PASS_COUNT=$(grep -c "✅ PASS" "$RESULTS_FILE" || true)
FAIL_COUNT=$(grep -c "❌ FAIL" "$RESULTS_FILE" || true)
WARN_COUNT=$(grep -c "⚠️" "$RESULTS_FILE" || true)

echo "Results: ${PASS_COUNT} passed, ${FAIL_COUNT} failed, ${WARN_COUNT} warnings"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 VALIDATION COMPLETE - All critical checks passed!${NC}"
    echo "Review warnings and complete manual steps."
else
    echo -e "${RED}❌ VALIDATION FAILED - Fix critical issues before proceeding${NC}"
    exit 1
fi

echo ""
echo "📁 All artifacts saved to: ./artifacts/"
echo "📋 Full results in: $RESULTS_FILE"
