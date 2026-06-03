"""
Training script untuk model klasifikasi bentuk wajah.

Mendukung dua struktur dataset:

  A) Flat (kelas langsung di root):
     dataset/face shape detector/
     ├── oval/
     ├── round/
     └── ...

  B) Split (sudah dipisah train/val):
     dataset/
     ├── train/
     │   ├── oval/
     │   └── ...
     └── val/
         ├── oval/
         └── ...

Jalankan:
    python train.py --dataset "dataset/face shape detector" --epochs 50
"""

import argparse
import json
import os
import shutil
import tempfile

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

IMG_SIZE = 224
BATCH_SIZE = 32
MODEL_SAVE_PATH = "ml_models/face_shape_model.h5"
LABELS_SAVE_PATH = "ml_models/class_labels.json"


def build_model(num_classes: int) -> Model:
    base = EfficientNetB0(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    # Fase 1: Freeze semua layer base, latih head dulu
    base.trainable = False

    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def unfreeze_and_finetune(model: Model) -> Model:
    """Fase 2: Buka 30 layer terakhir EfficientNet untuk fine-tuning."""
    base = model.layers[1]  # EfficientNetB0 ada di index 1
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def is_flat_structure(dataset_path: str) -> bool:
    """Cek apakah folder langsung berisi subfolder kelas (bukan train/val)."""
    children = os.listdir(dataset_path)
    return "train" not in children and "val" not in children


def prepare_split_dirs(dataset_path: str, val_split: float = 0.2) -> tuple[str, str]:
    """
    Buat folder train/val sementara dari struktur flat.
    Mengembalikan (train_dir, val_dir) dalam tempdir.
    """
    tmp = tempfile.mkdtemp(prefix="hairstyle_split_")
    train_dir = os.path.join(tmp, "train")
    val_dir = os.path.join(tmp, "val")

    for class_name in os.listdir(dataset_path):
        class_src = os.path.join(dataset_path, class_name)
        if not os.path.isdir(class_src):
            continue

        images = [
            f for f in os.listdir(class_src)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        ]
        np.random.shuffle(images)
        n_val = max(1, int(len(images) * val_split))
        val_imgs = images[:n_val]
        train_imgs = images[n_val:]

        for split, imgs in [("train", train_imgs), ("val", val_imgs)]:
            dest = os.path.join(tmp, split, class_name)
            os.makedirs(dest, exist_ok=True)
            for img in imgs:
                shutil.copy2(os.path.join(class_src, img), os.path.join(dest, img))

        print(f"  {class_name}: {len(train_imgs)} train / {n_val} val")

    return train_dir, val_dir


def make_generators(dataset_path: str, val_split: float = 0.2):
    # Augmentasi agresif untuk dataset kecil
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        horizontal_flip=True,
        zoom_range=0.2,
        shear_range=0.1,
        brightness_range=[0.7, 1.3],
        fill_mode="nearest",
    )
    val_datagen = ImageDataGenerator(rescale=1.0 / 255)

    tmp_dir = None

    if is_flat_structure(dataset_path):
        print(f"\nStruktur flat terdeteksi — membagi dataset {int((1-val_split)*100)}/{int(val_split*100)}...")
        train_dir, val_dir = prepare_split_dirs(dataset_path, val_split)
        tmp_dir = os.path.dirname(train_dir)
    else:
        train_dir = os.path.join(dataset_path, "train")
        val_dir_candidate = os.path.join(dataset_path, "val")
        val_dir = val_dir_candidate if os.path.exists(val_dir_candidate) else None
        if val_dir is None:
            print("\nFolder val/ tidak ditemukan — membagi dari train/...")
            train_dir, val_dir = prepare_split_dirs(train_dir, val_split)
            tmp_dir = os.path.dirname(train_dir)

    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
    )
    val_gen = val_datagen.flow_from_directory(
        val_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False,
    )

    return train_gen, val_gen, tmp_dir


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True, help="Path ke folder dataset")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--val-split", type=float, default=0.2)
    args = parser.parse_args()

    np.random.seed(42)
    tf.random.set_seed(42)
    os.makedirs("ml_models", exist_ok=True)

    train_gen, val_gen, tmp_dir = make_generators(args.dataset, args.val_split)
    num_classes = len(train_gen.class_indices)
    print(f"\nKelas terdeteksi ({num_classes}): {list(train_gen.class_indices.keys())}")
    print(f"Total train batches : {len(train_gen)}")
    print(f"Total val batches   : {len(val_gen)}\n")

    with open(LABELS_SAVE_PATH, "w") as f:
        json.dump(train_gen.class_indices, f, indent=2)
    print(f"Label disimpan di: {LABELS_SAVE_PATH}")

    model = build_model(num_classes)

    base_callbacks = [
        ModelCheckpoint(MODEL_SAVE_PATH, monitor="val_accuracy", save_best_only=True, verbose=1),
        EarlyStopping(monitor="val_accuracy", patience=8, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, verbose=1, min_lr=1e-6),
    ]

    # Fase 1: Latih head saja (10 epoch)
    phase1_epochs = min(10, args.epochs // 4)
    print(f"\n{'='*50}")
    print(f"FASE 1: Melatih head ({phase1_epochs} epoch, base frozen)")
    print(f"{'='*50}")
    model.fit(train_gen, validation_data=val_gen, epochs=phase1_epochs, callbacks=base_callbacks)

    # Fase 2: Fine-tune 30 layer terakhir EfficientNet
    print(f"\n{'='*50}")
    print(f"FASE 2: Fine-tuning EfficientNetB0 ({args.epochs - phase1_epochs} epoch)")
    print(f"{'='*50}")
    model = unfreeze_and_finetune(model)

    finetune_callbacks = [
        ModelCheckpoint(MODEL_SAVE_PATH, monitor="val_accuracy", save_best_only=True, verbose=1),
        EarlyStopping(monitor="val_accuracy", patience=12, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=4, verbose=1, min_lr=1e-8),
    ]
    model.fit(
        train_gen, validation_data=val_gen,
        epochs=args.epochs, initial_epoch=phase1_epochs,
        callbacks=finetune_callbacks,
    )

    # Bersihkan temp dir jika dibuat
    if tmp_dir and os.path.exists(tmp_dir):
        shutil.rmtree(tmp_dir)

    print(f"\nModel terbaik disimpan di: {MODEL_SAVE_PATH}")
    print(f"Label kelas disimpan di  : {LABELS_SAVE_PATH}")


if __name__ == "__main__":
    main()
