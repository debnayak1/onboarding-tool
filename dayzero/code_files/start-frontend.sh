#!/bin/bash

# Onboarding Agent - Frontend Startup Script
# This script starts the React frontend application

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting frontend server on http://localhost:3000"
echo "Make sure the backend is running on http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

