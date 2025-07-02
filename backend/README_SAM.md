# AWS SAM Deployment Guide

This guide explains how to deploy the Budget Management API using AWS SAM CLI.

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **AWS SAM CLI** installed
   ```bash
   # macOS
   brew install aws-sam-cli
   
   # Linux
   pip install aws-sam-cli
   
   # Windows
   # Download from AWS website
   ```

3. **Docker** installed (for building with containers)

4. **S3 Bucket**  
   You need an S3 bucket to store your deployment artifacts.  
   **Your deployment bucket:**  
   - `budget-management-mvp`

   If you don't have the bucket, create it:
   ```bash
   aws s3 mb s3://budget-management-mvp
   ```

## Required Environment Variables

All required environment variables must be set in a `.env` file in the `backend` directory. Example values can be found in `env.example`.

**Required variables:**

- `DYNAMODB_TABLE_NAME` — DynamoDB table name (e.g., `budget-management-mvp-budgets`)
- `COGNITO_USER_POOL_ID` — Cognito User Pool ID (e.g., `your-user-pool-id-here`)
- `LAMBDA_EXECUTION_ROLE_ARN` — ARN for the Lambda execution role (e.g., `arn:aws:iam::your-account-id:role/lambda-execution-role`)
- `OPENAI_API_KEY` — API key for OpenAI (required for AI features)
- `LANGCHAIN_ENDPOINT` — LangSmith API endpoint (e.g., `https://api.smith.langchain.com`)
- `LANGCHAIN_API_KEY` — API key for LangSmith (required for LangSmith features)
- `LANGCHAIN_PROJECT` — Project name for LangSmith (required for LangSmith features)
- `LANGSMITH_TRACING` — Enable LangSmith tracing (set to "true" for debugging and monitoring)

**Optional:**
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — Only if not using AWS CLI profiles

> **Note:** `AWS_REGION` is automatically set by AWS Lambda and does not need to be specified.

## Deployment Steps

### 1. Build the application

From the `backend` directory, run:
```bash
sam build --use-container
```

### 2. Deploy the application

**Do NOT use `--guided`.**  
Deploy using your S3 bucket:
```bash
sam deploy --s3-bucket budget-management-mvp \
  --parameter-overrides \
  "UserPoolId=eu-north-1_fz1hEPl5w \
   OpenAIApiKey=$OPENAI_API_KEY \
   LangSmithApiKey=$LANGCHAIN_API_KEY \
   LangSmithProject=budget-management-mvp"
```

You can also specify additional parameters if needed (e.g., stack name, region):
```bash
sam deploy --s3-bucket budget-management-mvp --stack-name budget-management-app --region eu-north-1 --capabilities CAPABILITY_IAM
```

### 3. Post-deployment

- The output will include your API Gateway endpoint.
- Update your frontend or API clients to use the new endpoint.

## Configuration

### Environment Variables

The following environment variables are automatically set by SAM:

- `DYNAMODB_TABLE_NAME`: DynamoDB table name (created by SAM)
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID (set via parameter)
- `ALLOWED_ORIGINS`: CORS allowed origins (set via parameter)
- `AWS_REGION`: AWS region (set automatically)

### Parameters

You can customize the deployment by modifying parameters in `samconfig.toml`:

- `DynamoDBTableName`: Name of the DynamoDB table
- `CognitoUserPoolId`: Your Cognito User Pool ID
- `AllowedOrigins`: Comma-separated list of allowed CORS origins

## Local Development

To run the API locally:
```bash
sam local start-api
```

## Monitoring & Logs

To view logs:
```bash
sam logs -n BudgetManagementFunction --stack-name budget-management-app --tail
```

## Cleanup

To delete the stack and all resources:
```bash
sam delete --stack-name budget-management-app
```

---

**Note:**  
- Always use the `--s3-bucket` parameter for deployment.
- Do **not** use `sam deploy --guided`.
- Make sure your `requirements-sam.txt` includes all dependencies needed by your Lambda function.

---

**Deployment S3 Bucket:**  
- `budget-management-mvp`

## Architecture

The SAM template creates:

1. **Lambda Function**: Runs your FastAPI application
2. **API Gateway**: HTTP API for routing requests
3. **DynamoDB Table**: For storing budget data
4. **IAM Roles**: For Lambda to access DynamoDB and CloudWatch

## Monitoring

### View logs
```bash
sam logs -n BudgetManagementFunction --stack-name budget-management-api --tail
```

### CloudWatch metrics
- Go to AWS CloudWatch console
- Navigate to Lambda metrics
- Select your function

## Troubleshooting

### Common issues

1. **Timeout errors**: Increase timeout in `template.yaml`
2. **Memory issues**: Increase memory in `template.yaml`
3. **CORS errors**: Check `AllowedOrigins` parameter
4. **Permission errors**: Verify IAM roles in template

### Debug locally
```bash
# Start with debug logging
sam local start-api --debug

# Test specific function
sam local invoke BudgetManagementFunction --event events/test-event.json
```

## Cost Optimization

- DynamoDB uses on-demand billing (pay per request)
- Lambda charges based on execution time and memory
- API Gateway charges per request

## Security

- All requests go through API Gateway
- Lambda function has minimal IAM permissions
- DynamoDB table uses encryption at rest
- CORS is configured for specific origins

## Next Steps

1. Set up custom domain with API Gateway
2. Configure CloudFront for caching
3. Set up monitoring and alerting
4. Implement CI/CD pipeline 