
import requests
import os
import time

URL = "http://127.0.0.1:5000/process-cbc"
FILE_PATH = "uploads/report.png" 

def test_backend():
    print(f"Testing backend with {FILE_PATH}...")
    
    if not os.path.exists(FILE_PATH):
        print(f"File not found: {FILE_PATH}")
        return

    try:
        with open(FILE_PATH, "rb") as f:
            files = {"file": f}
            response = requests.post(URL, files=files)
        
        if response.status_code == 200:
            print("SUCCESS: Request completed!")
            data = response.json()
            # print("Summary:", data.get("summary")) # Parsed summary
            
            # --- DEBUG: Print Raw Text if available ---
            # Backend should return it? app.py prints it to console, but doesn't return it in JSON usually.
            # I can't easily get it here unless I update app.py.
            # But app.py prints to stdout causing the background command verification to capture it?
            # Yes, check command status output.
            # print("CBC Values:", data.get("cbc_values")) # Deprecated view
            
            print("\n----- ANALYSIS -----")
            analysis = data.get("analysis", {})
            for k, v in analysis.items():
                print(f"{k}: {v['value']} ({v['status']}) [{v['range_str']}]")

            print("\nPrediction:", data.get("prediction"))
        else:
            print(f"FAILURE: Status code {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_backend()
