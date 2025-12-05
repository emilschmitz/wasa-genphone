import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Pressable, ImageBackground, LayoutChangeEvent, TextInput, Image } from 'react-native';
import GameRunner, { GameRunnerRef } from './src/components/GameRunner';
import { SAMPLE_GAME_CODE } from './src/games/sampleGame';
import { OpenHandsService, ConversationStatus } from './src/services/OpenHandsService';
import { DEFAULT_THEME } from './src/config/phoneThemes';
import { DETECTED_BUTTON_POSITIONS } from './src/config/buttonPositions';

// OpenHands backend URL - configure based on your setup
const OPENHANDS_BASE_URL = 'http://localhost:3000';

// Configuration: Enable/disable phone button touch controls
// When false, use keyboard controls (Arrow keys, Space/Enter)
const ENABLE_PHONE_TOUCH_CONTROLS = false;

/**
 * Formats the user's game idea into a comprehensive TIC-80 game generation prompt.
 * Emphasizes single-shot generation and provides clear TIC-80 API guidance.
 */
function formatGamePrompt(userIdea: string): string {
    return `You are a TIC-80 game developer. Create a complete, playable game in Lua based on this description:

${userIdea}

CRITICAL REQUIREMENTS:
- This is a ONE-SHOT generation. You will NOT receive any further feedback or corrections.
- The game MUST be complete and playable when you finish.
- Save the final code to exactly this path: /workspace/game.lua

GAME STYLE CONSTRAINTS:
- Style: Simple Nokia-style phone game (like Snake, Tetris, Pong)
- Keep it minimal - under 150 lines of code if possible
- Use simple shapes (rect, circ, line) rather than complex sprites
- Single-screen gameplay, no scrolling needed
- IMPORTANT: Keep text very limited and use large font sizes - the screen is small!
- Use print(text, x, y, color, fixed, scale) with scale=2 or higher for readable text
- Avoid long text strings - use short labels like "SCORE" not "Your current score is"

TIC-80 API ESSENTIALS:
- Main game loop: function TIC() ... end (called 60 times per second)
- Clear screen: cls(color) where color is 0-15
- Draw rectangle: rect(x, y, width, height, color)
- Draw circle: circ(x, y, radius, color)
- Draw text: print(text, x, y, color)
- Button input: btn(id) returns true if pressed
  - btn(0) = Up, btn(1) = Down, btn(2) = Left, btn(3) = Right
  - btn(4) = Z key (primary action), btn(5) = X key (secondary action)

REQUIRED CODE STRUCTURE:
\`\`\`lua
-- title:  Game Title
-- author: AI Generator
-- desc:   Brief description
-- script: lua

-- Initialize game variables at top level

function TIC()
    cls(0)
    
    -- Handle input with btn()
    -- Update game state
    -- Draw everything
end
\`\`\`

EXAMPLE REFERENCE (Paddle Ball game pattern):
- Variables declared at top level (not inside TIC)
- Input handling: if btn(2) then px=px-3 end
- Collision detection with simple bounds checking
- Score tracking with a variable
- Reset logic when game over condition met

OUTPUT:
- Write ONLY the Lua code to /workspace/game.lua
- No markdown formatting, no explanations
- The file must be immediately runnable in TIC-80

Remember: You must complete the ENTIRE game in one go. When you stop, that's the final product.`;
}

type MenuState = 'main-menu' | 'prompt-input' | 'generating' | 'playing';

