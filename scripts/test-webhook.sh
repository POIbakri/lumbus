#!/bin/bash

# Test if the eSIM Access webhook endpoint is accessible

WEBHOOK_URL="${NEXT_PUBLIC_APP_URL:-https://getlumbus.com}/api/esimaccess/webhook"
WEBHOOK_SECRET="${ESIMACCESS_WEBHOOK_SECRET}"

echo "🔍 Testing eSIM Access Webhook Endpoint"
echo "URL: $WEBHOOK_URL"
echo ""

# Test 1: Health check (GET request)
echo "1️⃣ Testing GET request (health check)..."
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$WEBHOOK_URL")
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_status" = "200" ]; then
  echo "✅ Endpoint is accessible"
  echo "Response: $body"
else
  echo "❌ Endpoint not accessible (Status: $http_status)"
  echo "Response: $body"
fi
echo ""

# Test 2: CHECK_HEALTH webhook (no secret required)
echo "2️⃣ Testing CHECK_HEALTH webhook..."
health_payload='{
  "notifyType": "CHECK_HEALTH",
  "eventGenerateTime": "2025-01-22 12:00:00 UTC",
  "content": {}
}'

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$health_payload" \
  "$WEBHOOK_URL")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_status" = "200" ]; then
  echo "✅ Health check webhook works"
  echo "Response: $body"
else
  echo "❌ Health check failed (Status: $http_status)"
  echo "Response: $body"
fi
echo ""

# Test 3: ORDER_STATUS webhook with secret
if [ -n "$WEBHOOK_SECRET" ]; then
  echo "3️⃣ Testing ORDER_STATUS webhook with secret..."
  order_payload='{
    "notifyType": "ORDER_STATUS",
    "notifyId": "test-notify-'$(date +%s)'",
    "eventGenerateTime": "2025-01-22 12:00:00 UTC",
    "content": {
      "orderNo": "TEST_ORDER_123",
      "orderStatus": "GOT_RESOURCE"
    }
  }'

  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-webhook-secret: $WEBHOOK_SECRET" \
    -d "$order_payload" \
    "$WEBHOOK_URL")

  http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | sed '$d')

  if [ "$http_status" = "200" ]; then
    echo "✅ ORDER_STATUS webhook accepted"
    echo "Response: $body"
  else
    echo "❌ ORDER_STATUS webhook failed (Status: $http_status)"
    echo "Response: $body"
  fi
else
  echo "⚠️  Skipping ORDER_STATUS test - ESIMACCESS_WEBHOOK_SECRET not set"
fi

echo ""
echo "📋 Summary:"
echo "- If all tests pass, the webhook endpoint is working correctly"
echo "- If tests fail, check:"
echo "  1. Server is running and accessible"
echo "  2. ESIMACCESS_WEBHOOK_SECRET matches in eSIM Access dashboard"
echo "  3. Firewall/security groups allow incoming webhooks"
echo "  4. Domain DNS is correctly configured"
