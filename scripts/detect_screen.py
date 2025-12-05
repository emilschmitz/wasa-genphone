#!/usr/bin/env python3
"""
Simple script to detect the dark green screen area on the phone image.
This helps us position the game screen correctly.
"""

from PIL import Image
import sys

def find_screen_bounds(image_path):
    """Find the bounding box of the dark green screen area."""
    img = Image.open(image_path)
    pixels = img.load()
    width, height = img.size
    
    # Look for the screen in the upper 60% of the image
    search_height = int(height * 0.6)
    
    # Dark green screen color - specifically looking for green dominant
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    found_pixels = 0
    
    for y in range(search_height):
        for x in range(width):
            r, g, b = pixels[x, y][:3]
            
            # Detect DARK GREEN screen area
            # Based on sampled colors: RGB(87, 159, 42) - bright green with dark undertones
            # Allow some tolerance for variations
            if (80 <= r <= 95 and 150 <= g <= 165 and 35 <= b <= 50):
                found_pixels += 1
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    
    if found_pixels > 0:
        # Calculate percentages
        center_x = ((min_x + max_x) / 2) / width * 100
        center_y = ((min_y + max_y) / 2) / height * 100
        screen_width = (max_x - min_x) / width * 100
        screen_height = (max_y - min_y) / height * 100
        
        # Calculate top-left position
        left = (min_x / width) * 100
        top = (min_y / height) * 100
        right = 100 - ((max_x / width) * 100)
        
        print(f"Screen found! {found_pixels} pixels detected")
        print(f"Bounds: ({min_x}, {min_y}) to ({max_x}, {max_y})")
        print(f"Image size: {width}x{height}")
        print(f"\nReact Native styles:")
        print(f"  top: '{top:.2f}%',")
        print(f"  left: '{left:.2f}%',")
        print(f"  right: '{right:.2f}%',")
        print(f"  height: '{screen_height:.2f}%',")
        print(f"\nCenter: ({center_x:.2f}%, {center_y:.2f}%)")
        print(f"Size: {screen_width:.2f}% x {screen_height:.2f}%")
    else:
        print("No dark green screen area found. Trying broader color range...")
        # Try again with broader range
        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y][:3]
                # Very dark colors (likely the screen)
                if r < 60 and g < 60 and b < 60:
                    found_pixels += 1
                    min_x = min(min_x, x)
                    min_y = min(min_y, y)
                    max_x = max(max_x, x)
                    max_y = max(max_y, y)
        
        if found_pixels > 100:  # Need significant area
            left = (min_x / width) * 100
            top = (min_y / height) * 100
            right = 100 - ((max_x / width) * 100)
            screen_height = ((max_y - min_y) / height) * 100
            
            print(f"Dark area found! {found_pixels} pixels")
            print(f"\nReact Native styles:")
            print(f"  top: '{top:.2f}%',")
            print(f"  left: '{left:.2f}%',")
            print(f"  right: '{right:.2f}%',")
            print(f"  height: '{screen_height:.2f}%',")

if __name__ == '__main__':
    image_path = 'assets/phone/phone_dark.png'
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    
    print(f"Analyzing {image_path}...")
    find_screen_bounds(image_path)
