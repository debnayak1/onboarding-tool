#!/bin/bash

# Onboarding Agent - Backend Startup Script
# This script starts the FastAPI backend server

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Verify activation by checking Python path
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "Error: Failed to activate virtual environment"
    exit 1
fi

echo "Using Python: $(which python)"
echo "Virtual environment: $VIRTUAL_ENV"

# Check if uvicorn is installed in venv
if ! python -c "import uvicorn" 2>/dev/null; then
    echo "Installing dependencies..."
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "Starting backend server on http://localhost:8080"
echo "API Documentation available at http://localhost:8080/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server using the venv's python
python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# Made with Bob
