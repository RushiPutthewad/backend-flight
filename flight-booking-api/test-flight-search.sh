#!/bin/bash

# Flight Search Module - Integration Test Script
# Tests Phase 4 implementation with Redis caching

BASE_URL="http://localhost:3000/api/v1"

echo "=========================================="
echo "Flight Search Module Integration Tests"
echo "Phase 4 - Redis Caching Implementation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to check response
check_response() {
    local test_name=$1
    local response=$2
    local expected=$3

    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        echo "Response: $response"
        ((TESTS_FAILED++))
    fi
}

echo "Test 1: Health Check"
echo "--------------------"
RESPONSE=$(curl -s "$BASE_URL/../health")
check_response "Health endpoint" "$RESPONSE" '"status":"ok"'
echo ""

echo "Test 2: Flight Search - Cache MISS (First Request)"
echo "--------------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=1&cabinClass=economy")
check_response "Search returns success" "$RESPONSE" '"success":true'
check_response "Search returns data array" "$RESPONSE" '"data":\['
check_response "First request is NOT cached" "$RESPONSE" '"cached":false'
echo ""

echo "Test 3: Flight Search - Cache HIT (Second Request)"
echo "--------------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=1&cabinClass=economy")
check_response "Search returns success" "$RESPONSE" '"success":true'
check_response "Second request IS cached" "$RESPONSE" '"cached":true'
echo ""

echo "Test 4: Parameter Normalization - Lowercase to Uppercase"
echo "-------------------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=jfk&destination=cdg&departureDate=2026-10-12&passengers=1&cabinClass=economy")
check_response "Lowercase params hit cache" "$RESPONSE" '"cached":true'
echo ""

echo "Test 5: Get Flight by ID"
echo "------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/flight-jfk-cdg-001")
check_response "Get flight by ID returns success" "$RESPONSE" '"success":true'
check_response "Flight has ID field" "$RESPONSE" '"id":"flight-jfk-cdg-001"'
check_response "Flight has airline field" "$RESPONSE" '"airline"'
check_response "Flight has flightNumber field" "$RESPONSE" '"flightNumber"'
echo ""

echo "Test 6: Search Different Route - JFK to LHR"
echo "-------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=LHR&departureDate=2026-10-12&passengers=1&cabinClass=economy")
check_response "Different route search succeeds" "$RESPONSE" '"success":true'
check_response "Different route is NOT cached initially" "$RESPONSE" '"cached":false'
echo ""

echo "Test 7: Validation - Missing Required Field"
echo "-------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&departureDate=2026-10-12")
check_response "Missing destination fails validation" "$RESPONSE" '"success":false'
echo ""

echo "Test 8: Validation - Invalid Airport Code Length"
echo "------------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFKX&destination=CDG&departureDate=2026-10-12")
check_response "Invalid airport code fails validation" "$RESPONSE" '"success":false'
echo ""

echo "Test 9: Validation - Invalid Date Format"
echo "----------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=CDG&departureDate=10-12-2026")
check_response "Invalid date format fails validation" "$RESPONSE" '"success":false'
echo ""

echo "Test 10: Validation - Invalid Cabin Class"
echo "-----------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&cabinClass=premium")
check_response "Invalid cabin class fails validation" "$RESPONSE" '"success":false'
echo ""

echo "Test 11: Get Non-Existent Flight"
echo "--------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/non-existent-flight-id")
check_response "Non-existent flight returns error" "$RESPONSE" '"success":false'
echo ""

echo "Test 12: Clear Cache"
echo "--------------------"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/flights/cache")
check_response "Cache clear returns success" "$RESPONSE" '"success":true'
echo ""

echo "Test 13: After Cache Clear - Should be Cache MISS"
echo "-------------------------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=1&cabinClass=economy")
check_response "After cache clear is NOT cached" "$RESPONSE" '"cached":false'
echo ""

echo "Test 14: Business Class Search"
echo "------------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=LHR&departureDate=2026-10-12&passengers=1&cabinClass=business")
check_response "Business class search succeeds" "$RESPONSE" '"success":true'
check_response "Response includes cabinClass" "$RESPONSE" '"cabinClass":"business"'
echo ""

echo "Test 15: Multiple Passengers"
echo "----------------------------"
RESPONSE=$(curl -s "$BASE_URL/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=3&cabinClass=economy")
check_response "Multiple passengers search succeeds" "$RESPONSE" '"success":true'
echo ""

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed ✗${NC}"
    exit 1
fi
