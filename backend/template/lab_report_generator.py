"""
Enhanced Lab Report Generator
======================================================
Supports:
- CBC Reports
- Creatinine Reports
- HbA1c Reports

FEATURES:
✔ Auto report detection
✔ Gemini OCR + AI extraction
✔ Peripheral film extraction
✔ Remarks extraction
✔ Suggestions extraction
✔ ESR extraction
✔ JSON export
✔ Styled PNG report generation
✔ RepoAssist AI compatibility wrappers

Usage:
    python lab_report_generator.py --image report.jpg

Optional:
    --type cbc
    --type creatinine
    --type hba1c

Requirements:
    pip install google-generativeai pillow python-dotenv
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont

# ═══════════════════════════════════════════════════════════════
# ENV LOADER
# ═══════════════════════════════════════════════════════════════

def load_env():

    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_paths = [
        os.path.join(base_dir, ".env.local"),
        os.path.join(base_dir, "..", ".env.local"),
        os.path.join(base_dir, "..", "..", ".env.local"),
        ".env.local",
        "../.env.local",
        "../../.env.local",
    ]

    for path in env_paths:

        if os.path.exists(path):

            try:
                from dotenv import load_dotenv
                load_dotenv(dotenv_path=path)
                print(f"[OK] Loaded environment: {path}")
                return
            except:
                pass

load_env()
load_env_local = load_env

# ═══════════════════════════════════════════════════════════════
# GEMINI
# ═══════════════════════════════════════════════════════════════

def gemini_call(image_path, prompt, api_key):

    try:
        import google.generativeai as genai
    except:
        os.system(f"{sys.executable} -m pip install google-generativeai -q")
        import google.generativeai as genai

    genai.configure(api_key=api_key)

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    ext = Path(image_path).suffix.lower()

    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".bmp": "image/bmp",
        ".webp": "image/webp",
    }.get(ext, "image/jpeg")

    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content([
        prompt,
        {
            "mime_type": mime,
            "data": image_bytes
        }
    ])

    return response.text.strip()

# ═══════════════════════════════════════════════════════════════
# REFERENCES
# ═══════════════════════════════════════════════════════════════

CBC_REFERENCE = {
    "WBC": ("x10³/µL", "4.0 - 11.0"),
    "RBC": ("x10⁶/µL", "4.0 - 5.9"),
    "Hemoglobin": ("g/dL", "12 - 16"),
    "Hematocrit": ("%", "36 - 52"),
    "MCV": ("fL", "76 - 96"),
    "MCH": ("pg", "27 - 32"),
    "MCHC": ("g/dL", "32 - 36"),
    "RDW": ("%", "11.5 - 17"),
    "Platelets": ("x10³/µL", "150 - 400"),
    "Neutrophils": ("%", "40 - 75"),
    "Lymphocytes": ("%", "20 - 45"),
    "Monocytes": ("%", "2 - 10"),
    "Eosinophils": ("%", "1 - 6"),
    "Basophils": ("%", "<1"),
    "ESR": ("mm/hr", "0 - 25"),
}

HBA1C_REFERENCE = {
    "HbA1c": ("%", "4.0 - 5.6"),
    "Fasting_Glucose": ("mg/dL", "70 - 99"),
    "Random_Glucose": ("mg/dL", "70 - 140"),
    "BMI": ("kg/m²", "18.5 - 24.9"),
    "Hypertension": ("", "No"),
    "Heart_Disease": ("", "No"),
    "Smoking_History": ("", "never"),
}

CREATININE_REFERENCE = {
    "Creatinine": ("mg/dL", "0.6 - 1.2"),
    "eGFR": ("mL/min/1.73m²", "90 - 120"),
    "Previous_Creatinine_1": ("mg/dL", "0.6 - 1.2"),
    "Previous_Creatinine_2": ("mg/dL", "0.6 - 1.2"),
    "Kidney_Stage": ("", "-"),
}

# ═══════════════════════════════════════════════════════════════
# PROMPTS
# ═══════════════════════════════════════════════════════════════

DETECT_PROMPT = """
Identify report type.

Return ONLY:
- cbc
- creatinine
- hba1c
- unknown
"""

CBC_PROMPT = """
You are a medical lab expert.

Analyze this CBC / Hematology report carefully.

IMPORTANT:
1. Extract EXACT values.
2. Scan COMPLETE image.
3. Extract remarks/peripheral film.
4. Return ONLY valid JSON.
5. If field missing use null.

