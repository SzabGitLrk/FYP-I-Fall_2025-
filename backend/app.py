from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import sys
from werkzeug.utils import secure_filename

# Add current directory to sys.path to ensure modules are found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ocr.extract_text import extract_text
from utils.cbc_parser import extract_cbc_values, extract_peripheral_film_findings
from utils.extra_parsers import detect_report_type, extract_patient_info
from model.predict import predict_cbc
from nlp.summary import generate_summary, generate_hba1c_summary, generate_creatinine_summary
from tts.tts_engine import generate_voice, VOICE_UR, VOICE_EN
from nlp.chatbot_logic import chatbot, set_latest_report
from utils.hba1c_parser import extract_hba1c_values
from utils.creatinine_parser import extract_creatinine_values
from model.predict_hba1c import predict_hba1c
from model.predict_creatinine import predict_creatinine
from utils.analyzer import analyze_cbc, analyze_hba1c, analyze_creatinine
from utils.recommendations import get_recommendations
from deep_translator import GoogleTranslator

app = Flask(__name__)
CORS(app)

# ===============================
# Root Route
# ===============================
@app.route("/")
def home():
    return "CBC AI Backend is running! Use /process-cbc or /voice endpoints."

def translate_to_urdu(text):
    try:
        translator = GoogleTranslator(source='auto', target='ur')
        return translator.translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

