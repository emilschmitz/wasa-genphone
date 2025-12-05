#!/usr/bin/env python3
# /// script
# dependencies = ["pillow"]
# ///
"""Find the maximal inscribed rectangle inside the green screen area."""

from PIL import Image

def is_green_pixel(r, g, b):
    """Check if pixel is dark green screen color."""
    return (80 <= r <= 95 and 150 <= g <= 165 and 35 <= b <= 50)

def find_maximal_rectangle(image_path):
    """Find the largest rectangle that fits inside the green screen area."""
    img = Image.open(image_path)
    pixels = img.load()
    width, height = img.size
    
    print(f"Image size: {width}x{height}\n")
    
    # First, find all green pixels to get the screen region
    green_pixels = set()
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y][:3]
            if is_green_pixel(r, g, b):
                green_pixels.add((x, y))
    
    if not green_pixels:
        print("No green pixels found!")
        return
    
    print(f"Found {len(green_pixels)} green pixels")
    
    # Find bounding box of green area
    min_x = min(p[0] for p in green_pixels)
    max_x = max(p[0] for p in green_pixels)
    min_y = min(p[1] for p in green_pixels)
    max_y = max(p[1] for p in green_pixels)
    
    print(f"Green area bounds: ({min_x}, {min_y}) to ({max_x}, {max_y})")
    
    # Find center of green area
    center_x = (min_x + max_x) // 2
    center_y = (min_y + max_y) // 2
    print(f"Center: ({center_x}, {center_y})")
    
    # Try different rectangle sizes and find the largest one that fits
    best_rect = None
    best_area = 0
    
    # Try rectangles of different sizes
    for rect_width in range(10, max_x - min_x + 1, 2):
        for rect_height in range(10, max_y - min_y + 1, 2):
            # Center the rectangle
            rect_left = center_x - rect_width // 2
            rect_right = center_x + rect_width // 2
            rect_top = center_y - rect_height // 2
            rect_bottom = center_y + rect_height // 2
            
            # Check if all corners and edges are inside green area
            all_inside = True
            
            # Check corners
            corners = [
                (rect_left, rect_top),
                (rect_right, rect_top),
                (rect_left, rect_bottom),
                (rect_right, rect_bottom),
            ]
            
            for cx, cy in corners:
                if (cx, cy) not in green_pixels:
                    all_inside = False
                    break
            
            if all_inside:
                # Check edges (sample points along edges)
                for x in range(rect_left, rect_right + 1, max(1, rect_width // 10)):
                    if (x, rect_top) not in green_pixels or (x, rect_bottom) not in green_pixels:
                        all_inside = False
                        break
                
                if all_inside:
                    for y in range(rect_top, rect_bottom + 1, max(1, rect_height // 10)):
                        if (rect_left, y) not in green_pixels or (rect_right, y) not in green_pixels:
                            all_inside = False
                            break
            
            if all_inside:
                area = rect_width * rect_height
                if area > best_area:
                    best_area = area
                    best_rect = (rect_left, rect_top, rect_right, rect_bottom)
    
    if best_rect:
        left, top, right, bottom = best_rect
        rect_width = right - left
        rect_height = bottom - top
        
        print(f"\n{'='*60}")
        print("MAXIMAL INSCRIBED RECTANGLE:")
        print('='*60)
        print(f"Top-left: ({left}, {top})")
        print(f"Bottom-right: ({right}, {bottom})")
        print(f"Size: {rect_width}px × {rect_height}px")
        print(f"Area: {best_area}px²")
        
        # Calculate percentages
        left_percent = (left / width) * 100
        top_percent = (top / height) * 100
        right_percent = ((width - right) / width) * 100
        height_percent = (rect_height / height) * 100
        
        print(f"\n{'='*60}")
        print("REACT NATIVE STYLES:")
        print('='*60)
        print(f"phoneScreenArea: {{")
        print(f"  position: 'absolute',")
        print(f"  top: '{top_percent:.2f}%',")
        print(f"  left: '{left_percent:.2f}%',")
        print(f"  right: '{right_percent:.2f}%',")
        print(f"  height: '{height_percent:.2f}%',")
        print(f"  backgroundColor: '#579e2a',")
        print(f"  overflow: 'hidden',")
        print(f"}},")
    else:
        print("Could not find a valid rectangle!")

if __name__ == '__main__':
    find_maximal_rectangle('assets/phone/phone_dark.png')
