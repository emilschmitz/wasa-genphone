#!/usr/bin/env python3
"""Sample colors from the phone image to find the screen color."""

from PIL import Image

img = Image.open('assets/phone/phone_dark.png')
pixels = img.load()
width, height = img.size

print(f"Image size: {width}x{height}")
print("\nSampling colors from likely screen area (center-top region):")

# Sample from the upper-center area where screen should be
sample_points = [
    (width//2, height//4, "Center top"),
    (width//2, height//3, "Center upper-mid"),
    (width//2 - 50, height//4, "Left of center top"),
    (width//2 + 50, height//4, "Right of center top"),
]

for x, y, label in sample_points:
    r, g, b = pixels[x, y][:3]
    print(f"{label} ({x}, {y}): RGB({r}, {g}, {b})")
    print(f"  Hex: #{r:02x}{g:02x}{b:02x}")
