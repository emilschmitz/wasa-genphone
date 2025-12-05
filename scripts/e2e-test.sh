#!/bin/bash
# End-to-End Test Script for AI Game Generator
# This script tests the complete flow from OpenHands to TIC-80
#
# KNOWN ISSUES:
# - On Linux, OpenHands has connectivity issues between the main container
#   and runtime container due to host.docker.internal resolution problems.
# - Workaround: Use network_mode: host in docker-compose.yml
# - The sample game flow works without OpenHands backend.

set -e

echo "=== AI Game Generator E2E Test ==="
echo ""

# Configuration
OPENHANDS_URL="${OPENHANDS_URL:-http://localhost:3000}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-300}"
POLL_INTERVAL=5

# Check prerequisites
check_prerequisites() {
    echo "1. Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo "ERROR: Docker is not installed"
        exit 1
    fi
    echo "OK: Docker is installed"
    
    # Check if OpenHands container is running
    if ! docker ps | grep -q openhands-backend; then
        echo "WARNING: OpenHands container not running. Starting..."
        docker compose up -d
        sleep 10
    fi
    echo "OK: OpenHands container is running"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo "ERROR: .env file not found"
        exit 1
    fi
    echo "OK: .env file exists"
    echo ""
}

# Configure OpenHands settings
configure_settings() {
    echo "2. Configuring OpenHands settings..."
    
    # Read API key from .env
    OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d= -f2)
    
    # Store settings via API
    RESPONSE=$(curl -s -X POST "${OPENHANDS_URL}/api/settings" \
        -H "Content-Type: application/json" \
        -d "{\"llm_model\":\"openai/gpt-4\",\"llm_api_key\":\"${OPENAI_API_KEY}\",\"agent\":\"CodeActAgent\"}")
    
    if echo "$RESPONSE" | grep -q "Settings stored"; then
        echo "OK: Settings configured"
    else
        echo "ERROR: Failed to configure settings: $RESPONSE"
        exit 1
    fi
    echo ""
}

# Test game generation
test_game_generation() {
    echo "3. Testing game generation..."
    
    PROMPT="Create a simple TIC-80 game in Lua. Save to /workspace/game.lua. Show a bouncing ball using function TIC() as main loop."
    
    # Create conversation
    RESPONSE=$(curl -s -X POST "${OPENHANDS_URL}/api/conversations" \
        -H "Content-Type: application/json" \
        -d "{\"initial_user_msg\":\"$PROMPT\"}")
    
    CONVERSATION_ID=$(echo "$RESPONSE" | grep -o '"conversation_id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$CONVERSATION_ID" ]; then
        echo "ERROR: Failed to create conversation: $RESPONSE"
        exit 1
    fi
    
    echo "  Conversation ID: $CONVERSATION_ID"
    echo "  Waiting for completion..."
    
    # Poll for completion
    START_TIME=$(date +%s)
    while true; do
        CURRENT_TIME=$(date +%s)
        ELAPSED=$((CURRENT_TIME - START_TIME))
        
        if [ $ELAPSED -ge $TIMEOUT_SECONDS ]; then
            echo "ERROR: Timeout waiting for game generation"
            exit 1
        fi
        
        STATUS_RESPONSE=$(curl -s "${OPENHANDS_URL}/api/conversations/${CONVERSATION_ID}")
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        echo "  Status: $STATUS (${ELAPSED}s elapsed)"
        
        if [ "$STATUS" = "STOPPED" ]; then
            echo "OK: Generation completed"
            break
        elif [ "$STATUS" = "ERROR" ]; then
            echo "ERROR: Generation failed"
            exit 1
        fi
        
        sleep $POLL_INTERVAL
    done
    
    # Retrieve generated game code
    echo "  Retrieving game code..."
    GAME_CODE=$(curl -s "${OPENHANDS_URL}/api/conversations/${CONVERSATION_ID}/select-file?file=game.lua")
    
    if echo "$GAME_CODE" | grep -q "function TIC"; then
        echo "OK: Game code contains TIC() function"
    else
        echo "ERROR: Game code missing TIC() function"
        echo "$GAME_CODE"
        exit 1
    fi
    echo ""
}

# Test TIC-80 player files
test_tic80_player() {
    echo "4. Testing TIC-80 player files..."
    
    if [ -f "public/tic80/player.html" ]; then
        echo "OK: player.html exists"
    else
        echo "ERROR: player.html not found"
        exit 1
    fi
    echo ""
}

# Summary
print_summary() {
    echo "=== Manual Testing Steps ==="
    echo "1. Set valid OPENAI_API_KEY in .env"
    echo "2. Run: docker compose up -d"
    echo "3. Run: npm run web"
    echo "4. Open http://localhost:8081"
    echo "5. Enter game idea and click Generate"
    echo "6. Verify game runs in TIC-80 emulator"
    echo "7. Test touch controls"
    echo ""
}

# Main
main() {
    check_prerequisites
    configure_settings
    test_game_generation
    test_tic80_player
    print_summary
    echo "=== Tests completed ==="
}

main "$@"
