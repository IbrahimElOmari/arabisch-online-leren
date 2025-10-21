#!/bin/bash
# Phase 0 Deployment Script
# Run this to deploy security migrations and verify

set -e  # Exit on error

echo "🚀 Starting Phase 0 Deployment..."
echo ""

# Step 1: Commit and push
echo "📦 Step 1: Committing and pushing to main..."
git add .
git commit -m "feat: phase 0 security deployment - RLS hardening & build fixes"
git push origin main

echo "✅ Code pushed to GitHub"
echo ""

# Step 2: Wait for CI/CD
echo "⏳ Step 2: Waiting for GitHub Actions to complete..."
echo "   Please monitor: https://github.com/{your-repo}/actions"
echo "   Workflow: 'Supabase Admin'"
echo ""
read -p "Press Enter when GitHub Actions has completed successfully..."

# Step 3: Verification instructions
echo ""
echo "🔍 Step 3: Verify deployment in Supabase"
echo "   1. Open Supabase SQL Editor"
echo "   2. Copy contents of scripts/verify-deployment.sql"
echo "   3. Execute and check all ✅ statuses"
echo ""
read -p "Press Enter when verification is complete..."

# Step 4: Dashboard configuration
echo ""
echo "⚙️  Step 4: Configure Supabase Dashboard"
echo "   Go to: https://supabase.com/dashboard/project/xugosdedyukizseveahx/auth/providers"
echo ""
echo "   Set these values:"
echo "   - OTP Expiry: 600 seconds"
echo "   - Email rate limit: 5 emails/hour"
echo "   - SMS rate limit: 3 SMS/hour"
echo ""
read -p "Press Enter when configuration is complete..."

# Step 5: Functional tests
echo ""
echo "🧪 Step 5: Run functional tests"
echo "   Test as Student: Search should only show enrolled classes"
echo "   Test as Teacher: Search should only show own classes"
echo "   Test as Admin: Search should show all content"
echo ""
read -p "Press Enter when tests pass..."

echo ""
echo "🎉 Phase 0 Deployment Complete!"
echo "   Next: Review docs/FASE0_DEPLOYMENT_FINAL.md"
echo ""
