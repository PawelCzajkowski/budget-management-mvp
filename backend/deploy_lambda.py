#!/usr/bin/env python3
"""
AWS Lambda deployment script
"""
import os
import sys
import zipfile
import shutil
import boto3
from botocore.exceptions import ClientError
from lambda_config import LAMBDA_CONFIG, API_GATEWAY_CONFIG, validate_environment

def create_deployment_package():
    """Create a deployment package for Lambda"""
    print("📦 Creating deployment package...")
    
    # Create a temporary directory for packaging
    package_dir = "lambda_package"
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    os.makedirs(package_dir)
    
    # Copy source code
    shutil.copytree("src", f"{package_dir}/src")
    
    # Copy requirements and install dependencies
    shutil.copy("requirements-lambda.txt", f"{package_dir}/requirements.txt")
    
    # Install dependencies to the package directory
    os.system(f"pip install -r requirements-lambda.txt -t {package_dir}")
    
    # Create zip file
    zip_filename = "lambda_function.zip"
    if os.path.exists(zip_filename):
        os.remove(zip_filename)
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, package_dir)
                zipf.write(file_path, arcname)
    
    # Clean up
    shutil.rmtree(package_dir)
    
    print(f"✅ Deployment package created: {zip_filename}")
    return zip_filename

def deploy_lambda_function(zip_filename):
    """Deploy the Lambda function"""
    print("🚀 Deploying Lambda function...")
    
    lambda_client = boto3.client('lambda')
    
    try:
        # Check if function exists
        try:
            lambda_client.get_function(FunctionName=LAMBDA_CONFIG["function_name"])
            print(f"📝 Updating existing function: {LAMBDA_CONFIG['function_name']}")
            
            # Update function code
            with open(zip_filename, 'rb') as zip_file:
                lambda_client.update_function_code(
                    FunctionName=LAMBDA_CONFIG["function_name"],
                    ZipFile=zip_file.read()
                )
            
            # Update function configuration
            lambda_client.update_function_configuration(
                FunctionName=LAMBDA_CONFIG["function_name"],
                Runtime=LAMBDA_CONFIG["runtime"],
                Handler=LAMBDA_CONFIG["handler"],
                Timeout=LAMBDA_CONFIG["timeout"],
                MemorySize=LAMBDA_CONFIG["memory_size"],
                Environment={
                    'Variables': LAMBDA_CONFIG["environment_variables"]
                }
            )
            
        except ClientError as e:
            if hasattr(e, 'response') and e.response.get('Error', {}).get('Code') == 'ResourceNotFoundException':
                print(f"🆕 Creating new function: {LAMBDA_CONFIG['function_name']}")
                
                # Create new function
                with open(zip_filename, 'rb') as zip_file:
                    lambda_client.create_function(
                        FunctionName=LAMBDA_CONFIG["function_name"],
                        Runtime=LAMBDA_CONFIG["runtime"],
                        Handler=LAMBDA_CONFIG["handler"],
                        Role=os.getenv("LAMBDA_EXECUTION_ROLE_ARN"),  # Required for new functions
                        Code={'ZipFile': zip_file.read()},
                        Timeout=LAMBDA_CONFIG["timeout"],
                        MemorySize=LAMBDA_CONFIG["memory_size"],
                        Environment={
                            'Variables': LAMBDA_CONFIG["environment_variables"]
                        }
                    )
            else:
                raise
        
        print("✅ Lambda function deployed successfully!")
        
    except Exception as e:
        print(f"❌ Failed to deploy Lambda function: {str(e)}")
        sys.exit(1)

def main():
    """Main deployment function"""
    print("🚀 Budget Management API - Lambda Deployment")
    print("=" * 50)
    
    # Validate environment
    try:
        validate_environment()
        print("✅ Environment validation passed")
    except ValueError as e:
        print(f"❌ Environment validation failed: {str(e)}")
        sys.exit(1)
    
    # Create deployment package
    zip_filename = create_deployment_package()
    
    # Deploy to Lambda
    deploy_lambda_function(zip_filename)
    
    print("\n🎉 Deployment completed successfully!")
    print(f"Function name: {LAMBDA_CONFIG['function_name']}")
    print("Next steps:")
    print("1. Configure API Gateway to trigger the Lambda function")
    print("2. Set up CORS if needed")
    print("3. Test the API endpoints")

if __name__ == "__main__":
    main() 