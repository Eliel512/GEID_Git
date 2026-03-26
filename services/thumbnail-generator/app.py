"""
thumbnail-generator — Micro-service de génération de miniatures.

Accepte un fichier via POST /generate et retourne une image WebP 200x200.

Formats supportés :
  - Images (jpg, png, webp, gif, bmp, tiff) → redimensionnement Pillow
  - PDF → première page via pdf2image (poppler)
  - Office (docx, xlsx, pptx, doc, xls, ppt, odt, ods, odp) → LibreOffice → PDF → première page
"""

import io
import os
import subprocess
import tempfile
from pathlib import Path

from flask import Flask, request, jsonify, send_file
from PIL import Image

app = Flask(__name__)

THUMB_SIZE = (200, 200)

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.avif'}
PDF_EXTS = {'.pdf'}
OFFICE_EXTS = {'.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.odt', '.ods', '.odp', '.rtf'}

def make_thumbnail(img: Image.Image) -> bytes:
    """Redimensionne et convertit en WebP."""
    img.thumbnail(THUMB_SIZE, Image.LANCZOS)
    # Fond blanc pour les images transparentes
    if img.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        bg.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format='WEBP', quality=80)
    buf.seek(0)
    return buf.getvalue()


def thumbnail_from_image(file_bytes: bytes) -> bytes:
    """Miniature depuis une image."""
    img = Image.open(io.BytesIO(file_bytes))
    return make_thumbnail(img)


def thumbnail_from_pdf(file_bytes: bytes) -> bytes:
    """Miniature depuis la première page d'un PDF."""
    from pdf2image import convert_from_bytes
    images = convert_from_bytes(file_bytes, first_page=1, last_page=1, dpi=150, fmt='png')
    if not images:
        raise ValueError("Impossible de convertir le PDF")
    return make_thumbnail(images[0])


def thumbnail_from_office(file_bytes: bytes, ext: str) -> bytes:
    """Convertit un document Office en PDF via LibreOffice, puis génère la miniature."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / f"input{ext}"
        input_path.write_bytes(file_bytes)

        # Conversion LibreOffice → PDF
        result = subprocess.run(
            ['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir', tmpdir, str(input_path)],
            capture_output=True, timeout=30
        )
        if result.returncode != 0:
            raise ValueError(f"LibreOffice error: {result.stderr.decode()[:200]}")

        pdf_path = Path(tmpdir) / f"input.pdf"
        if not pdf_path.exists():
            # LibreOffice peut nommer différemment
            pdfs = list(Path(tmpdir).glob("*.pdf"))
            if not pdfs:
                raise ValueError("Aucun PDF généré par LibreOffice")
            pdf_path = pdfs[0]

        return thumbnail_from_pdf(pdf_path.read_bytes())


@app.route('/health', methods=['GET'])
def health():
    return jsonify(status='ok')


@app.route('/generate', methods=['POST'])
def generate():
    """
    POST /generate
    Content-Type: multipart/form-data
    Body: file (binary), filename (string)

    Retourne: image/webp 200x200
    """
    if 'file' not in request.files:
        return jsonify(error='Aucun fichier reçu'), 400

    file = request.files['file']
    filename = request.form.get('filename', file.filename or 'unknown')
    ext = Path(filename).suffix.lower()

    try:
        file_bytes = file.read()

        if ext in IMAGE_EXTS:
            thumb = thumbnail_from_image(file_bytes)
        elif ext in PDF_EXTS:
            thumb = thumbnail_from_pdf(file_bytes)
        elif ext in OFFICE_EXTS:
            thumb = thumbnail_from_office(file_bytes, ext)
        else:
            return jsonify(error=f'Format non supporté: {ext}'), 415

        return send_file(
            io.BytesIO(thumb),
            mimetype='image/webp',
            download_name=f'thumb_{Path(filename).stem}.webp'
        )
    except Exception as e:
        app.logger.error(f'Erreur génération miniature: {e}')
        return jsonify(error=str(e)[:200]), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9090))
    app.run(host='0.0.0.0', port=port, debug=False)
