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
TEXT_EXTS = {'.txt', '.md', '.csv', '.log', '.json', '.xml', '.html', '.css', '.js', '.ts', '.py', '.sh', '.yml', '.yaml', '.ini', '.cfg', '.conf', '.env'}
VIDEO_EXTS = {'.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.mpg', '.mpeg', '.mxf', '.qt', '.asf'}

def make_thumbnail(img: Image.Image, size=THUMB_SIZE, quality=80) -> bytes:
    """Redimensionne et convertit en WebP."""
    img.thumbnail(size, Image.LANCZOS)
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
    img.save(buf, format='WEBP', quality=quality)
    buf.seek(0)
    return buf.getvalue()


def thumbnail_from_image(file_bytes: bytes, size=THUMB_SIZE, quality=80) -> bytes:
    """Miniature depuis une image."""
    img = Image.open(io.BytesIO(file_bytes))
    return make_thumbnail(img, size=size, quality=quality)


def thumbnail_from_pdf(file_bytes: bytes, size=THUMB_SIZE, quality=80) -> bytes:
    """Miniature depuis la première page d'un PDF."""
    from pdf2image import convert_from_bytes
    images = convert_from_bytes(file_bytes, first_page=1, last_page=1, dpi=150, fmt='png')
    if not images:
        raise ValueError("Impossible de convertir le PDF")
    return make_thumbnail(images[0], size=size, quality=quality)


def thumbnail_from_office(file_bytes: bytes, ext: str, size=THUMB_SIZE, quality=80) -> bytes:
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

        return thumbnail_from_pdf(pdf_path.read_bytes(), size=size, quality=quality)


def thumbnail_from_text(file_bytes: bytes, size=THUMB_SIZE, quality=80) -> bytes:
    """Miniature d'un fichier texte — dessine les premières lignes sur fond blanc."""
    from PIL import ImageDraw, ImageFont

    # Décoder le texte (utf-8 avec fallback latin-1)
    try:
        text = file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        text = file_bytes.decode('latin-1', errors='replace')

    # Prendre les premières lignes
    lines = text.splitlines()[:20]

    # Créer l'image style "feuille de papier"
    w, h = 200, 260
    img = Image.new('RGB', (w, h), '#FFFFFF')
    draw = ImageDraw.Draw(img)

    # Bordure subtile
    draw.rectangle([0, 0, w - 1, h - 1], outline='#E0E0E0')

    # Petite barre de titre en haut
    draw.rectangle([0, 0, w, 16], fill='#F5F5F5')
    draw.line([0, 16, w, 16], fill='#E0E0E0')

    # Dessiner le texte
    y = 20
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 8)
    except (OSError, IOError):
        font = ImageFont.load_default()

    for line in lines:
        if y > h - 10:
            break
        # Tronquer les lignes longues
        display_line = line[:40]
        draw.text((6, y), display_line, fill='#333333', font=font)
        y += 11

    # Redimensionner en thumbnail
    return make_thumbnail(img, size=size, quality=quality)