JSON FORMAT:

{
  "patient_name":"",
  "patient_age":"",
  "patient_gender":"",
  "test_date":"",
  "lab_name":"",

  "WBC":null,
  "RBC":null,
  "Hemoglobin":null,
  "Hematocrit":null,
  "MCV":null,
  "MCH":null,
  "MCHC":null,
  "RDW":null,
  "Platelets":null,
  "Neutrophils":null,
  "Lymphocytes":null,
  "Monocytes":null,
  "Eosinophils":null,
  "Basophils":null,
  "ESR":null,

  "remarks":"",
  "peripheral_film":[],
  "interpretation":"",
  "suggestions":[]
}
"""

HBA1C_PROMPT = """
You are a medical lab expert.

Analyze this HbA1c / Diabetes report carefully.

IMPORTANT:
1. Extract EXACT values.
2. Scan COMPLETE image.
3. Extract remarks/suggestions.
4. Return ONLY valid JSON.
5. If field missing use null.

JSON FORMAT:

{
  "patient_name":"",
  "patient_age":"",
  "patient_gender":"",
  "test_date":"",
  "lab_name":"",

  "HbA1c":null,
  "Fasting_Glucose":null,
  "Random_Glucose":null,
  "BMI":null,
  "Hypertension":null,
  "Heart_Disease":null,
  "Smoking_History":null,

  "remarks":"",
  "interpretation":"",
  "suggestions":[]
}
"""

CREATININE_PROMPT = """
You are a medical lab expert.

Analyze this Creatinine / Kidney function report carefully.

IMPORTANT:
1. Extract EXACT values.
2. Scan COMPLETE image.
3. Extract remarks/suggestions.
4. Return ONLY valid JSON.
5. If field missing use null.

JSON FORMAT:

