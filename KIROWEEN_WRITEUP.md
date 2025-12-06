## Inspiration
Remember the joy of playing Snake on a Nokia 3310? We wanted to bring back that nostalgic feeling while combining it with modern AI capabilities. WASA GenPhone lets you describe any game idea and watch it come to life on a virtual retro phone - no coding required.

## What it does
WASA GenPhone is a retro phone simulator that generates playable games from text descriptions. Type something like "a pong game" or "space invaders clone" and our AI creates a fully functional TIC-80 game that runs right on the virtual phone screen. It features:
- A beautifully rendered Nokia-style phone interface
- AI-powered game generation using OpenHands
- TIC-80 fantasy console for authentic retro graphics
- Keyboard controls for gameplay
- Sample Snake game to try immediately

## How we built it
- **React Native + Expo** for cross-platform UI
- **TIC-80 WebAssembly** as the game runtime engine
- **OpenHands** AI agent for Lua game code generation
- **Custom phone canvas** with algorithmically-detected screen positioning
- **Python scripts** for phone image processing and button detection

## Challenges we ran into
- Getting the TIC-80 iframe to render properly inside React Native's WebView
- Calculating exact screen positioning to overlay the game on the phone image (lots of math!)
- Handling keyboard input passthrough from React to the TIC-80 iframe
- Making the AI generate games that fit the tiny 240x136 pixel screen with readable text

## Accomplishments that we're proud of
- Pixel-perfect alignment of the game screen with the phone image using calculated percentages
- Seamless integration between React Native, TIC-80 WASM, and OpenHands AI
- The nostalgic feeling when you see your game idea running on a virtual Nokia phone
- Dynamic layout calculations that work across different screen sizes

## What we learned
- TIC-80's binary cartridge format and how to create .tic files programmatically
- The intricacies of iframe communication and keyboard event simulation
- How to use AI agents (OpenHands) for code generation tasks
- CSS/React Native percentage positioning is relative to width for margins (not height!)

## What's next for WASA GenPhone
- Touch controls for mobile devices
- Multiple phone themes/colors (already have the assets!)
- Game saving and sharing
- Multiplayer games via WebRTC
- Voice input for game descriptions
- A gallery of community-generated games
