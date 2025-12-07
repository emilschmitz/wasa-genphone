# Implementation Plan

- [x] 1. Get sample game running in TIC-80 emulator
  - [x] 1.1 Debug GameRunner component
    - Verify TIC-80 assets are loading correctly (player.html, tic80.js, tic80.wasm)
    - Check WebView/iframe is rendering properly
    - Test postMessage communication for injecting game code
    - _Requirements: 1.4, 5.3, 5.4_
  
  - [x] 1.2 Test sample game loading
    - Verify SAMPLE_GAME_CODE loads into TIC-80
    - Debug any errors in console/logs
    - Ensure game renders and responds to input
    - **Note**: Sample game is Snake - same code as generated-games/snake-c199192c.lua
    - _Requirements: 5.3, 5.4, 6.3, 6.4_
  
  - [x] 1.3 Fix any TIC-80 integration issues (Prob deprecated)
    - Fix asset paths if needed
    - Fix WebView configuration if needed
    - Ensure simulateKey works for button input
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 1.4 Fix automatic game code loading into TIC-80
    - **Solution**: Create binary .tic cartridge files programmatically in JavaScript
    - **Implementation**: 
      - TIC-80 free version only supports binary .tic or .png cartridges (text .lua files require PRO)
      - Implemented binary .tic file format per specification: 4-byte header + code data
      - CODE chunk (type 5): [type+bank][size_low][size_high][reserved][lua_code_bytes]
      - Cart written to Emscripten VFS and loaded via `Module.arguments = ['--skip', 'game.tic']`
    - **Files Modified**: `public/tic80/player.html`, `assets/tic80/player.html`
    - _Requirements: 5.3, 5.4_

- [x] 1.5 Integrate generated games with binary .tic format
  - **Context**: Now that we can load binary .tic carts, we need to apply this to OpenHands-generated games
  - **Implementation Steps**:
    - Update `OpenHandsService.ts` to convert retrieved Lua code to binary .tic format
    - Create helper function `createBinaryTicCart(luaCode: string): Uint8Array` 
    - Apply same binary cart creation logic used in player.html
    - Pass binary cart data to GameRunner instead of raw Lua string
    - Update GameRunner to handle binary cart data if needed
  - **Testing**: Generate a game via OpenHands and verify it loads and runs in TIC-80
  - _Requirements: 2.2, 5.3, 5.4_
q
- [x] 2. Rewrite OpenHandsService to use correct OpenHands REST API
  - [x] 2.1 Update API endpoints to match actual OpenHands API
    - Change from `/api/v1/sessions` to `/api/conversations`
    - Use `POST /api/conversations` with `initial_user_msg` to create conversation
    - Use `GET /api/conversations/{id}` to poll for completion status
    - Use `GET /api/conversations/{id}/select-file?file=game.lua` to retrieve game code
    - _Requirements: 3.1, 3.2, 5.1, 5.2_
  
  - [x] 2.2 Remove API key from frontend config
    - Remove `llmApiKey` and `llmModel` from `OpenHandsConfig` interface
    - Keep only `baseUrl` in config (API key is in Docker container env vars)
    - _Requirements: 7.4_
  
  - [x] 2.3 Implement polling for conversation completion
    - Poll `GET /api/conversations/{id}` until status is FINISHED or ERROR
    - Add timeout handling (e.g., 5 minutes max)
    - put a counter of time in the frontend
    - Handle ERROR status gracefully
    - _Requirements: 2.3, 5.1_

- [x] 3. Update App.tsx for new API flow
  - [x] 3.1 Remove API key input from UI
    - Remove `apiKey` state and TextInput
    - Remove API key validation from `handleGenerate()`
    - _Requirements: 7.4_
  
  - [x] 3.2 Update handleGenerate to use new OpenHandsService
    - Create conversation with formatted prompt
    - Poll for completion
    - Make sure to always read the openhands docs and not make assumptions about functionality
    - When the agent has completetd, retrieve game.lua file content
    - Load into GameRunner
    - _Requirements: 2.2, 5.3, 5.4_
  
  - [x] 3.3 Improve prompt template
    - Add TIC-80 specific instructions
    - Take note from the sample game(s) of what is required for a game to run successfully
    - Emphasize single-shot generation (no further feedback)
    - Specify exact file path: `/workspace/game.lua`
    - Add Nokia-style game constraints
    - _Requirements: 4.4_

