#!/bin/bash

# Test script for new user endpoints
# Run after: psql $DATABASE_URL -f migrations/create_user_push_tokens.sql

echo "🧪 Testing New User Endpoints"
echo "================================"
echo ""

# You'll need to replace this with a real JWT token from Supabase Auth
# Get it by: logging into your app or using Supabase dashboard
TOKEN="your-jwt-token-here"

# Base URL
API_URL="http://localhost:3000/api"

echo "📝 Note: Replace TOKEN variable with a real JWT token from Supabase Auth"
echo ""

# Test 1: GET /api/user/orders
echo "1️⃣  Testing GET /api/user/orders"
echo "   Endpoint: $API_URL/user/orders"
curl -s -X GET "$API_URL/user/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 2: POST /api/user/push-token
echo "2️⃣  Testing POST /api/user/push-token (iOS)"
echo "   Endpoint: $API_URL/user/push-token"
curl -s -X POST "$API_URL/user/push-token" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pushToken": "ExponentPushToken[test-ios-token-123]",
    "platform": "ios"
  }' | jq '.'
echo ""
echo ""

# Test 3: POST /api/user/push-token (Android)
echo "3️⃣  Testing POST /api/user/push-token (Android)"
echo "   Endpoint: $API_URL/user/push-token"
curl -s -X POST "$API_URL/user/push-token" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pushToken": "ExponentPushToken[test-android-token-456]",
    "platform": "android"
  }' | jq '.'
echo ""
echo ""

# Test 4: DELETE /api/user/push-token
echo "4️⃣  Testing DELETE /api/user/push-token"
echo "   Endpoint: $API_URL/user/push-token"
curl -s -X DELETE "$API_URL/user/push-token" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 5: Test without auth (should return 401)
echo "5️⃣  Testing without auth (should return 401)"
echo "   Endpoint: $API_URL/user/orders"
curl -s -X GET "$API_URL/user/orders" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "✅ All tests complete!"
echo ""
echo "📖 How to get a JWT token:"
echo "   1. Log into your app or Supabase dashboard"
echo "   2. Open browser console"
echo "   3. Run: (await supabase.auth.getSession()).data.session.access_token"
echo "   4. Copy the token and replace TOKEN variable in this script"
