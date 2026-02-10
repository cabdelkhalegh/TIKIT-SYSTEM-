# Phase 2.9: Risk Engine Data Structure Preparation

**Labels:** `phase2`, `risk`, `preparation`, `prisma`, `backend`
**Assignees:** @Copilot
**Issue Number:** (To be assigned)

## 🎯 Context for AI Agent

**PRD Reference:** Risk calculation and tracking requirements

**Depends On:** 
- Campaign Entity

**Blocks:** 
- Phase 3 Risk Engine implementation
- Risk monitoring features

**Files to Create/Modify:**
- `prisma/schema.prisma` - Add RiskEventLog model
- `backend/src/types/tikit-risk.types.ts` - TypeScript risk type definitions
- `backend/src/config/risk-weights.config.ts` - Risk calculation configuration
- `prisma/migrations/` - Auto-generated migration files

## ✅ Acceptance Criteria

- [ ] RiskEventLog model for tracking risk-triggering events
- [ ] TypeScript interfaces for risk types and scoring
- [ ] Risk weight configuration file
- [ ] Risk level calculation logic defined
- [ ] Event categorization system
- [ ] Prisma migration applies cleanly
- [ ] Type definitions compile without errors

## 📝 Prisma Model for Risk Event Tracking

```prisma
// Risk Event Category - What triggered the risk event
enum RiskEventCategory {
  MISSING_INFORMATION     // Incomplete campaign data
  DEADLINE_APPROACHING    // Approaching deadline
  DEADLINE_MISSED         // Missed deadline
  APPROVAL_DELAYED        // Approval taking too long
  APPROVAL_REJECTED       // Approval rejected
  BUDGET_EXCEEDED         // Over budget
  INFLUENCER_DROPOUT      // Influencer dropped out
  CONTENT_REVISION        // Multiple content revisions
  PUBLISHING_DELAY        // Publishing delayed
  POLICY_VIOLATION        // Policy rule violated
  EXTERNAL_DEPENDENCY     // Waiting on external party
  PERFORMANCE_ISSUE       // Performance below target
}

// Risk Severity - How serious is this event
enum RiskSeverity {
  NEGLIGIBLE
  MINOR
  MODERATE
  SIGNIFICANT
  CRITICAL
}

// RiskEventLog Model - Tracks all risk-affecting events
model RiskEventLog {
  eventLogId                String              @id @default(uuid()) @map("event_log_id")
  
  // Relationships
  campaignId                String              @map("campaign_id")
  campaign                  Campaign            @relation(fields: [campaignId], references: [id])
  
  contentTaskId             String?             @map("content_task_id")
  approvalItemId            String?             @map("approval_item_id")
  
  // Event Classification
  eventCategory             RiskEventCategory   @map("event_category")
  eventSeverity             RiskSeverity        @map("event_severity")
  
  // Event Details
  eventTitle                String              @map("event_title")
  eventDescription          String?             @map("event_description")
  eventContext              Json?               @map("event_context")  // Flexible context data
  
  // Risk Impact
  riskPointsAdded           Int                 @default(0) @map("risk_points_added")
  riskPointsRemoved         Int                 @default(0) @map("risk_points_removed")
  previousRiskLevel         String?             @map("previous_risk_level")  // LOW/MEDIUM/HIGH
  newRiskLevel              String?             @map("new_risk_level")
  
  // Resolution Tracking
  isResolved                Boolean             @default(false) @map("is_resolved")
  resolvedAt                DateTime?           @map("resolved_at")
  resolvedBy                String?             @map("resolved_by")
  resolutionNotes           String?             @map("resolution_notes")
  
  // Auto-Resolution
  autoResolveAfter          DateTime?           @map("auto_resolve_after")
  wasAutoResolved           Boolean             @default(false) @map("was_auto_resolved")
  
  // Timestamps
  eventOccurredAt           DateTime            @default(now()) @map("event_occurred_at")
  eventRecordedAt           DateTime            @default(now()) @map("event_recorded_at")
  
  // Metadata
  triggeredByUserId         String?             @map("triggered_by_user_id")
  triggeredBySystem         Boolean             @default(false) @map("triggered_by_system")

  @@map("risk_event_logs")
  @@index([campaignId])
  @@index([eventCategory])
  @@index([eventSeverity])
  @@index([isResolved])
  @@index([eventOccurredAt])
}
```

