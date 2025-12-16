#!/usr/bin/env python3
"""Generate PNG icons from SVG for PWA"""

try:
    from PIL import Image, ImageDraw
    import os
    
    def create_icon(size):
        # Create image with gradient-like background
        img = Image.new('RGB', (size, size), '#0b0c10')
        draw = ImageDraw.Draw(img)
        
        # Draw gradient effect (simplified)
        center = size // 2
        
        # Outer circle (radio wave)
        radius1 = int(size * 0.39)
        draw.ellipse([center - radius1, center - radius1, center + radius1, center + radius1], 
                    outline='white', width=max(2, size // 40))
        
        # Middle circle
        radius2 = int(size * 0.27)
        draw.ellipse([center - radius2, center - radius2, center + radius2, center + radius2], 
                    outline='white', width=max(1, size // 60))
        
        # Inner circle
        radius3 = int(size * 0.15)
        draw.ellipse([center - radius3, center - radius3, center + radius3, center + radius3], 
                    outline='white', width=max(1, size // 80))
        
        # Center dot
        dot_radius = max(4, size // 20)
        draw.ellipse([center - dot_radius, center - dot_radius, center + dot_radius, center + dot_radius], 
                    fill='white')
        
        # Add gradient background effect
        for y in range(size):
            for x in range(size):
                dist = ((x - center)**2 + (y - center)**2)**0.5
                if dist < size * 0.5:
                    # Blue to purple gradient
                    ratio = dist / (size * 0.5)
                    r = int(11 + (175 - 11) * ratio)
                    g = int(132 + (82 - 132) * ratio)
                    b = int(255 + (222 - 255) * ratio)
                    img.putpixel((x, y), (r, g, b))
        
        return img
    
    # Generate icons
    for size in [192, 512]:
        icon = create_icon(size)
        icon.save(f'icon-{size}.png')
        print(f'✓ Generated icon-{size}.png')
    
    print('\n✓ All icons generated successfully!')
    
except ImportError:
    print('⚠ PIL (Pillow) not found. Install it with: pip install Pillow')
    print('\nAlternatively, use generate-icons.html in your browser')
except Exception as e:
    print(f'Error: {e}')
    print('Use generate-icons.html in your browser instead')

