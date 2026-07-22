import cv2
import numpy as np
from paddleocr import PaddleOCR

# 🔥 HIGH-SENSITIVITY OCR
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    show_log=False,
    det_db_thresh=0.2,
    det_db_box_thresh=0.3
)

# ==============================
# 🔥 PREPROCESS (MULTI-VARIANT)
# ==============================
def preprocess_variants(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Image not found")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # upscale
    h, w = gray.shape
    scale = 2500 / max(h, w)
    gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    variants = []

    # 1. CLAHE (balanced)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v1 = clahe.apply(gray)

    # 2. Sharpen (for small text)
    kernel = np.array([[0, -1, 0],
                       [-1, 6, -1],
                       [0, -1, 0]])
    v2 = cv2.filter2D(v1, -1, kernel)

    # 3. Adaptive threshold (for faint text)
    v3 = cv2.adaptiveThreshold(
        v1, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 5
    )

    return [v1, v2, v3]


# ==============================
# 🔥 FIX OCR MISTAKES
# ==============================
def normalize_text(text):
    corrections = {
        "H8": "HB",
        "h8": "hb",
        "R8C": "RBC",
        "W8C": "WBC",
        "PLT.": "PLT",
        "MCH.": "MCH",
        "Creatlnine": "Creatinine",
        "Creatnine": "Creatinine",
        "Creatinine:": "Creatinine",
        "Hba1c": "HbA1c",
        "A1C": "HbA1c"
    }

    for wrong, correct in corrections.items():
        text = text.replace(wrong, correct)

    return text


# ==============================
# 🔥 MULTI OCR PASS
# ==============================
def run_multi_ocr(image_path):
    variants = preprocess_variants(image_path)

    all_detections = []

    for img in variants:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        result = ocr.ocr(img, cls=True)

        if result and result[0]:
            for line in result[0]:
                if line is None:
                    continue
                
                box = line[0]
                text = line[1][0].strip()

                if text:
                    text = normalize_text(text)
                    xs = [pt[0] for pt in box]
                    ys = [pt[1] for pt in box]
                    cx = sum(xs) / 4.0
                    cy = sum(ys) / 4.0
                    ymin, ymax = min(ys), max(ys)
                    all_detections.append({'cx': cx, 'cy': cy, 'ymin': ymin, 'ymax': ymax, 'text': text})

    if not all_detections:
        return []

    # Sort vertically initially
    all_detections.sort(key=lambda d: d['cy'])
    
    lines = []
    
    for det in all_detections:
        added = False
        for line in lines:
            avg_cy = sum(d['cy'] for d in line) / len(line)
            # If difference in center Y is < 60% of element height, they likely overlap
            height = max(10, det['ymax'] - det['ymin'])
            if abs(det['cy'] - avg_cy) < height * 0.6:
                line.append(det)
                added = True
                break
        
        if not added:
            lines.append([det])

    final_text_list = []
    for line in lines:
        line.sort(key=lambda d: d['cx'])
        line_texts = []
        for det in line:
            # Deduplicate same text in the same line (from different variants)
            if det['text'] not in line_texts:
                line_texts.append(det['text'])
        final_text_list.append(" ".join(line_texts))

    return final_text_list


# ==============================
# 🔥 GROUP INTO LINES
# ==============================
def build_text_output(text_list):
    # simple join → parser handles structure
    return "\n".join(text_list)


# ==============================
# 🔥 FINAL FUNCTION (USED BY FLASK)
# ==============================
def extract_text(image_path):
    text_list = run_multi_ocr(image_path)

    final_text = build_text_output(text_list)

    return final_text

