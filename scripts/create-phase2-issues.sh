#!/bin/bash

# TiKiT OS - Phase 2 Issue Creation Script
# This script helps create GitHub issues from the markdown templates

REPO="cabdelkhalegh/TIKIT-SYSTEM-"
ISSUES_DIR="./issues"

echo "🚀 TiKiT OS Phase 2 Issue Creation Helper"
echo "=========================================="
echo ""
echo "This script will help you create 9 Phase 2 data model issues."
echo ""
echo "Prerequisites:"
echo "  - GitHub CLI (gh) installed and authenticated"
echo "  - Repository: $REPO"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install from: https://cli.github.com/"
    echo ""
    echo "Alternative: Create issues manually by copying content from:"
    echo "   $ISSUES_DIR/phase_2_*.md"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Function to create issue from markdown file
create_issue() {
    local file=$1
    local issue_num=$2
    
    # Extract title (first heading)
    local title=$(grep -m 1 "^# " "$file" | sed 's/^# //')
    
    # Extract labels
    local labels=$(grep "^**Labels:**" "$file" | sed 's/\*\*Labels:\*\* //' | sed 's/`//g' | tr ' ' '\n' | tr ',' '\n' | grep -v '^$' | paste -sd,)
    
    echo "Creating Issue $issue_num: $title"
    echo "  Labels: $labels"
    
    # Create the issue
    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body-file "$file" \
        --label "$labels" \
        --assignee "Copilot" \
        2>&1
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Created successfully"
    else
        echo "  ❌ Failed to create"
    fi
    echo ""
}

# Confirm before proceeding
read -p "Create all 9 Phase 2 issues? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Creating issues..."
echo ""

# Create each issue
create_issue "$ISSUES_DIR/phase_2_2_campaign_entity_model.md" "2.2"
create_issue "$ISSUES_DIR/phase_2_3_influencer_profile_entity_model.md" "2.3"
create_issue "$ISSUES_DIR/phase_2_4_contenttask_contentartifact_models.md" "2.4"
create_issue "$ISSUES_DIR/phase_2_5_approvalitem_entity_model.md" "2.5"
create_issue "$ISSUES_DIR/phase_2_6_financialobject_entity_model.md" "2.6"
create_issue "$ISSUES_DIR/phase_2_7_user_role_entity_models.md" "2.7"
create_issue "$ISSUES_DIR/phase_2_8_complete_database_migration_seed_data.md" "2.8"
create_issue "$ISSUES_DIR/phase_2_9_risk_engine_data_structure_preparation.md" "2.9"
create_issue "$ISSUES_DIR/phase_2_10_complete_schema_validation_prd_compliance_check.md" "2.10"

echo "=========================================="
echo "✅ Issue creation complete!"
echo ""
echo "Next steps:"
echo "  1. Review issues at: https://github.com/$REPO/issues"
echo "  2. Verify all dependencies are correct"
echo "  3. Begin implementation in order: 2.2, 2.3, 2.7 (parallel), then sequentially"
echo ""
