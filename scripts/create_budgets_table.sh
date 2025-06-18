#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

TABLE_NAME="budgets"
ENDPOINT_URL="http://localhost:5555"

echo "Creating DynamoDB table: $TABLE_NAME"

aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=user_id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --global-secondary-indexes '[
    {
      "IndexName": "user_id-index",
      "KeySchema": [
        {
          "AttributeName": "user_id",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      },
      "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
      }
    }
  ]' \
  --endpoint-url "$ENDPOINT_URL"

echo "Table $TABLE_NAME created successfully."
