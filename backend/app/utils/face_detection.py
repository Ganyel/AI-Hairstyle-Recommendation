import mediapipe as mp
import numpy as np
from PIL import Image

mp_face_detection = mp.solutions.face_detection


def crop_face(image: Image.Image) -> Image.Image | None:
    """
    Deteksi wajah dalam gambar dan kembalikan crop kotak wajah.
    Mengembalikan None jika tidak ada wajah terdeteksi.
    """
    img_array = np.array(image)
    h, w = img_array.shape[:2]

    with mp_face_detection.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.5,
    ) as detector:
        results = detector.process(img_array)

    if not results.detections:
        return None

    detection = results.detections[0]
    bb = detection.location_data.relative_bounding_box

    # Konversi ke pixel, tambah padding 20%
    padding = 0.20
    x1 = max(0, int((bb.xmin - padding * bb.width) * w))
    y1 = max(0, int((bb.ymin - padding * bb.height) * h))
    x2 = min(w, int((bb.xmin + bb.width + padding * bb.width) * w))
    y2 = min(h, int((bb.ymin + bb.height + padding * bb.height) * h))

    cropped = image.crop((x1, y1, x2, y2))
    return cropped
