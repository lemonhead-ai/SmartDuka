import os
from PIL import Image, ImageDraw, ImageFont

icons_dir = r"c:\Projects\SmartDuka\frontend\public\icons"
os.makedirs(icons_dir, exist_ok=True)

sizes = [
    ("icon-192.png", 192),
    ("icon-512.png", 512),
    ("icon-maskable-192.png", 192),
    ("icon-maskable-512.png", 512),
]

for filename, size in sizes:
    img = Image.new("RGB", (size, size), color="#1D1D1F")
    draw = ImageDraw.Draw(img)
    
    # Try loading default font or drawing a nice stylized "SD" text
    try:
        font_size = int(size * 0.4)
        font = ImageFont.truetype("arial.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "SD"
    # Get text bounding box for accurate centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) / 2 - bbox[0]
    y = (size - text_height) / 2 - bbox[1]

    # Draw orange / white brand accent circle behind text
    margin = int(size * 0.15)
    draw.ellipse([margin, margin, size - margin, size - margin], fill="#FF8A3D")
    draw.text((x, y), text, fill="#FFFFFF", font=font)

    filepath = os.path.join(icons_dir, filename)
    img.save(filepath, "PNG")
    print(f"Generated {filepath} ({size}x{size})")
