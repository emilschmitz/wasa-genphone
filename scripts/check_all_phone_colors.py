#!/usr/bin/env python3
# /// script
# dependencies = ["pillow"]
# ///
"""Check what green colors exist in all phone images."""

from PIL import Image

phone_images = [
    'assets/phone/phone_dark.png',
    'assets/phone/phone_light.png',
    'assets/phone/phone_black.png',
    'assets/phone/phone_pink.png',
]

for img_path in phone_images:
    print(f"\n{'='*60}")
    print(f"Analyzing: {img_path}")
    print('='*60)
    
    img = Image.open(img_path)
    pixels = img.load()
    width, height = img.size
    
    # Sample center area
    center_x = width // 2
    center_y = height // 3
    
    print(f"Center sample ({center_x}, {center_y}):")
    r, g, b = pixels[center_x, center_y][:3]
    print(f"  RGB({r}, {g}, {b}) = #{r:02x}{g:02x}{b:02x}")
    
    # Find all unique greenish colors
    green_colors = {}
    for y in range(0, height, 5):
        for x in range(0, width, 5):
            r, g, b = pixels[x, y][:3]
            # Look for any greenish color (g > r and g > b)
            if g > r and g > b and g > 100:
                color = (r, g, b)
                green_colors[color] = green_colors.get(color, 0) + 1
    
    if green_colors:
        print(f"\nFound {len(green_colors)} greenish colors:")
        for color, count in sorted(green_colors.items(), key=lambda x: -x[1])[:5]:
            r, g, b = color
            print(f"  RGB({r}, {g}, {b}) = #{r:02x}{g:02x}{b:02x} ({count} samples)")
