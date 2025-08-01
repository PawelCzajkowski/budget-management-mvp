#!/bin/bash
# Script to deploy the frontend to AWS S3 and invalidate CloudFront cache

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file"
    export $(grep -v '^#' .env | xargs)
fi

# Load CloudFront Distribution ID from .env.production if it exists
if [ -f "$(dirname "$0")/../frontend/.env.production" ]; then
    echo "Loading CloudFront Distribution ID from .env.production file"
    VITE_CLOUDFRONT_ID=$(grep '^VITE_CLOUDFRONT_DISTRIBUTION_ID=' "$(dirname "$0")/../frontend/.env.production" | cut -d '=' -f2)
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Default values
S3_BUCKET=${AWS_S3_BUCKET:-"budget-management-front"}
CLOUDFRONT_DISTRIBUTION_ID=${AWS_CLOUDFRONT_DISTRIBUTION_ID:-${VITE_CLOUDFRONT_ID:-""}}
REGION=${AWS_REGION:-"eu-north-1"}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --bucket)
        S3_BUCKET="$2"
        shift
        shift
        ;;
        --distribution-id)
        CLOUDFRONT_DISTRIBUTION_ID="$2"
        shift
        shift
        ;;
        --region)
        REGION="$2"
        shift
        shift
        ;;
        *)
        echo "Unknown option: $1"
        exit 1
        ;;
    esac
done

# Navigate to the frontend directory
cd "$(dirname "$0")/../frontend"

echo "Building the frontend application..."
npm ci
npm run build

echo "Deploying to S3 bucket: $S3_BUCKET"
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete --region "$REGION"

# Invalidate CloudFront cache if distribution ID is provided
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "Invalidating CloudFront cache for distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --region "$REGION"
fi

echo "Frontend deployment completed successfully!" 