# ===============================
# Report Processing Route
# ===============================
@app.route("/process-report", methods=["POST"])
@app.route("/process-cbc", methods=["POST"])
def process_report():
    uploaded = request.files.get("file")
    frontend_type = request.form.get("reportType", "CBC")
    
    if uploaded is None:
        return jsonify({"error": "No file uploaded (expected form field 'file')"}), 400

    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    original_name = secure_filename(uploaded.filename or "report")
    unique_prefix = uuid.uuid4().hex
    filename = f"{unique_prefix}_{original_name}"
    path = os.path.join(uploads_dir, filename)

    try:
        uploaded.save(path)
    except Exception as e:
        return jsonify({"error": f"Failed to save upload: {e}"}), 500

    try:
        # ==========================================
        # NEW WORKFLOW: Image -> Template Generator -> OCR
        # ==========================================
        from template.lab_report_generator import detect_report_type as template_detect, extract_report_data, generate_image_report, load_env_local
        
        load_env_local()
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
             return jsonify({"error": "GEMINI_API_KEY not found in environment. Please check .env.local"}), 500
             
        t_type = template_detect(path, api_key)
        if t_type == "unknown":
            # Fallback to frontend type or CBC
            t_type = frontend_type.lower()
            if t_type not in ["cbc", "creatinine", "hba1c"]:
                t_type = "cbc"
                
        t_data = extract_report_data(path, api_key, t_type)
        
        # Save to template/reports
        import json
        from datetime import datetime
        template_reports_dir = os.path.join(os.path.dirname(__file__), "template", "reports")
        os.makedirs(template_reports_dir, exist_ok=True)
        
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        generated_filename = f"{t_type}_report_{ts}.png"
        generated_path = os.path.join(template_reports_dir, generated_filename)
        
        # Save JSON
        json_path = os.path.join(template_reports_dir, f"{t_type}_report_{ts}_raw.json")
        with open(json_path, "w") as f:
            json.dump(t_data, f, indent=2)
            
        generate_image_report(t_data, t_type, generated_path)
        
        # Override path with the beautifully generated template from reports for OCR
        path = generated_path

        # OCR
        text = extract_text(path)
        
        # Detect logic
        report_type = detect_report_type(text, frontend_type)
        patient_name, _ = extract_patient_info(text)
        
        # Always use current date for the report
        import datetime
        report_date = datetime.date.today().strftime("%m/%d/%Y")
        
        if report_type == "HBA1C":
            hba1c_data, hba1c_units = extract_hba1c_values(text)
            
            # Override with perfect Gemini JSON data to bypass OCR misreads
            h_map = {"HbA1c": "hba1c_level", "Fasting_Glucose": "blood_glucose_level", "Random_Glucose": "blood_glucose_level"}
            for t_k, c_k in h_map.items():
                if t_data.get(t_k) is not None:
                    try: hba1c_data[c_k] = float(t_data[t_k])
                    except: pass
                    
            analysis = analyze_hba1c(hba1c_data, hba1c_units)
            prediction, confidence = predict_hba1c(hba1c_data)
            
            # Use original summary that expects the same nested structure
            # Ensure we use "HbA1c" label as expected by generate_hba1c_summary
            summary_mock_data = {label: {"value": data["value"]} for label, data in analysis.items()}
            # If "HbA1c" is not in analysis, try to add it from hba1c_level
            if "HbA1c" not in summary_mock_data and hba1c_data.get("hba1c_level") is not None:
                summary_mock_data["HbA1c"] = {"value": hba1c_data["hba1c_level"]}

            set_latest_report(text, hba1c_data, t_data, "HBA1C", analysis)
            summary_en = generate_hba1c_summary(summary_mock_data, t_data)

            # --- DYNAMIC RECOMMENDATIONS FOR HbA1c ---
            recs = get_recommendations("HBA1C", analysis)

            return jsonify({
                "status": "success",
                "report_type": "HBA1C",
                "patient_name": patient_name,
                "date": report_date,
                "analysis": analysis,
                "prediction": prediction,
                "confidence": confidence,
                "summary": summary_en,
                "summary_ur": translate_to_urdu(summary_en),
                "recommendations": recs
            })
        elif report_type == "CREATININE":
            creatinine_data, creatinine_units = extract_creatinine_values(text)
            
            # Override with perfect Gemini JSON data
            c_map = {"Creatinine": "serum_creatinine", "eGFR": "egfr"}
            for t_k, c_k in c_map.items():
                if t_data.get(t_k) is not None:
                    try: creatinine_data[c_k] = float(t_data[t_k])
                    except: pass
                    
            analysis = analyze_creatinine(creatinine_data, creatinine_units)
            prediction, confidence = predict_creatinine(creatinine_data)
            
            # mock for existing generate_creatinine_summary
            summary_mock_data = {label: {"value": data["value"], "unit": data["unit"]} for label, data in analysis.items()}
            # Ensure "Creatinine" label as expected by generate_creatinine_summary
            if "Creatinine" not in summary_mock_data and creatinine_data.get("serum_creatinine") is not None:
                summary_mock_data["Creatinine"] = {
                    "value": creatinine_data["serum_creatinine"], 
                    "unit": creatinine_units.get("serum_creatinine", "mg/dL")
                }

            set_latest_report(text, creatinine_data, t_data, "CREATININE", analysis)
            summary_en = generate_creatinine_summary(summary_mock_data, t_data)

            # --- DYNAMIC RECOMMENDATIONS FOR CREATININE ---
            recs = get_recommendations("CREATININE", analysis)

            return jsonify({
                "status": "success",
                "report_type": "CREATININE",
                "patient_name": patient_name,
                "date": report_date,
                "analysis": analysis,
                "prediction": prediction,
                "confidence": confidence,
                "summary": summary_en,
                "summary_ur": translate_to_urdu(summary_en),
                "recommendations": recs
            })
        
        # Else continue with CBC logic
        # Parse CBC values using the robust parser
        cbc = extract_cbc_values(text)
        
        # Override with perfect Gemini JSON data to bypass OCR misreads
        cbc_map = {
            "WBC": "wbc", "RBC": "rbc", "Hemoglobin": "hgb", "Hematocrit": "hct",
            "MCV": "mcv", "MCH": "mch", "MCHC": "mchc", "Platelets": "plt",
            "Neutrophils": "neutp", "Lymphocytes": "lymp", "Monocytes": "midp",
            "Eosinophils": "eos", "Basophils": "baso", "RDW": "rdwcv", "MPV": "mpv"
        }
        for t_k, c_k in cbc_map.items():
            if t_data.get(t_k) is not None:
                try: cbc[c_k] = float(t_data[t_k])
                except: pass
                
        peripheral_findings = extract_peripheral_film_findings(text)

        # Analysis
        # Analysis
        analysis = analyze_cbc(cbc)

        # ML Prediction
        prediction, confidence = predict_cbc(cbc)
        
        # Summary
        summary_en = generate_summary(cbc, t_data)

        # --- DYNAMIC RECOMMENDATIONS FOR CBC ---
        recs = get_recommendations("CBC", analysis)

        # ==========================================
        # TERMINAL OUTPUT (DETAILED)
        # ==========================================
        print("\n" + "="*60)
        print("REPORT ANALYSIS SUMMARY")
        print("="*60)
        print(f"{'PARAMETER':<15} | {'VALUE':<10} | {'STATUS':<10} | {'RANGE'}")
        print("-" * 60)
        
        for key, data in analysis.items():
            val_str = str(data['value']) if data['value'] is not None else "N/A"
            status = data['status'].upper()
            range_str = data['range_str']
            print(f"{key.upper():<15} | {val_str:<10} | {status:<10} | {range_str}")
            
        print("-" * 60)
        if peripheral_findings:
            print("PERIPHERAL FILM FINDINGS:")
            for f in peripheral_findings:
                print(f"- {f['term']}: {f['description']}")
            print("-" * 60)
            
        print(f"PREDICTION: {prediction.upper()} ({confidence}%)")
        print("="*60 + "\n")

        set_latest_report(text, cbc, t_data, "CBC", analysis)

        return jsonify({
            "status": "success",
            "report_type": "CBC",
            "patient_name": patient_name,
            "date": report_date,
            "cbc_values": cbc,
            "analysis": analysis,
            "prediction": prediction,
            "confidence": confidence,
            "summary": summary_en,
            "summary_ur": translate_to_urdu(summary_en),
            "recommendations": recs,
            "peripheral_findings": peripheral_findings
        })




    except Exception as e:
        # Frontend explicitly handles this non-crash state
        return jsonify({
            "status": "ocr_failed",
            "message": str(e)
        }), 200


# ===============================
# Voice Route
# ===============================
@app.route("/voice", methods=["POST"])
def voice():
    data = request.json
    text = data.get("text", "")
    lang = data.get("lang", "en")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Generate audio file path (relative to backend root)
    # tts_engine saves to "static/filename.mp3"
    try:
        audio_path = generate_voice(text, lang)
        
        # Construct URL
        # Assuming server is running on localhost:5000
        # audio_path is like "static/speech_xyz.mp3"
        # We need to return the full URL or relative URL that frontend can use.
        # Flask default static folder is 'static'. 
        
        filename = os.path.basename(audio_path)
        audio_url = f"{request.host_url}static/{filename}"
        
        return jsonify({"audio": audio_url})
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({"error": str(e)}), 500


# ===============================
# Chatbot Route
# ===============================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        bot_response = chatbot(user_message)
        return jsonify({"response": bot_response})
    except Exception as e:
        print(f"Chatbot Error: {e}")
        return jsonify({"error": str(e)}), 500


# ===============================
# Run Server
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
