
def get_recommendations(report_type, analysis, prediction=None):
    """
    Generates dynamic recommendations based on report type and analysis results.
    """
    recs = []
    
    if report_type == "HBA1C":
        hba1c = analysis.get("HbA1c", {})
        val = hba1c.get("value")
        status = hba1c.get("status", "normal").lower()
        
        if status == "critical" or (val and val >= 6.5):
            recs = [
                "Your HbA1c level indicates a high risk or presence of diabetes. Consult an endocrinologist immediately.",
                "Adopt a low-glycemic diet: reduce sugar, white bread, and processed carbs.",
                "Monitor blood glucose levels daily as recommended by your doctor.",
                "Aim for at least 30 minutes of moderate physical activity most days of the week."
            ]
        elif status == "high" or (val and val >= 5.7):
            recs = [
                "Your HbA1c level is in the pre-diabetes range. Lifestyle changes can help reverse this.",
                "Increase fiber intake by eating more vegetables, legumes, and whole grains.",
                "Limit sugary beverages and focus on portion control.",
                "Repeat the HbA1c test in 3 months to monitor progress."
            ]
        else:
            recs = [
                "Your HbA1c level is within the normal range. Great job!",
                "Continue maintaining a balanced diet and regular exercise.",
                "Keep a consistent sleep schedule to support metabolic health.",
                "Consider an annual checkup to monitor your long-term blood sugar levels."
            ]
            
    elif report_type == "CREATININE":
        creatinine = analysis.get("Serum Creatinine", {})
        val = creatinine.get("value")
        status = creatinine.get("status", "normal").lower()
        
        if status == "critical" or status == "high":
            recs = [
                "Elevated creatinine levels may indicate reduced kidney function. Please consult a nephrologist.",
                "Maintain adequate hydration, but discuss fluid intake limits with your doctor if kidney issues are confirmed.",
                "Avoid excessive intake of NSAIDs (like ibuprofen) as they can affect kidney function.",
                "Limit high-protein foods and salt intake until further medical evaluation."
            ]
        elif status == "low":
            recs = [
                "Low creatinine can sometimes be linked to low muscle mass or certain dietary factors.",
                "Ensure you are getting adequate protein in your diet.",
                "Stay active with resistance training to maintain muscle health.",
                "Consult your doctor if you experience persistent muscle weakness."
            ]
        else:
            recs = [
                "Your creatinine level is within the normal range, indicating good kidney function.",
                "Stay hydrated by drinking 8-10 glasses of water daily.",
                "Avoid overuse of supplements and over-the-counter pain medications.",
                "Continue with a healthy, balanced diet."
            ]
            
    elif report_type == "CBC":
        # General CBC logic
        # Check for anemia (Low HGB/RBC)
        hgb = analysis.get("hgb", analysis.get("hemoglobin", {}))
        wbc = analysis.get("wbc", {})
        plt = analysis.get("plt", analysis.get("platelets", {}))
        
        if hgb.get("status") in ["low", "critical"]:
            recs.append("Low hemoglobin suggests anemia. Increase iron-rich foods like spinach, red meat, and lentils.")
            recs.append("Combine iron-rich foods with Vitamin C (like oranges) to improve absorption.")
        
        if wbc.get("status") in ["high", "critical"]:
            recs.append("High WBC count may indicate an underlying infection or inflammation. Rest and stay hydrated.")
            recs.append("Consult your doctor to identify the source of the high white cell count.")
            
        if plt.get("status") in ["low", "critical"]:
            recs.append("Low platelet count (thrombocytopenia) can increase bleeding risk. Avoid contact sports.")
            recs.append("Seek medical attention if you notice unusual bruising or prolonged bleeding.")
            
        if not recs:
            recs = [
                "Your CBC parameters are within normal ranges.",
                "Maintain a balanced diet rich in iron, Vitamin B12, and folic acid.",
                "Stay physically active and get regular health checkups.",
                "Keep hydrated and maintain good sleep hygiene."
            ]
        else:
            recs.append("Please share these results with your healthcare provider for a clinical diagnosis.")

    # Fallback if nothing else
    if not recs:
        recs = ["Consult a qualified healthcare professional for a detailed interpretation of your results."]
        
    return recs
