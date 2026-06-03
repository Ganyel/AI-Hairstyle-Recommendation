"""
Script augmentasi dataset otomatis.

Menghasilkan gambar baru dari foto asli menggunakan kombinasi teknik augmentasi
sehingga setiap kelas memiliki minimal TARGET_PER_CLASS gambar.

Jalankan:
    python augment_dataset.py --dataset "../dataset/face shape detector" --target 500

Output:
    dataset/augmented/
    ├── train/
    │   ├── oval/        <- 500+ gambar (asli + augmentasi)
    │   ├── round/
    │   └── ...
    └── val/
        ├── oval/        <- 80 gambar untuk validasi
        └── ...
"""

import argparse
import os
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

TARGET_PER_CLASS = 500
VAL_PER_CLASS = 80
IMG_SIZE = (224, 224)
SEED = 42

random.seed(SEED)
np.random.seed(SEED)


# ---------------------------------------------------------------------------
# Augmentasi tunggal
# ---------------------------------------------------------------------------

def aug_flip(img: Image.Image) -> Image.Image:
    return ImageOps.mirror(img)


def aug_rotate(img: Image.Image) -> Image.Image:
    angle = random.uniform(-25, 25)
    return img.rotate(angle, expand=False, fillcolor=(0, 0, 0))


def aug_brightness(img: Image.Image) -> Image.Image:
    factor = random.uniform(0.6, 1.4)
    return ImageEnhance.Brightness(img).enhance(factor)


def aug_contrast(img: Image.Image) -> Image.Image:
    factor = random.uniform(0.7, 1.5)
    return ImageEnhance.Contrast(img).enhance(factor)


def aug_saturation(img: Image.Image) -> Image.Image:
    factor = random.uniform(0.5, 1.5)
    return ImageEnhance.Color(img).enhance(factor)


def aug_sharpness(img: Image.Image) -> Image.Image:
    factor = random.uniform(0.2, 2.5)
    return ImageEnhance.Sharpness(img).enhance(factor)


def aug_blur(img: Image.Image) -> Image.Image:
    radius = random.uniform(0.3, 1.5)
    return img.filter(ImageFilter.GaussianBlur(radius=radius))


def aug_zoom(img: Image.Image) -> Image.Image:
    w, h = img.size
    zoom = random.uniform(0.80, 0.95)
    crop_w, crop_h = int(w * zoom), int(h * zoom)
    x = random.randint(0, w - crop_w)
    y = random.randint(0, h - crop_h)
    return img.crop((x, y, x + crop_w, y + crop_h)).resize((w, h), Image.LANCZOS)


def aug_shift(img: Image.Image) -> Image.Image:
    w, h = img.size
    dx = int(random.uniform(-0.12, 0.12) * w)
    dy = int(random.uniform(-0.12, 0.12) * h)
    return img.transform(img.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), fillcolor=(0, 0, 0))


def aug_noise(img: Image.Image) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, random.uniform(3, 12), arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def aug_grayscale(img: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(img)
    return gray.convert("RGB")


def aug_cutout(img: Image.Image) -> Image.Image:
    """Tutup sebagian kecil gambar dengan kotak hitam."""
    arr = np.array(img.copy())
    h, w = arr.shape[:2]
    cut_h = int(random.uniform(0.1, 0.25) * h)
    cut_w = int(random.uniform(0.1, 0.25) * w)
    x = random.randint(0, w - cut_w)
    y = random.randint(0, h - cut_h)
    arr[y:y + cut_h, x:x + cut_w] = 0
    return Image.fromarray(arr)


AUGMENTATIONS = [
    aug_flip, aug_rotate, aug_brightness, aug_contrast,
    aug_saturation, aug_sharpness, aug_blur, aug_zoom,
    aug_shift, aug_noise, aug_grayscale, aug_cutout,
]


def augment_image(img: Image.Image, num_ops: int = 2) -> Image.Image:
    """Terapkan 2–4 augmentasi acak secara berurutan."""
    ops = random.sample(AUGMENTATIONS, k=min(num_ops, len(AUGMENTATIONS)))
    for op in ops:
        img = op(img)
    return img


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def load_images(class_dir: str) -> list[Image.Image]:
    images = []
    for f in os.listdir(class_dir):
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            try:
                img = Image.open(os.path.join(class_dir, f)).convert("RGB")
                img = img.resize(IMG_SIZE, Image.LANCZOS)
                images.append(img)
            except Exception as e:
                print(f"  Gagal baca {f}: {e}")
    return images


def save_image(img: Image.Image, path: str):
    img.save(path, format="JPEG", quality=92)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True, help="Path ke folder dataset asli")
    parser.add_argument("--output", default="../dataset/augmented", help="Folder output")
    parser.add_argument("--target", type=int, default=TARGET_PER_CLASS, help="Target gambar per kelas (train)")
    parser.add_argument("--val", type=int, default=VAL_PER_CLASS, help="Gambar per kelas untuk val")
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    output_path = Path(args.output)

    classes = sorted([
        d for d in os.listdir(dataset_path)
        if os.path.isdir(dataset_path / d)
    ])
    print(f"\nKelas ditemukan: {classes}\n")

    for cls in classes:
        class_dir = dataset_path / cls
        originals = load_images(str(class_dir))
        n_orig = len(originals)

        if n_orig == 0:
            print(f"[{cls}] Tidak ada gambar, dilewati.")
            continue

        print(f"[{cls}] {n_orig} gambar asli → target {args.target} train + {args.val} val")

        # Pisahkan val dari asli (ambil 20% atau minimal 1)
        n_val_orig = max(1, int(n_orig * 0.2))
        random.shuffle(originals)
        val_originals = originals[:n_val_orig]
        train_originals = originals[n_val_orig:]

        if not train_originals:
            train_originals = originals  # fallback jika terlalu sedikit

        # Buat folder output
        train_out = output_path / "train" / cls
        val_out = output_path / "val" / cls
        train_out.mkdir(parents=True, exist_ok=True)
        val_out.mkdir(parents=True, exist_ok=True)

        # Simpan gambar asli ke train
        for i, img in enumerate(train_originals):
            save_image(img, str(train_out / f"orig_{i:04d}.jpg"))

        # Augmentasi train sampai target
        aug_count = 0
        while len(list(train_out.glob("*.jpg"))) < args.target:
            src = random.choice(train_originals)
            n_ops = random.randint(2, 4)
            aug = augment_image(src, num_ops=n_ops)
            save_image(aug, str(train_out / f"aug_{aug_count:05d}.jpg"))
            aug_count += 1

        # Augmentasi val sampai target
        for i, img in enumerate(val_originals):
            save_image(img, str(val_out / f"orig_{i:04d}.jpg"))
        val_aug_count = 0
        while len(list(val_out.glob("*.jpg"))) < args.val:
            src = random.choice(val_originals)
            aug = augment_image(src, num_ops=2)
            save_image(aug, str(val_out / f"aug_{val_aug_count:05d}.jpg"))
            val_aug_count += 1

        total_train = len(list(train_out.glob("*.jpg")))
        total_val = len(list(val_out.glob("*.jpg")))
        print(f"  ✓ train: {total_train} | val: {total_val}")

    print(f"\nSelesai! Dataset augmentasi tersimpan di: {output_path.resolve()}")
    print(f"\nLanjut training:\n  python train.py --dataset \"{output_path.resolve()}\" --epochs 50")


if __name__ == "__main__":
    main()