- [x] 4. Create Docker setup for OpenHands backend
  - [x] 4.1 Create docker-compose.yml
    - Use official OpenHands image: `docker.openhands.dev/openhands/openhands:0.62`
    - Set SANDBOX_RUNTIME_CONTAINER_IMAGE for runtime
    - Configure LLM_API_KEY and LLM_MODEL from .env
    - Mount docker.sock for sandbox containers
    - Expose port 3000
    - _Requirements: 3.4, 4.1, 4.2, 7.1, 7.3_
  
  - [x] 4.2 Update .env.sample
    - Add LLM_MODEL with default (e.g., anthropic/claude-sonnet-4-20250514 or openai/gpt-4)
    - _Requirements: 7.1, 7.2_

- [x] 5. Enhance Nokia-style phone UI styling
  - [x] 5.1 Improve phone canvas visual design
    - Update colors/borders to look more Nokia 3310-like
    - Brand as "Wasa GenPhone"
    - Add numpad layout (2/4/6/8 as arrows)
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.2 Improve button controls
    - Add visual feedback on press
    - _Requirements: 6.1, 6.2_

- [x] 6. Test end-to-end flow
  - Start OpenHands Docker container
  - Test game generation with simple prompt
  - Verify game loads and runs in TIC-80
  - Verify touch controls work
  - Test error scenarios (backend down, timeout)
  - _Requirements: All requirements_

- [ ]* 7. Documentation (optional)
  - [ ]* 7.1 Add README section for setup
    - Document Docker setup steps
    - Explain environment variables
    - _Requirements: 3.4, 7.1_

- [ ]* 8. Frontend API key fallback (optional)
  - [ ]* 8.1 Add API key validation check on startup
    - Backend checks if OpenHands settings have valid API key
    - Create endpoint `/api/config/status` to report if API key is configured
    - _Requirements: 7.1, 7.4_
  
  - [ ]* 8.2 Add API key input modal in frontend
    - Show modal if backend reports no API key configured
    - Allow user to enter their OpenAI API key
    - Store in OpenHands settings via API call
    - Persist in localStorage for convenience
    - _Requirements: 7.4_

- [ ]* 9. AWS Deployment (optional)
  - [ ]* 9.1 Containerize frontend app
    - Create Dockerfile for React/Expo web build
    - Build static assets for production
    - _Requirements: 7.3_
  
  - [ ]* 9.2 Set up AWS infrastructure
    - Create ECS cluster or EC2 instance for OpenHands container
    - Set up Application Load Balancer
    - Configure security groups for ports 3000 (OpenHands) and 80/443 (frontend)
    - _Requirements: 7.3_
  
  - [ ]* 9.3 Deploy OpenHands to AWS
    - Push OpenHands image to ECR or use public image
    - Configure ECS task definition with environment variables
    - Handle Docker-in-Docker for OpenHands sandbox (may need EC2 with Docker)
    - _Requirements: 3.4, 7.3_
  
  - [ ]* 9.4 Deploy frontend to AWS
    - Host static frontend on S3 + CloudFront, or serve from same container
    - Configure CORS for OpenHands API access
    - Set up custom domain (optional)
    - _Requirements: 7.3_
  
  - [ ]* 9.5 Production configuration
    - Set up secrets management (AWS Secrets Manager) for API keys
    - Configure auto-scaling if needed
    - Set up monitoring/logging (CloudWatch)
    - _Requirements: 7.1, 7.3, 7.4_

- [ ] 10. Game sharing and leaderboard (optional - Supabase)
  - [ ] 10.1 Set up Supabase project
    - Create free-tier Supabase project
    - Set up rate limiting and row-level security
    - Configure spending alerts/limits to avoid surprise bills
    - _Requirements: 7.3_
  
  - [ ] 10.2 Create database schema
    - `games` table: id, prompt, lua_code, creator_name, created_at, play_count
    - `scores` table: id, game_id, player_name, score, created_at
    - Add indexes for leaderboard queries
    - _Requirements: 7.3_
  
  - [ ] 10.3 Implement game sharing
    - Generate shareable URL/code for each game
    - Add "Share Game" button after generation
    - Load shared games by URL parameter
    - _Requirements: 7.3_
  
  - [ ] 10.4 Implement leaderboard
    - Add score submission when game ends (if game reports score)
    - Display top scores per game
    - Display global "most played games" list
    - _Requirements: 7.3_
  
  - [ ]* 10.5 Add browse/discover games page
    - List recently created games
    - Show popular games by play count
    - Allow playing any shared game
    - _Requirements: 7.3_

