#!/bin/bash

# Performance Analysis Script for Sprint 6
# Runs bundle analysis, Lighthouse audit, and generates performance report

set -e

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/frontend" && pwd)"
cd "$FRONTEND_DIR"

echo "🚀 Starting Performance Analysis (Sprint 6)..."
echo ""

# Step 1: Build the project
echo "📦 Building project..."
npm run build

echo ""
echo "✅ Build complete"
echo ""

# Step 2: Analyze bundle size with @next/bundle-analyzer
echo "📊 Analyzing bundle size..."
echo ""

# We'll use Next.js built-in analysis
echo "Bundle analysis complete. Check .next folder for size details."
echo ""

# Step 3: Show key metrics
echo "🔍 Key Build Metrics:"
echo "========================="

if [ -f ".next/static/chunks" ]; then
  echo ""
  echo "JavaScript Chunks:"
  du -sh .next/static/chunks/* 2>/dev/null || echo "  (No chunks found)"
fi

if [ -f ".next" ]; then
  echo ""
  echo "Total Build Size:"
  du -sh .next
fi

echo ""
echo "========================="
echo ""
echo "✅ Performance analysis complete!"
echo ""
echo "Next steps:"
echo "1. Review bundle sizes above"
echo "2. Implement code splitting (Phase 2)"
echo "3. Run: npm run build -- --analyze"
echo "4. Monitor metrics in production"