## 📝 TypeScript Risk Type Definitions

Create `backend/src/types/tikit-risk.types.ts`:

```typescript
/**
 * TiKiT OS Risk Calculation Type Definitions
 * Defines risk scoring and calculation structures
 */

export enum TiKiTRiskCategory {
  MISSING_INFORMATION = 'MISSING_INFORMATION',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  DEADLINE_MISSED = 'DEADLINE_MISSED',
  APPROVAL_DELAYED = 'APPROVAL_DELAYED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  INFLUENCER_DROPOUT = 'INFLUENCER_DROPOUT',
  CONTENT_REVISION = 'CONTENT_REVISION',
  PUBLISHING_DELAY = 'PUBLISHING_DELAY',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  EXTERNAL_DEPENDENCY = 'EXTERNAL_DEPENDENCY',
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',
}

export enum TiKiTRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface TiKiTRiskWeight {
  categoryName: TiKiTRiskCategory;
  basePoints: number;
  severityMultipliers: {
    NEGLIGIBLE: number;
    MINOR: number;
    MODERATE: number;
    SIGNIFICANT: number;
    CRITICAL: number;
  };
  description: string;
}

export interface TiKiTRiskScore {
  totalRiskPoints: number;
  riskLevel: TiKiTRiskLevel;
  activeRiskEvents: number;
  categoryBreakdown: Map<TiKiTRiskCategory, number>;
  lastCalculatedAt: Date;
}

export interface TiKiTRiskThresholds {
  lowToMedium: number;     // Points above which risk becomes MEDIUM
  mediumToHigh: number;    // Points above which risk becomes HIGH
}

export interface TiKiTRiskEvaluation {
  campaignIdentifier: string;
  currentScore: TiKiTRiskScore;
  recentEvents: Array<{
    eventCategory: TiKiTRiskCategory;
    pointsContributed: number;
    occurredAt: Date;
  }>;
  recommendations: string[];
  requiresEscalation: boolean;
}

/**
 * Risk calculation context - data needed to calculate risk
 */
export interface TiKiTRiskCalculationContext {
  campaignIdentifier: string;
  missingInfoCount: number;
  overdueApprovals: number;
  overdueDeadlines: number;
  budgetOveragePercentage: number;
  contentRevisionCount: number;
  unresolvedRiskEvents: number;
}
```

## 📝 Risk Weight Configuration

Create `backend/src/config/risk-weights.config.ts`:

