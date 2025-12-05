#!/usr/bin/env python3
"""Detailed analysis of the screen area including bezels."""

from PIL import Image

img = Image.open('assets/phone/phone_dark.png')
pixels = img.load()
width, height = img.size

print(f"Image size: {width}x{height}\n")

# Scan multiple vertical lines to get a better picture
x_positions = [width//2 - 50, width//2, width//2 + 50]

for x in x_positions:
    print(f"\n{'='*60}")
    print(f"Scanning at x={x} ({x/width*100:.1f}%)")
    print('='*60)
    
    in_screen = False
    screen_start = None
    screen_end = None
    
    for y in range(0, height, 10):  # Sample every 10 pixels
        r, g, b = pixels[x, y][:3]
        
        # Check if this is the dark green screen color
        is_green_screen = (80 <= r <= 95 and 150 <= g <= 165 and 35 <= b <= 50)
        
        if is_green_screen and not in_screen:
            screen_start = y
            in_screen = True
            print(f"\n>>> SCREEN STARTS at y={y} ({y/height*100:.2f}%)")
            print(f"    RGB({r}, {g}, {b})")
        elif not is_green_screen and in_screen:
            screen_end = y
            in_screen = False
            print(f"<<< SCREEN ENDS at y={y} ({y/height*100:.2f}%)")
            print(f"    RGB({r}, {g}, {b})")
            if screen_start:
                screen_height = screen_end - screen_start
                print(f"    Screen height: {screen_height}px ({screen_height/height*100:.2f}%)")
        
        # Show some context
        if y % 50 == 0:
            marker = "🟢" if is_green_screen else "  "
            print(f"{marker} y={y:3d} ({y/height*100:5.1f}%): RGB({r:3d}, {g:3d}, {b:3d})")

print("\n" + "="*60)
print("RECOMMENDATION:")
print("="*60)

# Final scan for exact bounds
x = width // 2
screen_top = None
screen_bottom = None

for y in range(height):
    r, g, b = pixels[x, y][:3]
    is_screen = (80 <= r <= 95 and 150 <= g <= 165 and 35 <= b <= 50)
    
    if is_screen:
        if screen_top is None:
            screen_top = y
        screen_bottom = y

if screen_top and screen_bottom:
    # Add a small margin to account for bezel
    margin_top = 5  # pixels
    margin_bottom = 5
    
    adjusted_top = screen_top + margin_top
    adjusted_bottom = screen_bottom - margin_bottom
    adjusted_height = adjusted_bottom - adjusted_top
    
    print(f"\nDetected screen (with bezel):")
    print(f"  top: '{screen_top/height*100:.2f}%'")
    print(f"  height: '{(screen_bottom-screen_top)/height*100:.2f}%'")
    
    print(f"\nAdjusted screen (usable area, excluding bezel):")
    print(f"  top: '{adjusted_top/height*100:.2f}%'")
    print(f"  height: '{adjusted_height/height*100:.2f}%'")
