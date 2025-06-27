#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Help message function
show_help() {
  echo "Usage: $0 <table-name>"
  echo ""
  echo "Creates a DynamoDB table with on-demand billing mode and a GSI on user_id."
  echo ""
  echo "Arguments:"
  echo "  <table-name>    Required. Name of the DynamoDB table to create."
  echo ""
  echo "Options:"
  echo "  -h, --help      Show this help message and exit."
}

# Check for --help or -h
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  show_help
  exit 0
fi

# Validate table name
if [ -z "$1" ]; then
  echo "Error: <table-name> is required."
  show_help
  exit 1
fi

TABLE_NAME="$1"

echo "Creating production DynamoDB table: $TABLE_NAME with on-demand billing mode"

aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=user_id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
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
      }
    }
  ]'

echo "Table $TABLE_NAME created successfully in on-demand mode."
