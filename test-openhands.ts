/**
 * Test OpenHands API - Create a poem file and retrieve it
 */

const OPENHANDS_API_KEY = process.env.OPENHANDS_API_KEY;
const BASE_URL = 'https://app.all-hands.dev';

if (!OPENHANDS_API_KEY) {
    console.error('❌ OPENHANDS_API_KEY environment variable is not set');
    console.error('   Run: export OPENHANDS_API_KEY=your-key-here');
    process.exit(1);
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPoemGeneration() {
    console.log('Testing OpenHands API - Poem Generation\n');
    
    try {
        // Step 1: Create conversation to write a poem
        console.log('1. Creating conversation to write a poem...');
        const response = await fetch(`${BASE_URL}/api/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-API-Key': OPENHANDS_API_KEY,
            },
            body: JSON.stringify({
                initial_user_msg: 'Write a short poem about coding and save it to a file called poem.txt',
                // Note: Model is configured in account settings, not per-conversation
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create conversation: ${response.status}\n${errorText}`);
        }

        const data = await response.json();
        console.log('✓ Conversation created!');
        console.log('  ID:', data.conversation_id);
        
        const conversationId = data.conversation_id;
        
        // Step 2: Poll for completion
        console.log('\n2. Waiting for agent to complete task...');
        let attempts = 0;
        const maxAttempts = 40; // 40 * 5s = 200s max
        let isComplete = false;
        
        while (attempts < maxAttempts && !isComplete) {
            await sleep(5000);
            attempts++;
            
            const statusResponse = await fetch(`${BASE_URL}/api/conversations/${conversationId}`, {
                method: 'GET',
                headers: {
                    'X-Session-API-Key': OPENHANDS_API_KEY,
                },
            });
            
            if (!statusResponse.ok) {
                throw new Error(`Status check failed: ${statusResponse.status}`);
            }
            
            const statusData = await statusResponse.json();
            console.log(`  [${attempts}] Status: ${statusData.status}`);
            
            // Check if stopped
            if (statusData.status === 'STOPPED') {
                console.log('✓ Agent finished!');
                isComplete = true;
                break;
            }
            
            // Check if agent is awaiting user input (task complete)
            const eventsResponse = await fetch(
                `${BASE_URL}/api/conversations/${conversationId}/events`,
                {
                    method: 'GET',
                    headers: {
                        'X-Session-API-Key': OPENHANDS_API_KEY,
                    },
                }
            );
            
            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                const events = eventsData.events || [];
                
                // Look for awaiting_user_input state
                for (let i = events.length - 1; i >= 0; i--) {
                    const event = events[i];
                    if (event.observation === 'agent_state_changed' && 
                        event.extras?.agent_state === 'awaiting_user_input') {
                        console.log('✓ Agent finished (awaiting user input)!');
                        isComplete = true;
                        break;
                    }
                }
            }
        }
        
        if (!isComplete) {
            throw new Error('Timeout waiting for agent to complete');
        }
        
        // Step 3: Retrieve the poem file
        console.log('\n3. Retrieving poem.txt...');
        const fileResponse = await fetch(
            `${BASE_URL}/api/conversations/${conversationId}/select-file?file=poem.txt`,
            {
                method: 'GET',
                headers: {
                    'X-Session-API-Key': OPENHANDS_API_KEY,
                },
            }
        );
        
        if (!fileResponse.ok) {
            const errorText = await fileResponse.text();
            throw new Error(`Failed to get file: ${fileResponse.status}\n${errorText}`);
        }
        
        const fileData = await fileResponse.json();
        console.log('✓ File retrieved successfully!\n');
        console.log('=== poem.txt ===');
        console.log(fileData.code);
        console.log('================\n');
        
        console.log('✅ All tests passed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

testPoemGeneration();
