import io
import logging
from typing import Optional

import cv2
import numpy as np
import torch
from PIL import Image

logger = logging.getLogger(__name__)

_model = None
_processor = None
_device = None


def _get_device(use_gpu: bool = True) -> torch.device:
    if use_gpu and torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def load_model(model_name: str = "microsoft/trocr-base-handwritten", use_gpu: bool = True):
    """Load TrOCR model for handwriting recognition."""
    global _model, _processor, _device
    if _model is not None:
        return

    _device = _get_device(use_gpu)
    logger.info(f"Loading TrOCR model on {_device}...")

    try:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel

        _processor = TrOCRProcessor.from_pretrained(model_name)
        _model = VisionEncoderDecoderModel.from_pretrained(model_name).to(_device)
        _model.eval()
        logger.info("TrOCR model loaded successfully")
    except Exception as e:
        logger.warning(f"Failed to load TrOCR: {e}. OCR will use fallback mode.")
        _model = None
        _processor = None


def _to_grayscale(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def _denoise(img: np.ndarray, level: int = 3) -> np.ndarray:
    strength = max(1, min(level, 10)) * 3
    return cv2.fastNlMeansDenoising(img, None, strength, 7, 21)


def _binarize(img: np.ndarray) -> np.ndarray:
    return cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 11
    )


def _deskew(img: np.ndarray) -> np.ndarray:
    coords = np.column_stack(np.where(img < 128))
    if len(coords) < 50:
        return img
    try:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) > 15:
            return img
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return img


def _adjust_contrast(img: np.ndarray, factor: float = 1.2) -> np.ndarray:
    lab = img.copy().astype(np.float32)
    lab = np.clip(lab * factor, 0, 255).astype(np.uint8)
    return lab


def _segment_lines(binary_img: np.ndarray) -> list:
    """Segment text lines using horizontal projection profile."""
    inv = cv2.bitwise_not(binary_img)
    h_proj = np.sum(inv, axis=1)
    threshold = np.max(h_proj) * 0.05

    in_line = False
    lines = []
    start = 0

    for i, val in enumerate(h_proj):
        if val > threshold and not in_line:
            start = i
            in_line = True
        elif val <= threshold and in_line:
            if i - start > 10:
                lines.append((start, i))
            in_line = False

    if in_line and len(binary_img) - start > 10:
        lines.append((start, len(binary_img)))

    if not lines:
        lines = [(0, binary_img.shape[0])]

    return lines


def preprocess(image_bytes: bytes, enhance: bool = True, denoise_level: int = 3,
               contrast_boost: float = 1.2, deskew_enabled: bool = True) -> tuple:
    """Preprocess handwriting image. Returns (processed_image, steps_applied)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    steps = []

    gray = _to_grayscale(img)
    steps.append("grayscale")

    if enhance:
        gray = _denoise(gray, denoise_level)
        steps.append("denoise")

        gray = _adjust_contrast(gray, contrast_boost)
        steps.append("contrast_boost")

        if deskew_enabled:
            gray = _deskew(gray)
            steps.append("deskew")

    binary = _binarize(gray)
    steps.append("binarize")

    return binary, steps, img.shape


def _ocr_line_image(line_img: np.ndarray) -> tuple:
    """Run OCR on a single line image. Returns (text, confidence)."""
    global _model, _processor, _device

    if _model is not None and _processor is not None:
        pil_img = Image.fromarray(line_img).convert("RGB")
        pixel_values = _processor(images=pil_img, return_tensors="pt").pixel_values.to(_device)

        with torch.no_grad():
            outputs = _model.generate(
                pixel_values,
                max_new_tokens=128,
                output_scores=True,
                return_dict_in_generate=True,
            )

        text = _processor.batch_decode(outputs.sequences, skip_special_tokens=True)[0]

        if outputs.scores:
            probs = [torch.softmax(s, dim=-1).max().item() for s in outputs.scores]
            confidence = round(sum(probs) / len(probs) * 100, 1) if probs else 50.0
        else:
            confidence = 75.0

        return text.strip(), confidence

    return "[Model not loaded — install transformers and download model]", 0.0


def read(image_bytes: bytes, enhance: bool = True, denoise_level: int = 3,
         contrast_boost: float = 1.2, deskew_enabled: bool = True) -> dict:
    """
    Main OCR pipeline: image -> preprocess -> segment lines -> OCR each line -> combine.
    Returns full result with text, confidence, line details, and preprocessing info.
    """
    binary, steps, orig_shape = preprocess(
        image_bytes, enhance=enhance, denoise_level=denoise_level,
        contrast_boost=contrast_boost, deskew_enabled=deskew_enabled
    )

    line_regions = _segment_lines(binary)
    lines = []
    all_text = []
    total_conf = 0.0

    for y_start, y_end in line_regions:
        line_img = binary[y_start:y_end, :]
        text, confidence = _ocr_line_image(line_img)

        if text.strip():
            lines.append({
                "text": text,
                "confidence": confidence,
                "bbox": [0, int(y_start), int(binary.shape[1]), int(y_end)],
            })
            all_text.append(text)
            total_conf += confidence

    combined_text = " ".join(all_text)
    avg_confidence = round(total_conf / len(lines), 1) if lines else 0.0

    return {
        "text": combined_text,
        "confidence": avg_confidence,
        "lines": lines,
        "preprocessing_applied": steps,
    }


def get_preprocessed_image_bytes(image_bytes: bytes, enhance: bool = True,
                                  denoise_level: int = 3, contrast_boost: float = 1.2,
                                  deskew_enabled: bool = True) -> bytes:
    """Return preprocessed image as PNG bytes for display."""
    binary, _, _ = preprocess(image_bytes, enhance, denoise_level, contrast_boost, deskew_enabled)
    success, buffer = cv2.imencode(".png", binary)
    if not success:
        raise ValueError("Failed to encode preprocessed image")
    return buffer.tobytes()
