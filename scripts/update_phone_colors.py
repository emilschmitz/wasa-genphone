#!/usr/bin/env python3
# /// script
# dependencies = ["pillow"]
# ///
"""Update all phone images to use the same green color as the JS menu."""

from PIL import Image
import os

# Target color from JS menu: #9bbc0f (Nokia LCD green)
TARGET_GREEN = (155, 188, 15)

def is_screen_color(r, g, b):
    """Check if pixel is a screen color (any variant)."""
    # Nokia LCD green (phone_dark - already updated to #9bbc0f)
    if (150 <= r <= 160 and 185 <= g <= 195 and 10 <= b <= 20):
        return True
    # Cyan/greenish (phone_light) - RGB(0, 179, 94)
    if (r <= 5 and 175 <= g <= 185 and 90 <= b <= 100):
        return True
    # Gray (phone_black) - RGB(180, 180, 180)
    if (175 <= r <= 185 and 175 <= g <= 185 and 175 <= b <= 185):
        return True
    # Blue (phone_pink) - RGB(0, 138, 255)
    if (r <= 5 and 135 <= g <= 145 and 250 <= b <= 260):
        return True
    return False

def update_phone_image(input_path, output_path):
    """Replace old green with new green in phone image, preserving transparency."""
    img = Image.open(input_path)
    
    # Preserve alpha channel if it exists
    if img.mode == 'RGBA':
        img = img.convert('RGBA')
    else:
        img = img.convert('RGB')
    
    pixels = img.load()
    width, height = img.size
    
    changed_pixels = 0
    
    for y in range(height):
        for x in range(width):
            pixel = pixels[x, y]
            
            if img.mode == 'RGBA':
                r, g, b, a = pixel
                if is_screen_color(r, g, b):
                    pixels[x, y] = TARGET_GREEN + (a,)  # Preserve alpha
                    changed_pixels += 1
            else:
                r, g, b = pixel[:3]
                if is_screen_color(r, g, b):
                    pixels[x, y] = TARGET_GREEN
                    changed_pixels += 1
    
    img.save(output_path)
    print(f"Updated {input_path}: {changed_pixels} pixels changed")
    return changed_pixels

if __name__ == '__main__':
    phone_images = [
        'assets/phone/phone_dark.png',
        'assets/phone/phone_light.png',
        'assets/phone/phone_black.png',
        'assets/phone/phone_pink.png',
    ]
    
    print("Updating phone images to use menu green color (#9bbc0f)...\n")
    
    total_changed = 0
    for img_path in phone_images:
        if os.path.exists(img_path):
            changed = update_phone_image(img_path, img_path)
            total_changed += changed
        else:
            print(f"Skipping {img_path} (not found)")
    
    print(f"\nTotal pixels changed: {total_changed}")
    print("All phone images updated!")
