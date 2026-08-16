#!/bin/bash

echo "========================================="
echo "Data Persistence Verification"
echo "========================================="
echo ""

echo "1. Checking data directory..."
if [ -d "backend/data" ]; then
    echo "✓ Data directory exists"
else
    echo "✗ Data directory missing!"
    exit 1
fi

echo ""
echo "2. Checking JSON files..."
for file in teams repositories learning_modules team_configs users; do
    if [ -f "backend/data/${file}.json" ]; then
        count=$(cat "backend/data/${file}.json" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
        echo "✓ ${file}.json exists (${count} items)"
    else
        echo "✗ ${file}.json missing!"
    fi
done

echo ""
echo "3. Engineer count in users.json:"
python3 << 'EOF'
import json
with open('backend/data/users.json') as f:
    users = json.load(f)
    engineers = [u for u in users.values() if u.get('role') == 'engineer']
    print(f"   Total users: {len(users)}")
    print(f"   Engineers: {len(engineers)}")
    for eng in engineers:
        print(f"   - {eng['full_name']} ({eng['username']})")
EOF

echo ""
echo "4. File timestamps:"
ls -lh backend/data/*.json | awk '{print "   " $9 " - " $6 " " $7 " " $8}'

echo ""
echo "========================================="
echo "If you see 4 engineers above, data IS persisting!"
echo "If backend shows only 2 after restart, check:"
echo "1. Backend console for 'Loaded X items from users'"
echo "2. Backend might be using wrong directory"
echo "3. Try: grep 'db_dir' backend/main.py"
echo "========================================="

