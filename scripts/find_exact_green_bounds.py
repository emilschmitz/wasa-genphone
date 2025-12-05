#!/usr/bin/env python3
"""Find the exact minimal bounding rectangle around ALL dark green pixels."""

from PIL import Image

img = Image.open('assets/phone/phone_dark.png')
pixels = img.load()
width, height = img.size

print(f"Image size: {width}x{height}\n")
print("Scanning entire image for dark green pixels...\n")

# Find the minimal bounding box around ALL green pixels
min_x = width
max_x = 0
min_y = height
max_y = 0
green_pixel_count = 0

for y in range(height):
    for x in range(width):
        r, g, b = pixels[x, y][:3]
        
        # Detect dark green screen color
        is_green = (80 <= r <= 95 and 150 <= g <= 165 and 35 <= b <= 50)
        
        if is_green:
            green_pixel_count += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

if green_pixel_count > 0:
    print(f"Found {green_pixel_count} dark green pixels")
    print(f"\nMinimal bounding rectangle:")
    print(f"  Top-left: ({min_x}, {min_y})")
    print(f"  Bottom-right: ({max_x}, {max_y})")
    print(f"  Size: {max_x - min_x}px × {max_y - min_y}px")
    
    # Calculate percentages
    left_percent = (min_x / width) * 100
    top_percent = (min_y / height) * 100
    right_percent = ((width - max_x) / width) * 100
    width_percent = ((max_x - min_x) / width) * 100
    height_percent = ((max_y - min_y) / height) * 100
    
    print(f"\n{'='*60}")
    print("REACT NATIVE STYLES (exact minimal rectangle):")
    print('='*60)
    print(f"phoneScreenArea: {{")
    print(f"  position: 'absolute',")
    print(f"  top: '{top_percent:.2f}%',")
    print(f"  left: '{left_percent:.2f}%',")
    print(f"  right: '{right_percent:.2f}%',")
    print(f"  height: '{height_percent:.2f}%',")
    print(f"  backgroundColor: 'transparent',")
    print(f"  overflow: 'hidden',")
    print(f"}},")
    
    print(f"\nVerification:")
    print(f"  Width: {width_percent:.2f}% (left {left_percent:.2f}% + right {right_percent:.2f}% = {left_percent + right_percent:.2f}%)")
    print(f"  Should equal: {100 - width_percent:.2f}%")
    
    # Sample some pixels to verify
    print(f"\nSample pixels from detected area:")
    sample_points = [
        (min_x, min_y, "Top-left corner"),
        (max_x, min_y, "Top-right corner"),
        (min_x, max_y, "Bottom-left corner"),
        (max_x, max_y, "Bottom-right corner"),
        ((min_x + max_x)//2, (min_y + max_y)//2, "Center"),
    ]
    
    for x, y, label in sample_points:
        r, g, b = pixels[x, y][:3]
        print(f"  {label}: RGB({r}, {g}, {b})")
else:
    print("No green pixels found!")
