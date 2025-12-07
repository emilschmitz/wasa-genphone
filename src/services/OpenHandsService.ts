/**
 * OpenHands Service - Communicates with OpenHands REST API
 * 
 * API endpoints used:
 * - POST /api/conversations - Create new conversation with initial prompt
 * - GET /api/conversations/{id} - Get conversation status (poll for completion)
 * - GET /api/conversations/{id}/select-file?file={path} - Retrieve file content
 */

export interface OpenHandsConfig {
    timeout?: number; // milliseconds, default 5 minutes
}

export type ConversationStatus = 'RUNNING' | 'STOPPED' | 'ERROR';

export interface ConversationDetails {
    conversation_id: string;
    title: string;
    status: ConversationStatus;
    created_at: string;
    last_updated_at: string;
    selected_repository: string | null;
    trigger: 'GUI' | 'API';
}

export interface CreateConversationResponse {
    status: string;
    conversation_id: string;
}

export interface FileContentResponse {
    code: string;
}

export interface GameGenerationResult {
    success: boolean;
    gameCode?: string;
    binaryCart?: Uint8Array;
    conversationId?: string;
    error?: string;
    elapsedSeconds?: number;
}

/**
 * Creates a binary .tic cartridge from Lua code
 * Format: 4-byte header + code data
 * Header: [type+bank][size_low][size_high][reserved]
 * CODE chunk type = 5
 */
export function createBinaryTicCart(luaCode: string): Uint8Array {
    // Encode Lua code to bytes
    const encoder = new TextEncoder();
    const codeBytes = encoder.encode(luaCode);
    const codeSize = codeBytes.length;
    
    // Create chunk header: type 5 (CODE), bank 0
    const chunkType = 5; // CODE chunk
    const bank = 0;
    const header = new Uint8Array(4);
    header[0] = (bank << 5) | chunkType; // BBBCCCCC format
    header[1] = codeSize & 0xFF; // size low byte
    header[2] = (codeSize >> 8) & 0xFF; // size high byte
    header[3] = 0; // reserved
    
    // Combine header and code
    const cartData = new Uint8Array(header.length + codeBytes.length);
    cartData.set(header, 0);
    cartData.set(codeBytes, header.length);
    
    return cartData;
}

export interface PollingCallbacks {
    onProgress?: (elapsedSeconds: number, status: ConversationStatus) => void;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 3000; // 3 seconds

export class OpenHandsService {
    private config: OpenHandsConfig;

    constructor(config: OpenHandsConfig) {
        this.config = {
            ...config,
            timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
        };
    }

