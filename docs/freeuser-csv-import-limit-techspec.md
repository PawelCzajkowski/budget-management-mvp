# Technical Specification: FreeUser CSV Import Limit Implementation

## System Architecture

### DynamoDB Table Design
Table Name: `budget-management-mvp-UserUsageTracker`

Primary Key Structure:
- Partition Key: `userId` (String) - The unique identifier of the user
- Sort Key: `month` (String) - Format: "YYYY-MM" for monthly tracking

Attributes:
- `userType` (String) - "FREE" or "PREMIUM"
- `tokenCount` (Number) - Current number of tokens (0-3)
- `lastResetTimestamp` (Number) - Unix timestamp of last reset
- `timezone` (String) - User's timezone (e.g., "America/New_York")
- `lastUpdateTimestamp` (Number) - For concurrency control
- `overrideExpiry` (Number, Optional) - Unix timestamp when admin override expires

### Implementation Steps

1. **Create DynamoDB Table**
   - Create table with above schema
   - Enable auto-scaling
   - Set up TTL on `overrideExpiry` attribute
   - Configure appropriate IAM roles and policies

2. **Backend Service Layer**
   Create new `UserUsageService` class in `services` directory with methods:
   - `checkAndDecrementTokens(userId, timezone)`
   - `resetTokens(userId)`
   - `getTokenStatus(userId)`
   - `adminOverrideLimit(userId, newTokenCount, expiryDate)`

3. **Token Bucket Implementation**
   - Create `TokenBucketManager` class in `utils` directory
   - Implement atomic decrement operation using DynamoDB conditional updates
   - Add monthly reset logic based on user's timezone
   - Include concurrency protection using optimistic locking

4. **API Layer Modifications**
   - Add new middleware `checkImportLimit` in `auth_dependency.py`
   - Modify CSV import endpoint to use the middleware
   - Add admin endpoint for limit override
   - Add endpoint to check current token status

5. **Error Handling**
   - Create new exception `ImportLimitExceededError` in `exceptions` directory
   - Include reset date in error response
   - Add error translation in API layer

### Detailed Implementation Guide

1. **DynamoDB Operations**
   ```plaintext
   - Use UpdateItem with conditional expression for token decrement
   - Use PutItem for initial user record creation
   - Use GetItem for token status check
   - Use UpdateItem for admin overrides
   ```

2. **Token Management Logic**
   ```plaintext
   - On import attempt:
     1. Get user record
     2. If not exists, create with 3 tokens
     3. Check if reset needed based on month and timezone
     4. Check token count
     5. Conditionally update token count
     6. Handle race conditions with optimistic locking
   ```

3. **Reset Schedule**
   ```plaintext
   - Calculate next reset date based on user's timezone
   - Reset occurs at 00:00 on 1st day of month in user's timezone
   - Store last reset timestamp to prevent duplicate resets
   ```

4. **Admin Override Flow**
   ```plaintext
   - Admin specifies new token count and optional expiry
   - System updates token count and sets override expiry
   - Override automatically expires via DynamoDB TTL
   ```

### API Endpoints

1. **CSV Import Endpoint (Modified)**
   - Path: `/api/v1/budgets/import-csv`
   - Method: `POST`
   - New Header: `X-User-Timezone`

2. **Admin Override Endpoint (New)**
   - Path: `/api/v1/admin/users/{userId}/import-limit`
   - Method: `PUT`
   - Requires admin authentication

3. **Token Status Endpoint (New)**
   - Path: `/api/v1/users/import-tokens`
   - Method: `GET`

### Error Responses

1. **Limit Exceeded**
   ```plaintext
   Status: 429 Too Many Requests
   {
     "error": "IMPORT_LIMIT_EXCEEDED",
     "message": "Monthly import limit reached",
     "resetDate": "2025-09-01T00:00:00-04:00",
     "remainingTokens": 0
   }
   ```

2. **Concurrency Error**
   ```plaintext
   Status: 409 Conflict
   {
     "error": "CONCURRENT_UPDATE",
     "message": "Please try again"
   }
   ```

### Testing Requirements

1. **Unit Tests**
   - Token bucket logic
   - Timezone calculations
   - Reset scheduling
   - Admin override functionality

2. **Integration Tests**
   - DynamoDB operations
   - Concurrent access handling
   - Monthly reset functionality
   - Admin override workflow

3. **E2E Tests**
   - Complete import flow for free users
   - Premium user unlimited access
   - Timezone-based reset timing
   - Admin override functionality

### Security Considerations

1. **Access Control**
   - Validate admin permissions for override endpoint
   - Ensure users can only access their own token status
   - Protect against timezone manipulation

2. **Rate Limiting**
   - Add general rate limiting on token check operations
   - Implement exponential backoff for retries

### Monitoring and Logging

1. **Metrics to Track**
   - Token usage per user
   - Reset events
   - Admin overrides
   - Limit exceeded events

2. **Alerts**
   - High rate of limit exceeded events
   - Failed admin overrides
   - Abnormal token usage patterns

### Rollout Strategy

1. **Phase 1: Infrastructure**
   - Create DynamoDB table
   - Set up monitoring
   - Deploy admin override functionality

2. **Phase 2: Core Implementation**
   - Deploy token bucket logic
   - Enable for 10% of free users
   - Monitor for issues

3. **Phase 3: Full Deployment**
   - Gradually increase to 100% of free users
   - Enable all monitoring and alerts

### Assumptions

1. User timezone is available in the request headers
2. Admin override functionality is restricted to super admin role
3. Premium users are identified via existing authentication mechanism
4. DynamoDB is the primary data store for the application

### Dependencies

1. AWS SDK for DynamoDB operations
2. Existing authentication/authorization system
3. Timezone handling library (e.g., pytz)
4. Admin access control mechanism

This technical specification provides all necessary details for implementing the FreeUser CSV import limit feature. The implementation follows a modular approach, ensuring scalability, maintainability, and robust error handling.