{
  "patient_name":"",
  "patient_age":"",
  "patient_gender":"",
  "test_date":"",
  "lab_name":"",

  "Creatinine":null,
  "eGFR":null,
  "Previous_Creatinine_1":null,
  "Previous_Creatinine_2":null,
  "Kidney_Stage":null,

  "remarks":"",
  "interpretation":"",
  "suggestions":[]
}
"""

# ═══════════════════════════════════════════════════════════════
# DETECT REPORT TYPE
# ═══════════════════════════════════════════════════════════════

def detect_report_type(image_path, api_key):

    print("[INFO] Detecting report type...")

    raw = gemini_call(
        image_path,
        DETECT_PROMPT,
        api_key
    )

    raw = raw.lower().strip()

    if "cbc" in raw:
        return "cbc"

    if "creatinine" in raw:
        return "creatinine"

    if "hba1c" in raw:
        return "hba1c"

    return "unknown"

# ═══════════════════════════════════════════════════════════════
# FALLBACK REMARK EXTRACTION
# ═══════════════════════════════════════════════════════════════

def extract_remarks_fallback(text):

    remarks = ""

    match = re.search(
        r"remarks\s*:?\s*(.+)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if match:
        remarks = match.group(1).strip()

    return remarks

# ═══════════════════════════════════════════════════════════════
# DATA EXTRACTION
# ═══════════════════════════════════════════════════════════════

def extract_data(image_path, report_type, api_key):

    r_type = report_type.lower().strip()
    if r_type == "cbc":
        prompt = CBC_PROMPT
    elif r_type == "hba1c":
        prompt = HBA1C_PROMPT
    elif r_type == "creatinine":
        prompt = CREATININE_PROMPT
    else:
        raise Exception(
            f"Unsupported report type: {report_type}"
        )

    raw = gemini_call(
        image_path,
        prompt,
        api_key
    )

    raw = re.sub(r"```json", "", raw)
    raw = re.sub(r"```", "", raw)

    try:
        data = json.loads(raw.strip())

    except Exception as e:

        print("\n[ERROR] JSON Parsing Failed\n")
        print(raw)

        raise e

    if "remarks" not in data or data.get("remarks") is None:
        data["remarks"] = ""

    return data

# ═══════════════════════════════════════════════════════════════
# FONTS
# ═══════════════════════════════════════════════════════════════

FONT_DIR = "/usr/share/fonts/truetype/dejavu"

def font(size, bold=False):

    name = (
        "DejaVuSans-Bold.ttf"
        if bold else
        "DejaVuSans.ttf"
    )

    try:
        return ImageFont.truetype(
            os.path.join(FONT_DIR, name),
            size
        )

    except:
        return ImageFont.load_default()

# ═══════════════════════════════════════════════════════════════
# TEXT CENTER
# ═══════════════════════════════════════════════════════════════

def draw_center(draw, text, x, y, w, fnt, color):

    bbox = draw.textbbox(
        (0, 0),
        text,
        font=fnt
    )

    tw = bbox[2] - bbox[0]

    draw.text(
        (x + (w - tw) / 2, y),
        text,
        font=fnt,
        fill=color
    )

# ═══════════════════════════════════════════════════════════════
# REPORT GENERATOR
# ═══════════════════════════════════════════════════════════════

def generate_report(data, output_path, report_type="cbc"):

    r_type = report_type.lower().strip()
    if r_type == "creatinine":
        ref_dict = CREATININE_REFERENCE
        title_text = "CREATININE REPORT"
        banner_text = "AI Kidney Function Analysis"
        remarks_title = "REMARKS / CLINICAL FINDINGS"
    elif r_type == "hba1c":
        ref_dict = HBA1C_REFERENCE
        title_text = "HbA1c & DIABETES REPORT"
        banner_text = "AI Diabetes & Glycated Hemoglobin Analysis"
        remarks_title = "REMARKS / CLINICAL FINDINGS"
    else:
        ref_dict = CBC_REFERENCE
        title_text = "COMPLETE BLOOD COUNT REPORT"
        banner_text = "AI Hematology Analysis"
        remarks_title = "REMARKS / PERIPHERAL FILM"

    W = 1100
    H = 1800

    img = Image.new(
        "RGB",
        (W, H),
        (245, 247, 250)
    )

    draw = ImageDraw.Draw(img)

    # Fonts
    title_font = font(30, True)
    sec_font = font(18, True)
    text_font = font(14)
    text_bold = font(14, True)
    small_font = font(11)

    # Colors
    dark = (15, 25, 45)
    blue = (35, 95, 170)
    white = (255, 255, 255)
    border = (190, 200, 210)

    # HEADER
    draw.rectangle(
        [0, 0, W, 110],
        fill=dark
    )

    draw_center(
        draw,
        title_text,
        0,
        20,
        W,
        title_font,
        white
    )

    draw_center(
        draw,
        banner_text,
        0,
        65,
        W,
        text_font,
        (180, 200, 220)
    )

    # PATIENT INFO
    draw.rounded_rectangle(
        [30, 140, W - 30, 290],
        radius=12,
        fill=white,
        outline=border,
        width=2
    )

    draw.rectangle(
        [30, 140, W - 30, 185],
        fill=blue
    )

    draw.text(
        (50, 152),
        "PATIENT INFORMATION",
        font=sec_font,
        fill=white
    )

    info = [
        ("Name", data.get("patient_name", "-")),
        ("Age", data.get("patient_age", "-")),
        ("Gender", data.get("patient_gender", "-")),
        ("Date", data.get("test_date", "-")),
        ("Laboratory", data.get("lab_name", "-")),
    ]

    x = 60
    y = 215

    for label, value in info:

        draw.text(
            (x, y),
            label,
            font=text_bold,
            fill=(90, 90, 90)
        )

        draw.text(
            (x, y + 22),
            str(value),
            font=text_font,
            fill=dark
        )

        x += 200

        if x > 850:
            x = 60
            y += 60

    # TABLE HEADER
    y = 340

    draw.rounded_rectangle(
        [30, y, W - 30, y + 45],
        radius=8,
        fill=blue
    )

    headers = [
        "Parameter",
        "Result",
        "Unit",
        "Reference"
    ]

    cols = [60, 420, 620, 800]

    for h, cx in zip(headers, cols):

        draw.text(
            (cx, y + 12),
            h,
            font=text_bold,
            fill=white
        )

    y += 55

    alt = False

    # VALUES
    for param, (unit, ref) in ref_dict.items():

        value = data.get(param, "-")
        if value is None:
            value = "-"

        bg = (
            (255, 255, 255)
            if not alt else
            (235, 242, 248)
        )

        draw.rectangle(
            [30, y, W - 30, y + 42],
            fill=bg
        )

        draw.text(
            (60, y + 12),
            param,
            font=text_font,
            fill=dark
        )

        draw.text(
            (430, y + 12),
            str(value),
            font=text_bold,
            fill=dark
        )

        draw.text(
            (630, y + 12),
            unit,
            font=text_font,
            fill=(80, 80, 80)
        )

        draw.text(
            (810, y + 12),
            ref,
            font=text_font,
            fill=dark
        )

        y += 42

        alt = not alt

    # REMARKS BOX
    y += 35

    box_height = 420

    draw.rounded_rectangle(
        [30, y, W - 30, y + box_height],
        radius=12,
        fill=white,
        outline=border,
        width=2
    )

    draw.rectangle(
        [30, y, W - 30, y + 45],
        fill=blue
    )

    draw.text(
        (50, y + 12),
        remarks_title,
        font=sec_font,
        fill=white
    )

    yy = y + 70

    remarks = data.get("remarks", "")
    peripheral = data.get("peripheral_film", [])
    interpretation = data.get("interpretation", "")
    suggestions = data.get("suggestions", [])

    if remarks:

        draw.text(
            (55, yy),
            "Remarks:",
            font=text_bold,
            fill=dark
        )

        yy += 30

        draw.text(
            (75, yy),
            str(remarks),
            font=text_font,
            fill=(40, 40, 40)
        )

        yy += 55

    if peripheral:

        draw.text(
            (55, yy),
            "Peripheral Film:",
            font=text_bold,
            fill=dark
        )

        yy += 30

        for item in peripheral:

            draw.text(
                (85, yy),
                f"• {item}",
                font=text_font,
                fill=(40, 40, 40)
            )

            yy += 28

    if interpretation:

        yy += 10

        draw.text(
            (55, yy),
            "Interpretation:",
            font=text_bold,
            fill=(180, 40, 40)
        )

        yy += 30

        draw.text(
            (85, yy),
            interpretation,
            font=text_font,
            fill=(120, 30, 30)
        )

        yy += 45

    if suggestions:

        draw.text(
            (55, yy),
            "Suggested Tests:",
            font=text_bold,
            fill=dark
        )

        yy += 30

        for s in suggestions:

            draw.text(
                (85, yy),
                f"• {s}",
                font=text_font,
                fill=(40, 40, 40)
            )

            yy += 28

    # FOOTER
    footer_y = H - 70

    draw.rectangle(
        [0, footer_y, W, H],
        fill=dark
    )

    draw_center(
        draw,
        "AI Generated Medical Report • Gemini 2.5 Flash",
        0,
        footer_y + 20,
        W,
        small_font,
        (190, 210, 230)
    )

    img.save(output_path)

    print(f"[OK] Saved report image: {output_path}")

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--image",
        required=True
    )

    parser.add_argument(
        "--type",
        default=None
    )

    args = parser.parse_args()

    api_key = os.environ.get(
        "GEMINI_API_KEY",
        ""
    ).strip()

    if not api_key:

        print("\n[ERROR] GEMINI_API_KEY not found\n")

        sys.exit(1)

    image_path = args.image

    if not os.path.exists(image_path):

        print(f"[ERROR] File not found: {image_path}")

        sys.exit(1)

    print("\n===================================")
    print("Enhanced Lab Report Generator")
    print("===================================\n")

    # Detect type
    if args.type:

        report_type = args.type

    else:

        report_type = detect_report_type(
            image_path,
            api_key
        )

    print(f"[INFO] Report Type: {report_type}")

    if report_type == "unknown":

        print("[ERROR] Could not detect report type")

        sys.exit(1)

    # Extract data
    data = extract_data(
        image_path,
        report_type,
        api_key
    )

    print("\n[EXTRACTED DATA]\n")

    for k, v in data.items():
        print(f"{k}: {v}")

    # Save JSON
    ts = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    os.makedirs(
        "reports",
        exist_ok=True
    )

    json_path = (
        f"reports/{report_type}_{ts}.json"
    )

    with open(json_path, "w") as f:
        json.dump(
            data,
            f,
            indent=2
        )

    print(f"\n[OK] Saved JSON: {json_path}")

    # Generate report image
    output_image = (
        f"reports/{report_type}_{ts}.png"
    )

    generate_report(
        data,
        output_image,
        report_type
    )

    print("\n[DONE]\n")

# ═══════════════════════════════════════════════════════════════
# COMPATIBILITY WRAPPERS
# For RepoAssist AI old backend
# ═══════════════════════════════════════════════════════════════

def extract_report_data(image_path, api_key, report_type):

    return extract_data(
        image_path,
        report_type,
        api_key
    )

def generate_image_report(data, report_type, output_path):

    return generate_report(
        data,
        output_path,
        report_type
    )

# ═══════════════════════════════════════════════════════════════
# MAIN ENTRY
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    main()