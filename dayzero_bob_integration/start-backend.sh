#!/bin/bash

# Onboarding Agent - Backend Startup Script
# This script starts the FastAPI backend server

cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Installing dependencies..."
    venv/bin/pip install --upgrade pip
    venv/bin/pip install -r requirements.txt
fi

echo "Starting backend server on http://localhost:8080"
echo "API Documentation available at http://localhost:8080/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080 --reload

