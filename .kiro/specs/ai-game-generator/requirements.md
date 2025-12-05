# Requirements Document

## Introduction

This feature enables users to generate playable retro-style games for a Nokia-inspired phone interface using natural language prompts. The system consists of a React Native frontend displaying a phone canvas with interactive buttons, and an OpenHands backend that generates TIC-80 games via OpenAI's latest Codex model. Users submit game prompts through the frontend, which communicates with the containerized backend to receive generated game files that run within the TIC-80 emulator embedded in the phone interface.

## Glossary

- **Frontend**: The React Native mobile application that displays the phone interface and handles user interactions
- **Backend**: The containerized OpenHands service that processes game generation requests
- **TIC-80**: A fantasy computer emulator for making, playing, and sharing tiny retro-style games
- **Phone Canvas**: The visual representation of a Nokia-style phone with screen and buttons in the Frontend
- **Game Prompt**: A natural language description provided by the user to specify the desired game
- **OpenHands**: An AI-powered development agent that generates code based on prompts
- **Codex Model**: OpenAI's code generation model used by the Backend to create game code
- **Game Package**: The generated TIC-80 game file(s) returned by the Backend to the Frontend

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a retro Nokia-style phone interface on my Android device, so that I can interact with generated games in a nostalgic way

#### Acceptance Criteria

1. THE Frontend SHALL render a canvas displaying a Nokia-style phone interface with a game screen area and physical button layout
2. THE Frontend SHALL display touch-responsive buttons that map to traditional phone controls (directional pad, action buttons)
3. THE Frontend SHALL maintain the phone interface visual style throughout the user session
4. THE Phone Canvas SHALL provide a dedicated area for rendering TIC-80 game output (ie the display)

### Requirement 2

**User Story:** As a user, I want to enter a natural language prompt describing a game I want to play, so that the system can generate a custom game for me

#### Acceptance Criteria

1. THE Frontend SHALL provide an input interface for the user to enter a Game Prompt
2. WHEN the user submits a Game Prompt, THE Frontend SHALL send an HTTP request to the Backend containing the prompt text
3. THE Frontend SHALL display a loading indicator WHILE the Backend processes the game generation request
4. THE Frontend SHALL handle network errors and display appropriate error messages to the user

### Requirement 3

**User Story:** As a developer, I want the backend to receive game generation requests via HTTP, so that the system can process prompts independently of the frontend

#### Acceptance Criteria

1. THE Backend SHALL expose an HTTP endpoint that accepts game generation requests
2. WHEN the Backend receives a game generation request, THE Backend SHALL extract the Game Prompt from the request payload
3. THE Backend SHALL validate the incoming request format and return appropriate HTTP status codes
4. THE Backend SHALL run within a Docker container for consistent deployment

### Requirement 4

**User Story:** As a developer, I want the backend to use OpenAI's latest Codex model to generate TIC-80 game code, so that the generated games are functional and match user prompts

#### Acceptance Criteria

1. THE Backend SHALL configure OpenHands to use OpenAI's latest Codex model for code generation
2. THE Backend SHALL retrieve the OpenAI API key from environment variables
3. WHEN processing a Game Prompt, THE Backend SHALL invoke OpenHands with the prompt to generate TIC-80 game code
4. THE Backend SHALL format the Game Prompt appropriately for TIC-80 game generation context. It must make it clear that the game must be generated in one single go, without further user interaction. When the agent stops generating, that will be the final product. it must also make sure to specify exactly where and how the agent shall save the game, so that it can be sent back once the generation completes.
5. The coding agent shall have access to whatever tool we can easily give it. Especially important are: bash, context7, if possible.

### Requirement 5

**User Story:** As a user, I want to receive the generated game file so that I can play it on the phone interface

#### Acceptance Criteria

1. WHEN game generation completes successfully, THE Backend SHALL package the generated TIC-80 game code into a Game Package
2. THE Backend SHALL return the Game Package in the HTTP response to the Frontend
3. THE Frontend SHALL receive the Game Package and load it into the TIC-80 emulator
4. THE Frontend SHALL display the generated game within the Phone Canvas game screen area

### Requirement 6

**User Story:** As a user, I want to control the generated game using the phone's touch buttons, so that I can play the game naturally

#### Acceptance Criteria

1. WHEN the user touches a button on the Phone Canvas, THE Frontend SHALL translate the touch input to corresponding TIC-80 input events
2. THE Frontend SHALL pass input events to the TIC-80 emulator in real-time
3. THE TIC-80 emulator SHALL process input events and update the game state accordingly
4. THE Phone Canvas SHALL display the updated game output from the TIC-80 emulator

### Requirement 7

**User Story:** As a developer, I want to configure the OpenAI API key via environment variables, so that credentials are managed securely

#### Acceptance Criteria

1. THE Backend SHALL read the OpenAI API key from an environment variable at startup
2. THE Backend SHALL fail gracefully with a clear error message IF the API key environment variable is not set
3. THE Backend SHALL pass the API key to OpenHands for authentication with OpenAI services
4. THE Backend SHALL NOT log or expose the API key in responses or error messages
