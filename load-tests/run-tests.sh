#!/bin/bash

echo "🚀 Artillery Load Testing for Skill-Swap-Hub"
echo "============================================"

# Check if Artillery is installed
if ! command -v artillery &> /dev/null
then
    echo "❌ Artillery is not installed. Please install it first:"
    echo "npm install -g artillery"
    exit 1
fi

# Check if Next.js server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js server is not running on localhost:3000"
    echo "Please start your server first: npm run dev"
    exit 1
fi

echo "✅ Server is running, starting load tests..."
echo ""

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo "📊 Running $test_name..."
    echo "Test file: $test_file"
    echo "Started at: $(date)"
    echo "----------------------------------------"
    
    artillery run "$test_file"
    
    echo "----------------------------------------"
    echo "✅ $test_name completed at: $(date)"
    echo ""
}

# Menu for test selection
echo "Select which test to run:"
echo "1) Basic Load Test (recommended for first run)"
echo "2) Authentication Load Test"
echo "3) Stress Test (find breaking point)"
echo "4) Run All Tests (this will take ~20 minutes)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        run_test "Basic Load Test" "load-tests/basic-load-test.yml"
        ;;
    2)
        run_test "Authentication Load Test" "load-tests/auth-load-test.yml"
        ;;
    3)
        run_test "Stress Test" "load-tests/stress-test.yml"
        ;;
    4)
        echo "🔥 Running all tests - this will take approximately 20 minutes..."
        run_test "Basic Load Test" "load-tests/basic-load-test.yml"
        sleep 10
        run_test "Authentication Load Test" "load-tests/auth-load-test.yml"
        sleep 10
        run_test "Stress Test" "load-tests/stress-test.yml"
        echo "🎉 All tests completed!"
        ;;
    *)
        echo "❌ Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo "📈 Load testing completed!"
echo "Check the results above for:"
echo "- Response times (min, max, median, p95, p99)"
echo "- Request rates (req/sec)"
echo "- Error rates"
echo "- Concurrent user handling capacity"
