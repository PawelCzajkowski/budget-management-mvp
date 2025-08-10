#!/bin/bash

# Create the UserUsageTracker table
aws dynamodb create-table \
    --table-name budget-management-mvp-UserUsageTracker \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=month,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=month,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
    --tags Key=Environment,Value=production

# Enable TTL on overrideExpiry attribute
aws dynamodb update-time-to-live \
    --table-name budget-management-mvp-UserUsageTracker \
    --time-to-live-specification "Enabled=true, AttributeName=overrideExpiry"

# Enable auto-scaling
aws application-auto-scaling register-scalable-target \
    --service-namespace dynamodb \
    --resource-id "table/budget-management-mvp-UserUsageTracker" \
    --scalable-dimension "dynamodb:table:ReadCapacityUnits" \
    --min-capacity 1 \
    --max-capacity 10

aws application-auto-scaling register-scalable-target \
    --service-namespace dynamodb \
    --resource-id "table/budget-management-mvp-UserUsageTracker" \
    --scalable-dimension "dynamodb:table:WriteCapacityUnits" \
    --min-capacity 1 \
    --max-capacity 10

echo "Table budget-management-mvp-UserUsageTracker created successfully!"