```typescript
import { TiKiTRiskWeight, TiKiTRiskCategory, TiKiTRiskThresholds } from '../types/tikit-risk.types';

/**
 * TiKiT OS Risk Weight Configuration
 * Defines how much each risk event category contributes to overall risk score
 */

export const TIKIT_RISK_WEIGHTS: TiKiTRiskWeight[] = [
  {
    categoryName: TiKiTRiskCategory.MISSING_INFORMATION,
    basePoints: 5,
    severityMultipliers: {
      NEGLIGIBLE: 0.5,
      MINOR: 1.0,
      MODERATE: 1.5,
      SIGNIFICANT: 2.0,
      CRITICAL: 3.0,
    },
    description: 'Missing required campaign information',
  },
  {
    categoryName: TiKiTRiskCategory.DEADLINE_APPROACHING,
    basePoints: 3,
    severityMultipliers: {
      NEGLIGIBLE: 0.5,
      MINOR: 1.0,
      MODERATE: 1.5,
      SIGNIFICANT: 2.5,
      CRITICAL: 4.0,
    },
    description: 'Deadline approaching within warning window',
  },
  {
    categoryName: TiKiTRiskCategory.DEADLINE_MISSED,
    basePoints: 15,
    severityMultipliers: {
      NEGLIGIBLE: 1.0,
      MINOR: 1.5,
      MODERATE: 2.0,
      SIGNIFICANT: 3.0,
      CRITICAL: 5.0,
    },
    description: 'Deadline has been missed',
  },
  {
    categoryName: TiKiTRiskCategory.APPROVAL_DELAYED,
    basePoints: 8,
    severityMultipliers: {
      NEGLIGIBLE: 0.5,
      MINOR: 1.0,
      MODERATE: 2.0,
      SIGNIFICANT: 3.0,
      CRITICAL: 4.5,
    },
    description: 'Approval taking longer than expected',
  },
  {
    categoryName: TiKiTRiskCategory.APPROVAL_REJECTED,
    basePoints: 12,
    severityMultipliers: {
      NEGLIGIBLE: 1.0,
      MINOR: 1.5,
      MODERATE: 2.5,
      SIGNIFICANT: 3.5,
      CRITICAL: 5.0,
    },
    description: 'Approval has been rejected',
  },
  {
    categoryName: TiKiTRiskCategory.BUDGET_EXCEEDED,
    basePoints: 20,
    severityMultipliers: {
      NEGLIGIBLE: 1.0,
      MINOR: 2.0,
      MODERATE: 3.0,
      SIGNIFICANT: 4.0,
      CRITICAL: 6.0,
    },
    description: 'Campaign budget exceeded',
  },
  {
    categoryName: TiKiTRiskCategory.INFLUENCER_DROPOUT,
    basePoints: 25,
    severityMultipliers: {
      NEGLIGIBLE: 1.0,
      MINOR: 2.0,
      MODERATE: 3.5,
      SIGNIFICANT: 5.0,
      CRITICAL: 7.0,
    },
    description: 'Influencer dropped from campaign',
  },
  {
    categoryName: TiKiTRiskCategory.CONTENT_REVISION,
    basePoints: 6,
    severityMultipliers: {
      NEGLIGIBLE: 0.5,
      MINOR: 1.0,
      MODERATE: 1.5,
      SIGNIFICANT: 2.5,
      CRITICAL: 4.0,
    },
    description: 'Content requires revision',
  },
];

/**
 * Risk level thresholds
 * LOW: 0-29 points
 * MEDIUM: 30-74 points
 * HIGH: 75+ points
 */
export const TIKIT_RISK_THRESHOLDS: TiKiTRiskThresholds = {
  lowToMedium: 30,
  mediumToHigh: 75,
};

/**
 * Calculate risk level from total points
 */
export function calculateTiKiTRiskLevel(totalPoints: number): string {
  if (totalPoints >= TIKIT_RISK_THRESHOLDS.mediumToHigh) {
    return 'HIGH';
  } else if (totalPoints >= TIKIT_RISK_THRESHOLDS.lowToMedium) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Get weight configuration for a risk category
 */
export function getTiKiTRiskWeight(category: TiKiTRiskCategory): TiKiTRiskWeight | undefined {
  return TIKIT_RISK_WEIGHTS.find(w => w.categoryName === category);
}
```

## 🔧 Implementation Steps

1. **Add RiskEventLog model to schema.prisma**
   - Add RiskEventCategory and RiskSeverity enums
   - Add RiskEventLog model
   - Add relation to Campaign model:
   ```prisma
   riskEventLogs  RiskEventLog[]
   ```

2. **Create TypeScript type definitions**
   - Create `backend/src/types/tikit-risk.types.ts`
   - Define all risk-related interfaces and enums

3. **Create risk weight configuration**
   - Create `backend/src/config/risk-weights.config.ts`
   - Define risk weights and thresholds
   - Implement helper functions

4. **Create and apply migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add-risk-event-log
   ```

5. **Validate TypeScript compilation**
   ```bash
   cd backend
   npm run type-check
   # or
   npx tsc --noEmit
   ```

6. **Create risk calculation stub**
   - Create placeholder for Phase 3 implementation
   - Document risk calculation algorithm

7. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   ```

## Dependencies

**Blocked By:**
- Phase 2.2 - Campaign Entity Model

**Blocks:**
- Phase 3 - Risk Engine Implementation
- Phase 3 - Risk Monitoring Dashboard

## Notes for AI Agent

- **Event-Driven:** Risk is calculated by summing points from active RiskEventLog entries
- **Resolution:** When risk events are resolved, they stop contributing to risk score
- **Real-Time:** Risk level should be recalculated whenever new events are logged
- **Weights:** Different event categories have different base points and severity multipliers
- **Thresholds:** Configure thresholds to determine LOW/MEDIUM/HIGH boundaries
- **Context Storage:** Use JSON field for flexible event context
- **Auto-Resolution:** Some events can auto-resolve after time period
- **Audit Trail:** Complete history of all risk events preserved
- **Campaign-Centric:** All risk events tied to campaigns
- **Phase 3 Ready:** This prepares data structures; actual calculation logic in Phase 3
