#!/bin/bash

# Development setup script for Python 3.13
# Run this script from the backend directory
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🔧 Setting up development environment..."
echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Backend directory: $BACKEND_DIR"

# Check if we're in the backend directory or if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at: $BACKEND_DIR"
    echo "   Please run this script from the backend directory or ensure the backend directory exists."
    exit 1
fi

# Change to backend directory
cd "$BACKEND_DIR"
echo "📁 Changed to backend directory: $(pwd)"

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2)
echo "🐍 Python version: $PYTHON_VERSION"

# Check if virtual environment exists
if [ -d ".venv" ]; then
    echo "📦 Virtual environment already exists. Updating dependencies..."
    source .venv/bin/activate
else
    echo "📦 Creating virtual environment..."
    python -m venv .venv
    source .venv/bin/activate
fi

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install development dependencies
echo "📦 Installing development dependencies..."
pip install -r requirements-dev.txt

echo "✅ Development environment setup completed!"
echo ""
echo "🚀 To start the development server:"
echo "   source .venv/bin/activate"
echo "   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "🧪 To run tests:"
echo "   source .venv/bin/activate"
echo "   pytest" 