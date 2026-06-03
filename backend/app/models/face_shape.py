import json
import os
import numpy as np
from PIL import Image
import tensorflow as tf

IMG_SIZE = 224

MODEL_PATH = os.getenv("MODEL_PATH", "ml_models/face_shape_model.h5")
LABELS_PATH = os.getenv("LABELS_PATH", "ml_models/class_labels.json")

_model: tf.keras.Model | None = None
_index_to_class: dict[int, str] = {}


def _load_model():
    global _model, _index_to_class
    if _model is not None:
        return

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model tidak ditemukan di '{MODEL_PATH}'. "
            "Jalankan train.py terlebih dahulu."
        )
    if not os.path.exists(LABELS_PATH):
        raise FileNotFoundError(
            f"File label tidak ditemukan di '{LABELS_PATH}'."
        )

    _model = tf.keras.models.load_model(MODEL_PATH)

    with open(LABELS_PATH) as f:
        class_to_index: dict[str, int] = json.load(f)
    _index_to_class = {v: k for k, v in class_to_index.items()}


# ---------------------------------------------------------------------------
# Hairstyle recommendations per face shape
# ---------------------------------------------------------------------------

RECOMMENDATIONS: dict[str, dict] = {
    "oval": {
        "label": "Oval",
        "description": "Bentuk wajah oval adalah yang paling serbaguna. Hampir semua gaya rambut cocok.",
        "hairstyles": [
            {"name": "Pompadour", "description": "Menonjolkan volume di atas kepala.", "image": "pompadour.jpg"},
            {"name": "Undercut", "description": "Sisi pendek, atas panjang — tampilan modern.", "image": "undercut.jpg"},
            {"name": "Quiff", "description": "Klasik elegan, mudah dibentuk.", "image": "quiff.jpg"},
            {"name": "Crew Cut", "description": "Simpel dan rapi untuk sehari-hari.", "image": "crew-cut.jpg"},
        ],
    },
    "round": {
        "label": "Bulat",
        "description": "Wajah bulat cocok dengan gaya yang menambah kesan panjang dan tegas.",
        "hairstyles": [
            {"name": "Faux Hawk", "description": "Tinggi di tengah untuk kesan memanjang.", "image": "faux-hawk.jpg"},
            {"name": "Side Part", "description": "Belahan samping memberi ilusi wajah panjang.", "image": "side-part.jpg"},
            {"name": "Slick Back", "description": "Rambut disisir ke belakang, wajah terlihat lebih tirus.", "image": "slick-back.jpg"},
            {"name": "Textured Crop", "description": "Atas bertekstur, sisi pendek.", "image": "textured-crop.jpg"},
        ],
    },
    "square": {
        "label": "Persegi",
        "description": "Wajah persegi memiliki rahang kuat. Gaya lembut dan bertekstur sangat cocok.",
        "hairstyles": [
            {"name": "Messy Quiff", "description": "Tekstur acak melembutkan garis rahang.", "image": "messy-quiff.jpg"},
            {"name": "Fringe", "description": "Poni depan mengalihkan perhatian dari rahang.", "image": "fringe.jpg"},
            {"name": "Curly Top", "description": "Volume keriting di atas menyeimbangkan wajah.", "image": "curly-top.jpg"},
            {"name": "Caesar Cut", "description": "Poni pendek horizontal, tampilan natural.", "image": "caesar-cut.jpg"},
        ],
    },
    "heart": {
        "label": "Hati",
        "description": "Dahi lebar dan dagu runcing. Gaya yang menambah volume di bawah sangat ideal.",
        "hairstyles": [
            {"name": "Side Swept", "description": "Menyapu ke samping, menyeimbangkan dahi.", "image": "side-swept.jpg"},
            {"name": "Layered Cut", "description": "Lapisan di bawah menambah volume rahang.", "image": "layered-cut.jpg"},
            {"name": "Shaggy Layers", "description": "Tidak beraturan dan natural untuk face shape ini.", "image": "shaggy-layers.jpg"},
            {"name": "Buzz Cut", "description": "Menyederhanakan fitur wajah secara keseluruhan.", "image": "buzz-cut.jpg"},
        ],
    },
    "oblong": {
        "label": "Lonjong",
        "description": "Wajah panjang. Tambahkan volume di samping untuk tampak lebih proporsional.",
        "hairstyles": [
            {"name": "Side Part Pompadour", "description": "Volume samping menyeimbangkan panjang wajah.", "image": "side-part-pompadour.jpg"},
            {"name": "Wavy Fringe", "description": "Poni bergelombang mempersingkat kesan panjang.", "image": "wavy-fringe.jpg"},
            {"name": "Textured Layers", "description": "Lapisan bertekstur menambah lebar visual.", "image": "textured-layers.jpg"},
            {"name": "Afro", "description": "Volume merata ke segala arah — sempurna untuk wajah lonjong.", "image": "afro.jpg"},
        ],
    },
    "diamond": {
        "label": "Berlian",
        "description": "Tulang pipi lebar dengan dahi dan dagu yang lebih sempit. Gaya yang melembutkan pipi sangat cocok.",
        "hairstyles": [
            {"name": "Side Part", "description": "Belahan samping menyeimbangkan lebar pipi.", "image": "side-part.jpg"},
            {"name": "Chin-Length Bob", "description": "Menambah volume di area dagu yang lebih sempit.", "image": "chin-length-bob.jpg"},
            {"name": "Curtain Bangs", "description": "Poni tirai melebarkan kesan dahi secara visual.", "image": "curtain-bangs.jpg"},
            {"name": "Textured Quiff", "description": "Volume di atas mengurangi kesan lebar di pipi.", "image": "quiff.jpg"},
        ],
    },
    "triangle": {
        "label": "Segitiga",
        "description": "Rahang lebar dengan dahi lebih sempit. Gaya yang menambah volume di atas sangat ideal.",
        "hairstyles": [
            {"name": "Pompadour", "description": "Volume tinggi di atas menyeimbangkan rahang lebar.", "image": "pompadour.jpg"},
            {"name": "Faux Hawk", "description": "Menonjolkan bagian atas kepala, perhatian teralih dari rahang.", "image": "faux-hawk.jpg"},
            {"name": "Quiff", "description": "Ketinggian di depan memperlebar kesan dahi.", "image": "quiff.jpg"},
            {"name": "Layered Top", "description": "Lapisan di atas menambah lebar visual kepala bagian atas.", "image": "layered-top.jpg"},
        ],
    },
}


def classify_face_shape(face_crop: Image.Image) -> tuple[str, float]:
    """Prediksi bentuk wajah. Mengembalikan (label, confidence 0–100)."""
    _load_model()

    img = face_crop.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)

    predictions = _model.predict(arr, verbose=0)[0]
    class_index = int(np.argmax(predictions))
    confidence = round(float(predictions[class_index]) * 100, 1)
    label = _index_to_class.get(class_index, "oval").lower()
    return label, confidence


def get_hairstyle_recommendations(face_shape: str) -> dict:
    return RECOMMENDATIONS.get(face_shape, RECOMMENDATIONS["oval"])
