#!/bin/bash

# Test Cron Job: Update eSIM Usage
# This script tests the cron job locally

# Load CRON_SECRET from .env.local
if [ -f .env.local ]; then
  export $(grep CRON_SECRET .env.local | xargs)
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not found in .env.local"
  exit 1
fi

echo "Testing cron job: /api/cron/update-usage"
echo "Using CRON_SECRET from .env.local"
echo ""

# Make request
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/update-usage | python3 -m json.tool

echo ""
echo "Done!"
