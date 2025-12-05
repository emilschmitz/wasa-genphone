import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Paths, Directory, File } from 'expo-file-system';
import { Asset } from 'expo-asset';

export interface GameRunnerRef {
    simulateKey: (key: string, type: 'keydown' | 'keyup') => void;
}

interface GameRunnerProps {
    gameCode: string | null;
    binaryCart?: Uint8Array | null;
}

const GameRunner = forwardRef<GameRunnerRef, GameRunnerProps>(({ gameCode, binaryCart }, ref) => {
    const [ready, setReady] = useState(false);
    const [uri, setUri] = useState<string | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const webViewRef = useRef<WebView>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const gameCodeSentRef = useRef(false);

    useImperativeHandle(ref, () => ({
        simulateKey: (key: string, type: 'keydown' | 'keyup') => {
            if (Platform.OS === 'web') {
                if (iframeRef.current && iframeRef.current.contentWindow) {
                    try {
                        (iframeRef.current.contentWindow as any).simulateKey(key, type);
                    } catch (e) {
                        console.error("Failed to simulate key on web:", e);
                    }
                }
            } else {
                if (webViewRef.current) {
                    const script = `
                        if (window.simulateKey) {
                            window.simulateKey('${key}', '${type}');
                        }
                        true;
                    `;
                    webViewRef.current.injectJavaScript(script);
                }
            }
        }
    }));

    useEffect(() => {
        if (Platform.OS === 'web') {
            setUri('/tic80/player.html');
            setReady(true);
            return;
        }

        async function setupTic80() {
            try {
                // Use new expo-file-system API
                const tic80Dir = new Directory(Paths.cache, 'tic80');
                if (!tic80Dir.exists) {
                    tic80Dir.create();
                }

                // Helper to copy file, deleting destination if it exists
                const copyAsset = async (asset: Asset, destName: string) => {
                    await asset.downloadAsync();
                    if (asset.localUri) {
                        const sourceFile = new File(asset.localUri);
                        const destFile = new File(tic80Dir, destName);
                        // Delete destination if it exists
                        if (destFile.exists) {
                            destFile.delete();
                        }
                        sourceFile.copy(destFile);
                        console.log(`Copied ${destName}`);
                    }
                };

                // Copy player.html
                await copyAsset(
                    Asset.fromModule(require('../../assets/tic80/player.html')),
                    'player.html'
                );

                // Copy tic80.wasm
                await copyAsset(
                    Asset.fromModule(require('../../assets/tic80/tic80.wasm')),
                    'tic80.wasm'
                );

                // For tic80.js, we renamed it to tic80.txt to avoid Metro bundling it
                // The .txt extension is in assetExts so it should work as an asset
                try {
                    await copyAsset(
                        Asset.fromModule(require('../../assets/tic80/tic80.txt')),
                        'tic80.js'
                    );
                } catch (jsError) {
                    console.warn("Could not copy tic80.txt, WebView may not work:", jsError);
                }

                const playerFile = new File(tic80Dir, 'player.html');
                setUri(playerFile.uri);
                setReady(true);
            } catch (e) {
                console.error("Failed to setup TIC-80:", e);
            }
        }

        setupTic80();
    }, []);

    // Reset game code sent flag when gameCode or binaryCart changes
    useEffect(() => {
        gameCodeSentRef.current = false;
    }, [gameCode, binaryCart]);

    // Send game code to the player
    const sendGameCode = useCallback(() => {
        // Prefer binaryCart if available, otherwise use gameCode
        const dataToSend = binaryCart || gameCode;
        
        if (!dataToSend) {
            console.log("sendGameCode: No game data available");
            return;
        }
        if (gameCodeSentRef.current) {
            console.log("sendGameCode: Game code already sent, skipping");
            return;
        }
        
        console.log("=== SENDING GAME CODE ===");
        if (binaryCart) {
            console.log("Sending binary cart, size:", binaryCart.length, "bytes");
        } else if (gameCode) {
            console.log("Sending Lua code, length:", gameCode.length);
            console.log("Game code preview:", gameCode.substring(0, 200));
        }
        
        // For binary cart, we need to send the raw Lua code (player.html creates the binary)
        // The player.html already has logic to create binary .tic from Lua code
        const codeToSend = gameCode || '';
        
        if (Platform.OS === 'web') {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                console.log("Sending via postMessage to iframe...");
                iframeRef.current.contentWindow.postMessage(codeToSend, '*');
                gameCodeSentRef.current = true;
                console.log("Game code sent via postMessage (web) - SUCCESS");
            } else {
                console.error("Cannot send: iframe or contentWindow not available");
                console.log("iframeRef.current:", iframeRef.current);
            }
        } else {
            if (webViewRef.current) {
                const script = `
                    (function() {
                        try {
                            console.log("Injecting game code via postMessage...");
                            window.postMessage(${JSON.stringify(codeToSend)}, '*');
                        } catch(e) {
                            console.error("PostMessage failed", e);
                        }
                    })();
                    true;
                `;
                webViewRef.current.injectJavaScript(script);
                gameCodeSentRef.current = true;
                console.log("Game code sent via injectJavaScript (native)");
            }
        }
    }, [gameCode, binaryCart]);

    // For web: listen for ready message from iframe and send game code
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        
        const handleMessage = (event: MessageEvent) => {
            console.log("Received message from iframe:", event.data);
            if (event.data && event.data.type === 'tic80-ready') {
                console.log("TIC-80 player is ready!");
                // Send game code when iframe signals it's ready
                if (gameCode && !gameCodeSentRef.current) {
                    console.log("Sending game code in response to ready message...");
                    sendGameCode();
                }
            }
        };
        
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [gameCode, sendGameCode]);

    // For web: also try sending when iframe loads (fallback)
    useEffect(() => {
        if (Platform.OS === 'web' && ready && iframeLoaded && gameCode) {
            // Give a bit more time for the iframe to set up its listeners
            const timer = setTimeout(() => {
                if (!gameCodeSentRef.current) {
                    console.log("Fallback: sending game code after iframe load delay...");
                    sendGameCode();
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [ready, iframeLoaded, gameCode, sendGameCode]);

    if (!ready || !uri) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#00ff00" />
                <Text style={styles.text}>Loading Engine...</Text>
            </View>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <iframe
                    ref={iframeRef}
                    src={uri}
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
                    onLoad={() => {
                        console.log("=== IFRAME LOADED ===");
                        console.log("iframe src:", uri);
                        console.log("gameCode available:", !!gameCode);
                        console.log("gameCodeSentRef.current:", gameCodeSentRef.current);
                        setIframeLoaded(true);
                        
                        // Give the iframe a moment to initialize its message listeners
                        setTimeout(() => {
                            console.log("Attempting to send game code after 200ms delay...");
                            if (gameCode && iframeRef.current && iframeRef.current.contentWindow && !gameCodeSentRef.current) {
                                console.log("Sending game code to iframe...");
                                iframeRef.current.contentWindow.postMessage(gameCode, '*');
                                gameCodeSentRef.current = true;
                                console.log("Game code sent on iframe load - SUCCESS");
                            } else {
                                console.log("Skipping send - conditions not met");
                                console.log("  gameCode:", !!gameCode);
                                console.log("  iframeRef.current:", !!iframeRef.current);
                                console.log("  contentWindow:", !!(iframeRef.current && iframeRef.current.contentWindow));
                                console.log("  gameCodeSentRef.current:", gameCodeSentRef.current);
                            }
                        }, 200);
                    }}
                />
            </View>
        );
    }

    const handleWebViewLoad = () => {
        console.log("WebView loaded");
        // Small delay to ensure WebView is fully ready
        setTimeout(() => {
            sendGameCode();
        }, 200);
    };

    const handleWebViewMessage = (event: WebViewMessageEvent) => {
        console.log("WebView message:", event.nativeEvent.data);
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ uri: uri }}
                style={styles.webview}
                originWhitelist={['*']}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                androidLayerType="hardware"
                mixedContentMode="always"
                onLoad={handleWebViewLoad}
                onMessage={handleWebViewMessage}
                onError={(e) => console.error("WebView error:", e.nativeEvent)}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1c2c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webview: {
        flex: 1,
        width: '100%',
        backgroundColor: 'transparent',
    },
    text: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
    }
});

export default GameRunner;