export default function App() {
    const [menuState, setMenuState] = useState<MenuState>('main-menu');
    const [selectedMenuOption, setSelectedMenuOption] = useState(0);
    const [prompt, setPrompt] = useState('');
    const [gameCode, setGameCode] = useState<string | null>(null);
    const [binaryCart, setBinaryCart] = useState<Uint8Array | null>(null);
    const [generationStatus, setGenerationStatus] = useState<string>('');
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME);
    const [pressedButtonId, setPressedButtonId] = useState<number | null>(null);
    const [phoneImageDimensions, setPhoneImageDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
    const [screenMarginTop, setScreenMarginTop] = useState(0);

    const gameRunnerRef = useRef<GameRunnerRef>(null);
    
    const menuOptions = ['Generate Game', 'Play Sample Game'];
    const openHandsService = useRef(new OpenHandsService({
        baseUrl: OPENHANDS_BASE_URL,
        timeout: 5 * 60 * 1000, // 5 minutes
    }));

    // Timer that updates every second while generating
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (menuState === 'generating') {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [menuState]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a game idea');
            return;
        }

        setMenuState('generating');
        setError(null);
        setElapsedTime(0);
        setGenerationStatus('Starting game generation...');

        try {
            const formattedPrompt = formatGamePrompt(prompt);
            
            const result = await openHandsService.current.generateGame(
                formattedPrompt,
                'game.lua',
                {
                    onProgress: (_seconds: number, convStatus: ConversationStatus) => {
                        if (convStatus === 'RUNNING') {
                            setGenerationStatus('Your WASA Phone is generating your game...');
                        } else if (convStatus === 'STOPPED') {
                            setGenerationStatus('Generation complete! Loading game...');
                        }
                    },
                }
            );

            if (result.success && result.gameCode) {
                console.log('=== GAME GENERATED SUCCESSFULLY ===');
                console.log('Game code length:', result.gameCode.length);
                console.log('Binary cart size:', result.binaryCart?.length || 0, 'bytes');
                console.log('Game code preview:', result.gameCode.substring(0, 200));
                setGameCode(result.gameCode);
                setBinaryCart(result.binaryCart || null);
                setMenuState('playing');
                setGenerationStatus('');
            } else {
                setError(result.error || 'Failed to generate game');
                setMenuState('main-menu');
                setGenerationStatus('');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setMenuState('main-menu');
            setGenerationStatus('');
        }
    };

    const handleStop = () => {
        setMenuState('main-menu');
        setGameCode(null);
        setBinaryCart(null);
        setError(null);
    };

    const handlePlaySample = () => {
        console.log("=== PLAY SAMPLE GAME CLICKED ===");
        console.log("Current menuState:", menuState);
        console.log("Sample game code length:", SAMPLE_GAME_CODE.length);
        
        // Reset game state first
        console.log("Step 1: Resetting game state...");
        setGameCode(null);
        setBinaryCart(null);
        setMenuState('main-menu');
        
        // Then set new game after a brief delay to ensure reset
        setTimeout(() => {
            console.log("Step 2: Setting sample game code and switching to playing state...");
            setGameCode(SAMPLE_GAME_CODE);
            setBinaryCart(null);
            setMenuState('playing');
            setError(null);
            console.log("=== SAMPLE GAME SHOULD NOW BE LOADING ===");
        }, 100);
    };

    const handleBtnPressIn = useCallback((key: string) => {
        gameRunnerRef.current?.simulateKey(key, 'keydown');
    }, []);

    const handleBtnPressOut = useCallback((key: string) => {
        gameRunnerRef.current?.simulateKey(key, 'keyup');
    }, []);

    // Keyboard controls (when phone touch controls are disabled)
    useEffect(() => {
        if (ENABLE_PHONE_TOUCH_CONTROLS) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (menuState === 'main-menu') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedMenuOption(prev => Math.max(0, prev - 1));
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedMenuOption(prev => Math.min(menuOptions.length - 1, prev + 1));
                } else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    console.log('Selected option:', selectedMenuOption);
                    if (selectedMenuOption === 0) {
                        setMenuState('prompt-input');
                        setPrompt('');
                    } else if (selectedMenuOption === 1) {
                        console.log('Playing sample game');
                        handlePlaySample();
                    }
                }
            } else if (menuState === 'prompt-input') {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setMenuState('main-menu');
                }
            } else if (menuState === 'playing') {
                // Pass through arrow keys and space to game
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'z', 'x'].includes(e.key)) {
                    handleBtnPressIn(e.key);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (menuState === 'playing') {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'z', 'x'].includes(e.key)) {
                    handleBtnPressOut(e.key);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [menuState, selectedMenuOption, menuOptions.length, handleBtnPressIn, handleBtnPressOut, handlePlaySample, handleGenerate]);

    // Handle phone image layout to get dimensions
    const handlePhoneImageLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        console.log('ImageBackground layout:', width, height);
        
        // Calculate actual image dimensions with resizeMode="contain"
        // Phone image is 1184x864, aspect ratio 1.37
        const imageAspect = 1.37;
        const containerAspect = width / height;
        
        let actualImageWidth, actualImageHeight, offsetX, offsetY;
        
        if (containerAspect > imageAspect) {
            // Container is wider - image is constrained by height
            actualImageHeight = height;
            actualImageWidth = height * imageAspect;
            offsetX = (width - actualImageWidth) / 2;
            offsetY = 0;
        } else {
            // Container is taller - image is constrained by width
            actualImageWidth = width;
            actualImageHeight = width / imageAspect;
            offsetX = 0;
            offsetY = (height - actualImageHeight) / 2;
        }
        
        console.log('Actual image:', actualImageWidth, actualImageHeight, 'Offset:', offsetX, offsetY);
        
        setPhoneImageDimensions({ 
            width: actualImageWidth, 
            height: actualImageHeight,
            offsetX,
            offsetY
        });
    }, []);

    // Find nearest button based on touch position
    const findNearestButton = useCallback((touchX: number, touchY: number) => {
        if (phoneImageDimensions.width === 0 || phoneImageDimensions.height === 0) {
            return null;
        }

        let nearestButton = null;
        let minDistance = Infinity;
        let nearestButtonPos = null;

        for (const button of DETECTED_BUTTON_POSITIONS) {
            // Convert percentage to pixels
            const btnX = (parseFloat(button.centerX) / 100) * phoneImageDimensions.width;
            const btnY = (parseFloat(button.centerY) / 100) * phoneImageDimensions.height;

            // Calculate distance
            const distance = Math.sqrt(
                Math.pow(touchX - btnX, 2) + Math.pow(touchY - btnY, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestButton = button;
                nearestButtonPos = { x: btnX, y: btnY };
            }
        }

        console.log('Nearest button:', nearestButton?.label, 'at', nearestButtonPos, 'distance:', minDistance);

        // Only return button if touch is reasonably close (within 15% of image width)
        const maxDistance = phoneImageDimensions.width * 0.15;
        return minDistance < maxDistance ? nearestButton : null;
    }, [phoneImageDimensions]);

    // Handle touch on phone image
    const handlePhoneTouch = useCallback((event: any) => {
        const { locationX, locationY } = event.nativeEvent;
        
        // The phone has a 2x scale transform, so divide by 2 to get actual coordinates
        const scaledX = locationX / 2.0;
        const scaledY = locationY / 2.0;
        
        // Adjust for image offset (resizeMode="contain" centers the image)
        const adjustedX = scaledX - phoneImageDimensions.offsetX;
        const adjustedY = scaledY - phoneImageDimensions.offsetY;
        
        console.log('Touch at:', locationX, locationY, '-> Scaled:', scaledX, scaledY, '-> Adjusted:', adjustedX, adjustedY);
        console.log('Image dims:', phoneImageDimensions);
        
        const button = findNearestButton(adjustedX, adjustedY);
        
        if (button) {
            console.log('Button found:', button.label || button.id, 'Key:', button.key);
            setPressedButtonId(button.id);
            if (button.key) {
                handleBtnPressIn(button.key);
            }
        } else {
            console.log('No button found at this location');
        }
    }, [findNearestButton, handleBtnPressIn, phoneImageDimensions]);

    const handlePhoneTouchEnd = useCallback(() => {
        if (pressedButtonId !== null) {
            const button = DETECTED_BUTTON_POSITIONS.find(b => b.id === pressedButtonId);
            if (button?.key) {
                // Handle menu navigation
                if (menuState === 'main-menu') {
                    if (button.key === 'ArrowUp') {
                        setSelectedMenuOption(prev => Math.max(0, prev - 1));
                    } else if (button.key === 'ArrowDown') {
                        setSelectedMenuOption(prev => Math.min(menuOptions.length - 1, prev + 1));
                    } else if (button.key === 'z') { // A button - select
                        if (selectedMenuOption === 0) {
                            setMenuState('prompt-input');
                            setPrompt(''); // Start with empty prompt for keyboard input
                        } else if (selectedMenuOption === 1) {
                            handlePlaySample();
                        }
                    }
                } else if (menuState === 'prompt-input') {
                    if (button.key === 'z') { // A button - confirm
                        handleGenerate();
                    } else if (button.key === 'x') { // B button - back
                        setMenuState('main-menu');
                    }
                } else if (menuState === 'playing') {
                    // Pass through to game
                    handleBtnPressOut(button.key);
                }
            }
            setPressedButtonId(null);
        }
    }, [pressedButtonId, menuState, selectedMenuOption, menuOptions.length, handleBtnPressOut]);

    // Render menu content based on state
    const renderScreenContent = () => {
        console.log("renderScreenContent called, menuState:", menuState, "gameCode:", gameCode ? `${gameCode.length} chars` : 'null');
        
        if (menuState === 'playing') {
            return <GameRunner ref={gameRunnerRef} gameCode={gameCode} binaryCart={binaryCart} />;
        }

        if (menuState === 'generating') {
            return (
                <View style={styles.menuContainer}>
                    <Text style={styles.menuTitle}>GENERATING...</Text>
                    <Text style={styles.menuText}>{generationStatus}</Text>
                    <Text style={styles.menuText}>{elapsedTime}s</Text>
                </View>
            );
        }

        if (menuState === 'prompt-input') {
            return (
                <View style={styles.menuContainer}>
                    <Text style={styles.menuTitle}>GAME IDEA</Text>
                    <TextInput
                        style={styles.menuInput}
                        value={prompt}
                        onChangeText={setPrompt}
                        placeholder="Snake game..."
                        placeholderTextColor="#306230"
                        autoFocus
                        onSubmitEditing={handleGenerate}
                        blurOnSubmit={true}
                    />
                    <Text style={styles.menuHint}>
                        {ENABLE_PHONE_TOUCH_CONTROLS ? 'A: Generate\nB: Back' : 'Enter: Generate\nEsc: Back'}
                    </Text>
                    {error && <Text style={styles.menuError}>{error}</Text>}
                </View>
            );
        }

        // Main menu
        return (
            <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>WASA GENPHONE</Text>
                {menuOptions.map((option, index) => (
                    <Text
                        key={index}
                        style={[
                            styles.menuOption,
                            selectedMenuOption === index && styles.menuOptionSelected
                        ]}
                    >
                        {selectedMenuOption === index ? '> ' : '  '}{option}
                    </Text>
                ))}
                <Text style={styles.menuHint}>
                    {ENABLE_PHONE_TOUCH_CONTROLS ? '↑↓: Navigate\nA: Select' : 'Arrows: Navigate\nSpace: Select'}
                </Text>
                {error && <Text style={styles.menuError}>{error}</Text>}
            </View>
        );
    };

    return (
        <View 
            style={styles.nokiaPhoneContainer}
            onLayout={(e) => {
                const { height } = e.nativeEvent.layout;
                // Phone image: 1184x864, screen top at 217px = 25.12% of height
                // Container has paddingTop: 80
                // Calculate: (containerHeight * 0.2512) - paddingTop
                const calculatedMargin = (height * 0.2512) - 80;
                setScreenMarginTop(Math.max(0, calculatedMargin));
            }}
        >
            <StatusBar barStyle="light-content" />
            
            {/* Phone image behind everything */}
            <Image 
                source={currentTheme.image} 
                style={styles.phoneBackgroundImage}
                resizeMode="contain"
            />
            
            {/* Working screen structure on top */}
            <View style={[styles.nokiaScreenBezel, { marginTop: screenMarginTop }]}>
                <View style={styles.nokiaScreenInner}>
                    {renderScreenContent()}
                </View>
            </View>
            
            {menuState === 'playing' && (
                <TouchableOpacity 
                    style={{ position: 'absolute', top: 20, right: 20, padding: 10, backgroundColor: 'red', borderRadius: 5, zIndex: 10 }}
                    onPress={handleStop}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>STOP</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    // Menu styles (rendered inside phone screen)
    menuContainer: {
        flex: 1,
        backgroundColor: '#9bbc0f', // Nokia LCD green
        padding: 6,
        justifyContent: 'center',
    },
    menuTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f380f',
        textAlign: 'center',
        marginBottom: 8,
    },
    menuOption: {
        fontSize: 9,
        color: '#0f380f',
        marginVertical: 2,
        fontFamily: 'monospace',
    },
    menuOptionSelected: {
        fontWeight: 'bold',
    },
    menuText: {
        fontSize: 8,
        color: '#0f380f',
        marginVertical: 2,
        fontFamily: 'monospace',
    },
    menuHint: {
        fontSize: 7,
        color: '#306230',
        marginTop: 6,
        fontFamily: 'monospace',
    },
    menuError: {
        fontSize: 7,
        color: '#8b0000',
        marginTop: 4,
        fontFamily: 'monospace',
    },
    menuInput: {
        fontSize: 8,
        color: '#0f380f',
        backgroundColor: '#8fac0f',
        padding: 4,
        borderRadius: 2,
        marginVertical: 4,
        minHeight: 40,
        textAlignVertical: 'top',
        fontFamily: 'monospace',
    },

    // Phone Image Styles
    nokiaPhoneContainer: {
        flex: 1,
        backgroundColor: '#1a1c2c',
        alignItems: 'center',
        justifyContent: 'flex-start', // Move to top
        paddingTop: 80, // Space from top
        padding: 10,
    },
    phoneBackgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.4,
        top: 0,
    },
    phoneImageContainer: {
        width: '100%',
        maxWidth: 800, // Much larger for better visibility
        aspectRatio: 1.37, // Phone image aspect ratio (1184/864 = 1.37)
        transform: [{ scale: 2.0 }], // 2x zoom for much better visibility
    },
    phoneImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    nokiaScreenBezel: {
        // Phone screen: 202x140px, aspect ratio 1.44
        // Phone screen top at 25.12% of phone height (217/864)
        backgroundColor: '#1a252f',
        borderRadius: 8,
        padding: 8,
        width: '100%',
        maxWidth: 300,
        aspectRatio: 1.44, // Phone screen aspect ratio (202/140)
        // marginTop calculated dynamically based on container height
        marginBottom: 8,
        zIndex: 1,
    },
    nokiaScreenInner: {
        flex: 1,
        backgroundColor: '#000',
        borderRadius: 4,
        overflow: 'hidden',
    },
    phoneEjectBtn: {
        position: 'absolute',
        bottom: '5%',
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
    },
    phoneEjectText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
    },
    buttonPressOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 8,
        pointerEvents: 'none',
    },
});
