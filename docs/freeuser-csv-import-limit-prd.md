# PRD: Limit FreeUser CSV Import Usage

## Overview
Implement a feature to restrict FreeUsers to a maximum of 3 CSV file imports per month via the "import CSV file" endpoint. PremiumUsers will have unlimited access. When a FreeUser reaches the limit, they must be notified and informed when the limit will reset. All usage data will be stored in DynamoDB table `budget-management-mvp-UserUsageTracker`. The token bucket mechanism will be used for tracking and enforcing limits.

## Goals
- Prevent FreeUsers from importing more than 3 CSV files per month.
- Allow PremiumUsers unlimited CSV imports.
- Notify FreeUsers when they hit the limit, including the reset date.
- Store and manage usage data in DynamoDB.

## User Stories

### 1. As a FreeUser, I want to import CSV files up to 3 times per month, so I can manage my budget data within my plan limits.
- **Acceptance Criteria:**
  - FreeUser can successfully import up to 3 CSV files per calendar month.
  - On the 4th attempt (and beyond), the import is blocked and a clear message is shown: "You have reached your monthly import limit. Your limit will reset on [reset date]."

### 2. As a PremiumUser, I want to import CSV files without any monthly limit, so I can manage my budget data freely.
- **Acceptance Criteria:**
  - PremiumUser can import CSV files without restriction.

### 3. As a FreeUser, I want to know when my import limit will reset, so I can plan future imports.
- **Acceptance Criteria:**
  - When the limit is reached, the response includes the date/time when the limit will reset (start of next calendar month).

### 4. As a system, I want to track each user's CSV import usage in DynamoDB, so that limits are enforced accurately and efficiently.
- **Acceptance Criteria:**
  - Each import attempt by a FreeUser is recorded in the `budget-management-mvp-UserUsageTracker` table.
  - The table stores: user ID, usage count, last reset timestamp, and (optionally) token bucket state.
  - The system resets usage counts at the start of each calendar month.


## Technical Requirements
- Use DynamoDB table `budget-management-mvp-UserUsageTracker` for tracking usage.
- Implement a token bucket mechanism for FreeUsers:
  - Bucket size: 3 tokens (one per allowed import).
  - Refill: Reset to 3 tokens at the start of each calendar month.
  - The reset is based on the user's local time zone.
- On each import attempt:
  - Check user type (Free or Premium).
  - For FreeUser: Check and decrement token count; if 0, block and inform user.
  - For PremiumUser: Allow without restriction.
- API response for blocked FreeUser must include reset date/time (in user's local time zone).
- Ensure concurrency safety for token decrement and reset.
- Admins must be able to override or reset usage limits for any user manually.

## Out of Scope
- UI changes beyond error/limit messaging.
- RBAC or additional user roles.


## Open Questions
- None at this time. (Reset will be based on user's local time zone. Admins can override/reset limits manually.)

---

