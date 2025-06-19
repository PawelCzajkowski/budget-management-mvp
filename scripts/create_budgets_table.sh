#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables from .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Validate required environment variables
if [ -z "$DYNAMODB_TABLE_NAME" ] || [ -z "$DYNAMODB_ENDPOINT_URL" ] || [ -z "$AWS_REGION" ]; then
  echo "Error: Required environment variables are missing."
  echo "Make sure DYNAMODB_TABLE_NAME, DYNAMODB_ENDPOINT_URL, and AWS_REGION are set."
  exit 1
fi

echo "Creating DynamoDB table: $DYNAMODB_TABLE_NAME"

aws dynamodb create-table \
  --table-name "$DYNAMODB_TABLE_NAME" \
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
  --endpoint-url "$DYNAMODB_ENDPOINT_URL" \
  --region "$AWS_REGION"

echo "Table $DYNAMODB_TABLE_NAME created successfully."