def thumbnail_from_video(file_bytes: bytes, ext: str, size=THUMB_SIZE, quality=80) -> bytes:
    """Extrait une frame représentative d'une vidéo via ffmpeg."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / f"input{ext}"
        output_path = Path(tmpdir) / "frame.png"
        input_path.write_bytes(file_bytes)

        # D'abord récupérer la durée pour choisir un bon moment
        duration = 10  # fallback
        probe = subprocess.run(
            ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
             '-of', 'csv=p=0', str(input_path)],
            capture_output=True, timeout=10
        )
        if probe.returncode == 0 and probe.stdout.strip():
            try:
                duration = float(probe.stdout.strip())
            except ValueError:
                pass

        # Choisir un moment à ~15% de la durée (évite le noir du début et la fin)
        seek_time = max(1, min(duration * 0.15, duration - 1))

        subprocess.run(
            ['ffmpeg', '-ss', str(seek_time), '-i', str(input_path),
             '-vframes', '1', '-vf', 'scale=400:-1', str(output_path)],
            capture_output=True, timeout=30
        )

        # Fallback à 25% si l'image est trop sombre
        if output_path.exists():
            img = Image.open(output_path)
            # Vérifier si l'image est quasi noire (moyenne < 15)
            grayscale = img.convert('L')
            avg_brightness = sum(grayscale.getdata()) / len(grayscale.getdata())
            if avg_brightness < 15:
                output_path.unlink()
                seek_time = max(2, duration * 0.25)
                subprocess.run(
                    ['ffmpeg', '-ss', str(seek_time), '-i', str(input_path),
                     '-vframes', '1', '-vf', 'scale=400:-1', str(output_path)],
                    capture_output=True, timeout=30
                )

        if not output_path.exists():
            raise ValueError("Impossible d'extraire une image de la vidéo")

        img = Image.open(output_path)
        return make_thumbnail(img, size=size, quality=quality)


def get_video_info(file_bytes: bytes, ext: str) -> dict:
    """Extrait les métadonnées d'une vidéo via ffprobe."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / f"input{ext}"
        input_path.write_bytes(file_bytes)

        result = subprocess.run(
            ['ffprobe', '-v', 'quiet', '-print_format', 'json',
             '-show_format', '-show_streams', str(input_path)],
            capture_output=True, timeout=15
        )

        if result.returncode != 0:
            return {}

        import json
        try:
            data = json.loads(result.stdout)
        except Exception:
            return {}

        info = {}
        fmt = data.get('format', {})
        if fmt.get('duration'):
            secs = float(fmt['duration'])
            mins = int(secs // 60)
            remaining = int(secs % 60)
            info['duration'] = f"{mins}:{remaining:02d}"
            info['durationSeconds'] = round(secs)
        if fmt.get('size'):
            info['fileSize'] = int(fmt['size'])
        if fmt.get('format_long_name'):
            info['format'] = fmt['format_long_name']

        for stream in data.get('streams', []):
            if stream.get('codec_type') == 'video':
                info['width'] = stream.get('width')
                info['height'] = stream.get('height')
                info['codec'] = stream.get('codec_name')
                info['fps'] = stream.get('r_frame_rate')
            elif stream.get('codec_type') == 'audio':
                info['audioCodec'] = stream.get('codec_name')

        return info


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

        # Qualité adaptative : low, medium (défaut), high
        quality_param = request.form.get('quality', 'medium')
        quality_map = {'low': (30, (100, 100)), 'medium': (60, (200, 200)), 'high': (85, (400, 400))}
        q, sz = quality_map.get(quality_param, (60, (200, 200)))

        if ext in IMAGE_EXTS:
            thumb = thumbnail_from_image(file_bytes, size=sz, quality=q)
        elif ext in PDF_EXTS:
            thumb = thumbnail_from_pdf(file_bytes, size=sz, quality=q)
        elif ext in OFFICE_EXTS:
            thumb = thumbnail_from_office(file_bytes, ext, size=sz, quality=q)
        elif ext in TEXT_EXTS:
            thumb = thumbnail_from_text(file_bytes, size=sz, quality=q)
        elif ext in VIDEO_EXTS:
            thumb = thumbnail_from_video(file_bytes, ext, size=sz, quality=q)
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


@app.route('/video-info', methods=['POST'])
def video_info():
    """
    POST /video-info — Retourne les métadonnées d'une vidéo (durée, résolution, codec).
    """
    if 'file' not in request.files:
        return jsonify(error='Aucun fichier reçu'), 400

    file = request.files['file']
    filename = request.form.get('filename', file.filename or 'unknown')
    ext = Path(filename).suffix.lower()

    if ext not in VIDEO_EXTS:
        return jsonify(error='Format vidéo non supporté'), 415

    try:
        file_bytes = file.read()
        info = get_video_info(file_bytes, ext)
        return jsonify(info)
    except Exception as e:
        return jsonify(error=str(e)[:200]), 500


@app.route('/convert-to-pdf', methods=['POST'])
def convert_to_pdf():
    """Convertit un fichier Office en PDF complet (pas juste une miniature)."""
    try:
        if 'file' not in request.files:
            return jsonify(error='No file'), 400
        file = request.files['file']
        filename = request.form.get('filename', file.filename or 'document')
        ext = Path(filename).suffix.lower()

        # Si c'est deja un PDF, retourner tel quel
        if ext == '.pdf':
            return send_file(io.BytesIO(file.read()), mimetype='application/pdf', download_name=filename)

        # Si c'est un fichier Office, convertir via LibreOffice
        if ext in OFFICE_EXTS:
            with tempfile.TemporaryDirectory() as tmpdir:
                in_path = os.path.join(tmpdir, f'input{ext}')
                file.save(in_path)
                subprocess.run([
                    'libreoffice', '--headless', '--convert-to', 'pdf',
                    '--outdir', tmpdir, in_path
                ], timeout=120, capture_output=True)
                pdf_path = os.path.join(tmpdir, 'input.pdf')
                if os.path.exists(pdf_path):
                    with open(pdf_path, 'rb') as f:
                        pdf_data = f.read()
                    return send_file(io.BytesIO(pdf_data), mimetype='application/pdf', download_name=Path(filename).stem + '.pdf')
                return jsonify(error='Conversion echouee'), 500

        # Fichier texte → pas de conversion, retourner tel quel
        if ext in TEXT_EXTS:
            return send_file(io.BytesIO(file.read()), mimetype='text/plain', download_name=filename)

        return jsonify(error='Type non supporte'), 400
    except Exception as e:
        return jsonify(error=str(e)[:200]), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9090))
    app.run(host='0.0.0.0', port=port, debug=False)
