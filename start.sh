#!/bin/bash
# Start the Python scraper microservice in the background
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/scraper/venv/bin/python3.14" "$SCRIPT_DIR/scraper/scraper_service.py" &
SCRAPER_PID=$!
echo "Scraper started (PID $SCRAPER_PID) on port 5001"

# Start the Node.js server
node "$SCRIPT_DIR/server/index.js"

# Kill scraper when Node exits
kill $SCRAPER_PID 2>/dev/null
