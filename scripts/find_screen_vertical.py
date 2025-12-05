#!/usr/bin/env python3
"""Find the exact vertical bounds of the dark green screen."""

from PIL import Image

img = Image.open('assets/phone/phone_dark.png')
pixels = img.load()
width, height = img.size

print(f"Image size: {width}x{height}")
print("\nScanning vertically at center (x={}) for dark green screen:\n".format(width//2))

# Scan vertically at the center to find screen bounds
x = width // 2
screen_top = None
screen_bottom = None

for y in range(height):
    r, g, b = pixels[x, y][:3]
    
    # Check if this is the dark green screen color
    is_screen = (80 <= r <= 95 and 150 <= g <= 165 and 35 <= b <= 50)
    
    if is_screen:
        if screen_top is None:
            screen_top = y
            print(f"Screen TOP found at y={y} ({y/height*100:.2f}%)")
            print(f"  Color: RGB({r}, {g}, {b})")
        screen_bottom = y

if screen_bottom:
    print(f"\nScreen BOTTOM found at y={screen_bottom} ({screen_bottom/height*100:.2f}%)")
    r, g, b = pixels[x, screen_bottom][:3]
    print(f"  Color: RGB({r}, {g}, {b})")
    
    screen_height = screen_bottom - screen_top
    print(f"\nScreen dimensions:")
    print(f"  Top: {screen_top/height*100:.2f}%")
    print(f"  Height: {screen_height/height*100:.2f}%")
    print(f"  Pixels: {screen_height}px tall")
    
    print(f"\nReact Native style:")
    print(f"  top: '{screen_top/height*100:.2f}%',")
    print(f"  height: '{screen_height/height*100:.2f}%',")
else:
    print("No screen found!")