    /**
     * Make API request through backend proxy (avoids CORS, keeps API key secure)
     */
    private async proxyFetch(path: string, options: RequestInit = {}): Promise<Response> {
        return fetch('/api/openhands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path,
                method: options.method || 'GET',
                body: options.body ? JSON.parse(options.body as string) : undefined,
            }),
        });
    }

    /**
     * Create a new conversation with an initial prompt
     */
    async createConversation(initialMessage: string): Promise<CreateConversationResponse> {
        try {
            const response = await this.proxyFetch('/api/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    initial_user_msg: initialMessage,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Failed to create conversation: ${response.status} ${response.statusText}`
                );
            }

            const data: CreateConversationResponse = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(`Conversation creation failed with status: ${data.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    /**
     * Get the current status of a conversation
     */
    async getConversationStatus(conversationId: string): Promise<ConversationDetails> {
        try {
            const response = await this.proxyFetch(`/api/conversations/${conversationId}`, {
                method: 'GET',
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Conversation not found: ${conversationId}`);
                }
                throw new Error(`Failed to get conversation status: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting conversation status:', error);
            throw error;
        }
    }

    /**
     * Retrieve file content from the conversation workspace
     */
    async getFileContent(conversationId: string, filePath: string): Promise<string> {
        try {
            const response = await this.proxyFetch(
                `/api/conversations/${conversationId}/select-file?file=${encodeURIComponent(filePath)}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                if (response.status === 415) {
                    throw new Error(`Unable to open binary file: ${filePath}`);
                }
                if (response.status === 500) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Error opening file: ${filePath}`);
                }
                throw new Error(`Failed to get file content: ${response.status} ${response.statusText}`);
            }

            const data: FileContentResponse = await response.json();
            return data.code;
        } catch (error) {
            console.error('Error getting file content:', error);
            throw error;
        }
    }


    /**
     * Poll for conversation completion
     * Returns when agent finishes (awaiting_user_input), status is STOPPED, or timeout is reached
     */
    async pollForCompletion(
        conversationId: string,
        callbacks?: PollingCallbacks
    ): Promise<ConversationDetails> {
        const startTime = Date.now();
        const timeout = this.config.timeout ?? DEFAULT_TIMEOUT_MS;

        while (true) {
            const elapsedMs = Date.now() - startTime;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);

            // Check timeout
            if (elapsedMs >= timeout) {
                throw new Error(
                    `Timeout waiting for conversation completion after ${Math.floor(timeout / 1000)} seconds`
                );
            }

            // Get current status
            const details = await this.getConversationStatus(conversationId);

            // Notify progress callback
            if (callbacks?.onProgress) {
                callbacks.onProgress(elapsedSeconds, details.status);
            }

            // Check if finished
            if (details.status === 'STOPPED') {
                return details;
            }

            // Check for error status (treating as a terminal state)
            // Note: OpenHands API uses RUNNING/STOPPED, but we handle ERROR defensively
            if (details.status === 'ERROR') {
                throw new Error('Conversation ended with error status');
            }

            // Check events for agent_state_changed to awaiting_user_input (task complete)
            if (details.status === 'RUNNING') {
                const isComplete = await this.checkAgentComplete(conversationId);
                if (isComplete) {
                    console.log('Agent finished (awaiting_user_input), task complete');
                    return details;
                }
            }

            // Wait before next poll
            await this.sleep(POLL_INTERVAL_MS);
        }
    }

    /**
     * High-level method: Generate a game from a prompt
     * Creates conversation, polls for completion, retrieves game code
     * Returns both raw Lua code and binary .tic cartridge
     */
    async generateGame(
        prompt: string,
        gameFilePath: string = 'game.lua',
        callbacks?: PollingCallbacks
    ): Promise<GameGenerationResult> {
        const startTime = Date.now();

        try {
            // Step 1: Create conversation with the prompt
            const createResponse = await this.createConversation(prompt);
            const conversationId = createResponse.conversation_id;

            // Step 2: Poll for completion (waits for agent to finish)
            await this.pollForCompletion(conversationId, callbacks);

            // Step 3: Retrieve the generated game file
            const gameCode = await this.getFileContent(conversationId, gameFilePath);

            // Step 4: Convert Lua code to binary .tic cartridge
            const binaryCart = createBinaryTicCart(gameCode);

            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

            return {
                success: true,
                gameCode,
                binaryCart,
                conversationId,
                elapsedSeconds,
            };
        } catch (error) {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            return {
                success: false,
                error: errorMessage,
                elapsedSeconds,
            };
        }
    }

    /**
     * Check if agent has finished by looking at events for awaiting_user_input state
     */
    private async checkAgentComplete(conversationId: string): Promise<boolean> {
        try {
            const response = await this.proxyFetch(
                `/api/conversations/${conversationId}/events`,
                { method: 'GET' }
            );
            if (!response.ok) return false;
            
            const data = await response.json();
            const events = data.events || [];
            
            // Look for the most recent agent_state_changed event
            for (let i = events.length - 1; i >= 0; i--) {
                const event = events[i];
                if (event.observation === 'agent_state_changed' && 
                    event.extras?.agent_state === 'awaiting_user_input') {
                    return true;
                }
            }
            return false;
        } catch {
            return false;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