- [x] 11. Visual UI improvements for phone interface
  - [x] 11.1 Replace phone body with custom canvas image
    - Move `phone_canvas.png` to `assets/` directory
    - Use as background image for phone body instead of styled View
    - Ensure image scales properly for different screen sizes
    - _Requirements: 1.1, 1.2_
  
  - [x] 11.2 Zoom in phone screen for better visibility
    - Increase scale of entire phone interface (1.2x-1.5x)
    - Ensure TIC-80 screen content is readable
    - Adjust layout to fit zoomed phone on screen
    - Consider adding pinch-to-zoom or fixed larger scale
    - _Requirements: 1.2, 6.3_
  
  - [x] 11.3 Add button press visual feedback
    - Implement press state animation/visual change for buttons
    - Options:
      - If `phone_canvas.png` has separate button states: swap images on press
      - If single image: add overlay effect (darker shade, scale transform, shadow)
      - Use React Native Animated API or transform styles
    - Apply to all interactive buttons (numpad, action buttons, eject)
    - _Requirements: 6.1, 6.2_
  
  - [x] 11.4 Move main menu into phone canvas
    - Redesign initial menu (prompt input, generate button) to fit within phone screen
    - Make menu navigable with phone buttons only (no touch input on menu)
    - Button mapping:
      - Up/Down: Navigate menu options
      - A button (Z): Select/confirm
      - B button (X): Back/cancel
    - Menu should render inside TIC-80 canvas or as overlay on phone screen
    - Remove external form UI, keep everything within phone interface
    - _Requirements: 1.1, 1.2, 6.1, 6.2_
  
  - [x] 11.5 Implement in-game menu system for fornend user
    - Create menu state machine: 'main-menu' | 'generating' | 'playing'
    - Main menu options:
      - "Generate Game" (opens prompt input)
      - "Play Sample Game"
      - "Exit" (optional)
    - Prompt input: Use on-screen keyboard or simple text entry within canvas
    - Show generation progress within phone screen (timer, status text)
    - All interactions via phone buttons only
    - _Requirements: 1.1, 1.2, 2.2, 6.1, 6.2_

- [ ] 12. Integrate new phone canvas UI
  - [ ] 12.1 Replace current UI with phone canvas image
    - Use phone image from `assets/phone/` as main UI background
    - Remove old Nokia-style styled components
    - Implement phone theme selector (light, dark, black, pink)
    - Scale phone image to fit screen appropriately
    - _Requirements: 1.1, 1.2_
  
  - [ ] 12.2 Implement button detection system
    - Use `src/config/phoneButtons.ts` for button positions
    - Implement click/touch handler that calls `findNearestButton()`
    - Map detected buttons to game controls using button.key
    - Add visual feedback on button press (highlight/animation)
    - Test button detection at different phone scales
    - _Requirements: 6.1, 6.2_
  
  - [ ] 12.3 Move menu UI inside phone screen area
    - Render main menu within the phone's screen region (top portion)
    - Menu should be navigable with phone buttons (Up/Down/Select)
    - Display game generation status inside phone screen
    - Show timer and progress within phone screen during generation
    - Remove external form UI completely
    - _Requirements: 1.1, 1.2, 2.2_
  
  - [ ] 12.4 Adapt GameRunner to phone screen area
    - Position TIC-80 canvas within phone screen bounds
    - Calculate screen area from phone image dimensions
    - Ensure game renders in correct position regardless of phone scale
    - Test with different phone themes to ensure consistency
    - _Requirements: 5.3, 5.4, 6.3_
  
  - [ ] 12.5 Update button mappings for new layout
    - Map directional buttons (Up/Down/Left/Right) to TIC-80 controls
    - Remove old A/B action buttons (not in new layout)
    - Update key simulation to work with new button detection
    - Test all button inputs work correctly in games
    - _Requirements: 6.1, 6.2, 6.3, 6.4_


- [ ] 13. Fix screen alignment across different browsers/devices
  - **Problem**: TIC-80 game screen aligns correctly on developer's screen but misaligns on other devices
  - **Root Cause**: Screen positioning uses hardcoded calculation based on container height instead of actual phone image dimensions
  - **Constraint**: Cannot use absolute positioning - TIC-80 canvas requires being in document flow to render properly
