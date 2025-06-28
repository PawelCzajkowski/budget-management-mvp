# Budget Management API - AWS Lambda Deployment

This document provides instructions for deploying the Budget Management API to AWS Lambda.

## Prerequisites

1. **AWS CLI** installed and configured with appropriate permissions
2. **Python 3.11** installed
3. **AWS Resources** already created:
   - DynamoDB table
   - Cognito User Pool
   - Lambda Execution Role

## Environment Variables

Set the following environment variables before deployment:

```bash
export AWS_REGION="eu-north-1"
export DYNAMODB_TABLE_NAME="budget-management-mvp-budgets"
export COGNITO_USER_POOL_ID="your-user-pool-id"
export LAMBDA_EXECUTION_ROLE_ARN="arn:aws:iam::your-account:role/lambda-execution-role"
```

## Authentication Architecture

This API uses **AWS Cognito Hosted UI** for authentication:

- **Registration/Login**: Handled by Cognito Hosted UI
- **JWT Verification**: Lambda functions verify JWT tokens from Cognito
- **User Management**: All user operations are managed through Cognito

The frontend should integrate with Cognito using AWS Amplify or Cognito JavaScript SDK.

## Deployment Steps

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements-lambda.txt
```

### 2. Deploy to Lambda

```bash
python deploy_lambda.py
```

This script will:
- Create a deployment package with all dependencies
- Upload the code to AWS Lambda
- Configure the function with environment variables

### 3. Configure API Gateway

After Lambda deployment, you need to set up API Gateway:

1. Create a new REST API in API Gateway
2. Create resources and methods for your endpoints:
   - `GET /budgets/`
   - `POST /budgets/`
   - `GET /budgets/{budget_id}`
   - `PUT /budgets/{budget_id}`
   - `DELETE /budgets/{budget_id}`
   - `POST /budgets/import-csv`
   - `POST /budgets/validate-period-mismatch`
   - `POST /budgets/apply-period-corrections`

3. Configure CORS for your API
4. Deploy the API to a stage (e.g., `prod`)

## Lambda Function Configuration

- **Runtime**: Python 3.11
- **Handler**: `src.main.handler`
- **Timeout**: 30 seconds
- **Memory**: 512 MB
- **Architecture**: x86_64

## API Endpoints

### Budget Management (All require JWT authentication)
- `GET /budgets/` - Get all budget IDs for the user
- `POST /budgets/` - Create a new budget
- `GET /budgets/{budget_id}` - Get a specific budget
- `PUT /budgets/{budget_id}` - Update a budget
- `DELETE /budgets/{budget_id}` - Delete a budget
- `POST /budgets/import-csv` - Import budget from CSV file
- `POST /budgets/validate-period-mismatch` - Validate period mismatches
- `POST /budgets/apply-period-corrections` - Apply period corrections

## Security

- All endpoints require JWT authentication
- JWT tokens are verified against AWS Cognito
- CORS is configured to allow cross-origin requests
- Authentication is handled by Cognito Hosted UI

## Frontend Integration

Your React frontend should:

1. **Use AWS Amplify** or **Cognito JavaScript SDK** for authentication
2. **Send JWT tokens** in the `Authorization: Bearer <token>` header
3. **Handle token refresh** automatically
4. **Redirect to Cognito Hosted UI** for login/registration

Example frontend authentication flow:
```javascript
// Using AWS Amplify
import { Auth } from 'aws-amplify';

// Sign in
const user = await Auth.signIn(email, password);
const token = (await Auth.currentSession()).getAccessToken().getJwtToken();

// Use token in API calls
const response = await fetch('/budgets/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Monitoring and Logging

- Lambda function logs are available in CloudWatch
- API Gateway provides request/response logging
- Set up CloudWatch alarms for error rates and latency

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are included in the deployment package
2. **Timeout Errors**: Increase the Lambda timeout if needed
3. **Memory Errors**: Increase the Lambda memory allocation
4. **Permission Errors**: Verify the Lambda execution role has proper permissions
5. **Authentication Errors**: Verify JWT token format and Cognito configuration

### Debugging

1. Check CloudWatch logs for Lambda function errors
2. Verify environment variables are set correctly
3. Test individual endpoints using API Gateway console
4. Verify JWT token verification in `jwt_utils.py`

## Cost Optimization

- Use Lambda Provisioned Concurrency for consistent performance
- Set up CloudWatch alarms for cost monitoring
- Consider using API Gateway caching for frequently accessed data

## Next Steps

1. Set up CI/CD pipeline for automated deployments
2. Configure custom domain for API Gateway
3. Implement rate limiting and throttling
4. Set up monitoring and alerting
5. Configure backup and disaster recovery
6. Set up Cognito Hosted UI for authentication 