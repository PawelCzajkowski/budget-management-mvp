#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# --- Configuration ---
BACKEND_DIR="backend"
REQUIREMENTS_FILE="$BACKEND_DIR/requirements-lambda.txt"
SOURCE_CODE_DIR="$BACKEND_DIR/src"
BUILD_DIR="$BACKEND_DIR/build"
PACKAGE_DIR="$BUILD_DIR/package"
DEPLOYMENT_ZIP="backend_deployment.zip"
DEPLOYMENT_ZIP_PATH="$BUILD_DIR/$DEPLOYMENT_ZIP" # Pełna ścieżka do pliku ZIP

# --- Clean up previous builds ---
echo "--- Cleaning up previous build artifacts ---"
rm -rf "$BUILD_DIR"
rm -f "$DEPLOYMENT_ZIP_PATH"
mkdir -p "$PACKAGE_DIR"
mkdir -p "$BUILD_DIR"

# --- Install Python dependencies into a temporary package directory ---
echo "--- Installing Python dependencies ---"
# Create a temporary virtual environment for dependency installation
python3 -m venv "$BUILD_DIR/.venv_tmp"
source "$BUILD_DIR/.venv_tmp/bin/activate"

pip install --upgrade pip setuptools wheel
pip install -r "$REQUIREMENTS_FILE" -t "$PACKAGE_DIR"

# Deactivate temporary virtual environment
deactivate
rm -rf "$BUILD_DIR/.venv_tmp" # Remove the temporary virtual environment

# --- Copy source code to package directory ---
echo "--- Copying source code to package directory ---"
cp -r "$SOURCE_CODE_DIR/." "$PACKAGE_DIR/" # Copy content of src/

# --- Clean up unnecessary files from package directory ---
echo "--- Cleaning up unnecessary files from the package ---"
# Remove __pycache__ directories
find "$PACKAGE_DIR" -depth -name "__pycache__" -exec rm -rf {} \;
# Remove .pyc files
find "$PACKAGE_DIR" -name "*.pyc" -delete
# Remove pytest cache files
find "$PACKAGE_DIR" -name ".pytest_cache" -exec rm -rf {} \;
# Remove any virtual environment related files that might have snuck in (e.g., bin/, include/)
rm -rf "$PACKAGE_DIR/bin"
rm -rf "$PACKAGE_DIR/include"
# Remove dist-info and egg-info directories which are not needed for Lambda runtime
find "$PACKAGE_DIR" -type d -name "*.dist-info" -exec rm -rf {} +
find "$PACKAGE_DIR" -type d -name "*.egg-info" -exec rm -rf {} +
# Remove __pycache__ within lib/python*/site-packages as well
find "$PACKAGE_DIR" -type d -name "__pycache__" -exec rm -rf {} +

# Additional cleanup (adjust as needed based on your project)
rm -rf "$PACKAGE_DIR/tests" # If you have a 'tests' folder in your src that should not be deployed
rm -f "$PACKAGE_DIR/.env" # Ensure .env is not packaged

# --- Create the deployment package (ZIP file) ---
echo "--- Creating deployment ZIP file: $DEPLOYMENT_ZIP ---"
cd "$PACKAGE_DIR"
zip -r9 "$DEPLOYMENT_ZIP_PATH" .
cd - > /dev/null # Go back to the original directory quietly

echo "--- Deployment package created successfully: $DEPLOYMENT_ZIP_PATH ---"

# --- Display ZIP file size ---
echo "--- Checking deployment package size ---"
if command -v du &> /dev/null
then
    FILE_SIZE_BYTES=$(du -b "$DEPLOYMENT_ZIP_PATH" | awk '{print $1}')
else
    # Fallback for systems without 'du -b' or for more precise byte size (macOS uses -f%z, Linux -c%s)
    if [ "$(uname)" == "Darwin" ]; then
        FILE_SIZE_BYTES=$(stat -f%z "$DEPLOYMENT_ZIP_PATH")
    else
        FILE_SIZE_BYTES=$(stat -c%s "$DEPLOYMENT_ZIP_PATH")
    fi
fi

FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE_BYTES / (1024 * 1024)" | bc)
echo "Deployment package size: $FILE_SIZE_MB MB"

echo "Next step: Upload '$DEPLOYMENT_ZIP_PATH' to your S3 bucket or deploy via AWS CLI."
echo "Example AWS CLI commands:"
echo "aws s3 cp $DEPLOYMENT_ZIP_PATH s3://your-lambda-artifacts-bucket/your-lambda-function-key.zip"
echo "aws lambda update-function-code --function-name budget-management-mvp-backend --zip-file fileb://$DEPLOYMENT_ZIP_PATH"