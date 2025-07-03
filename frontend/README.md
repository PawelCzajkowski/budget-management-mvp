# Budget Management Frontend

This is the frontend application for the Budget Management MVP, built with React, TypeScript, and TailwindCSS.

## Development

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Setup

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies

```bash
npm install
```

4. Create a `.env.local` file with the following variables:

```
VITE_API_BASE_URL=https://7bt2ch2nna.execute-api.eu-north-1.amazonaws.com/v1
VITE_AWS_REGION=eu-north-1
VITE_COGNITO_USER_POOL_ID=eu-north-1_fz1hEPl5w
VITE_COGNITO_CLIENT_ID=1tc5uofjkv4cjbk336vmgp9evr
VITE_APP_ENV=development
```

5. Start the development server

```bash
npm run dev
```

## Building for Production

To build the application for production:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment

### Manual Deployment

You can deploy the application manually using the provided script:

```bash
../scripts/deploy_frontend.sh --bucket your-s3-bucket-name --distribution-id your-cloudfront-distribution-id
```

### GitHub Actions Deployment

The application is automatically deployed using GitHub Actions when changes are pushed to the main branch. The workflow is defined in `.github/workflows/frontend-deploy.yml`.

To use GitHub Actions deployment, you need to set the following secrets in your GitHub repository:

- `AWS_ACCESS_KEY_ID`: AWS access key with permissions to deploy to S3 and invalidate CloudFront
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region (e.g., eu-north-1)
- `AWS_S3_BUCKET`: S3 bucket name for deployment
- `AWS_CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID (optional)
- `VITE_API_BASE_URL`: API base URL
- `VITE_AWS_REGION`: AWS region for Cognito
- `VITE_COGNITO_USER_POOL_ID`: Cognito user pool ID
- `VITE_COGNITO_CLIENT_ID`: Cognito client ID

## Environment Configuration

The application uses environment variables for configuration. The following variables are available:

- `VITE_API_BASE_URL`: Base URL for the API
- `VITE_AWS_REGION`: AWS region for Cognito
- `VITE_COGNITO_USER_POOL_ID`: Cognito user pool ID
- `VITE_COGNITO_CLIENT_ID`: Cognito client ID
- `VITE_APP_ENV`: Application environment (development, staging, production)
- `VITE_REDIRECT_URI`: OAuth redirect URI (defaults to window.location.origin) 