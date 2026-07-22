
export const processMedicalReport = async (uploadedFile, reportType) => {
  try {
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("reportType", reportType);

    const response = await fetch("http://127.0.0.1:5000/process-report", {
      method: "POST",
      body: formData,
    });

    let data;

    // 🔥 SAFETY: prevent JSON crash
    try {
      data = await response.json();
    } catch (err) {
      throw new Error("Invalid server response");
    }

    // ❌ HTTP ERROR
    if (!response.ok) {
      throw new Error(data?.error || "Backend error");
    }

    // 🟡 OCR FAILED CASE (backend handled error safely)
    if (data.status === "ocr_failed") {
      return {
        status: "ocr_failed",
        message: data.message || "OCR failed to read the image",
      };
    }

    // ==============================
    // ✅ SUCCESS TRANSFORMATION
    // ==============================
    const sourceData = data.analysis || {};

    const parameters = Object.keys(sourceData).map((key) => ({
      name: key,
      value: sourceData[key]?.value ?? null,
      unit: sourceData[key]?.unit || "",
      range: sourceData[key]?.range_str || "N/A",
      status: sourceData[key]?.status || "unknown",
    }));

    return {
      status: "success",
      patientName: data.patient_name || "Unknown Patient",
      date: data.date || new Date().toLocaleDateString(),
      prediction: {
        disease: data.prediction,
        confidence: data.confidence,
      },
      reportType: data.report_type,
      parameters,
      summary: data.summary || "",
      summary_ur: data.summary_ur || "",
      peripheral_findings: data.peripheral_findings || [],
      recommendations: data.recommendations || [
        "Consult your doctor if symptoms persist",
        "Follow physician advice",
        "Repeat CBC if recommended",
      ],
    };

  } catch (error) {
    console.error("CBC API Error:", error);

    return {
      status: "error",
      message: error.message || "Something went wrong",
    };
  }
};