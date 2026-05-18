import { useState } from "react";
import { BarChart3, Award, Sprout, Droplets, Sun, Thermometer, Scale } from "lucide-react";

// ---------------------------------------------------------------------------
// MSP / indicative mandi price ranges (₹ per kg) — sourced from CACP / DAC&FW
// MSP 2024-25 season. These are REFERENCE RANGES only; actual mandi prices
// vary by region, variety, and season. Always verify with your local mandi.
//
// Format: { A: [min, max], B: [min, max], C: [min, max] }
// ---------------------------------------------------------------------------
const PRICE_RANGES = {
  wheat:     { A: [22, 26],  B: [18, 22],  C: [14, 18]  },
  rice:      { A: [21, 25],  B: [17, 21],  C: [13, 17]  },
  maize:     { A: [18, 22],  B: [14, 18],  C: [10, 14]  },
  cotton:    { A: [65, 90],  B: [50, 65],  C: [35, 50]  },
  sugarcane: { A: [3.5, 4],  B: [3, 3.5],  C: [2.5, 3]  },
};

// Maximum sensible weight per submission (10,000 tonnes = 10,000,000 kg).
// Prevents absurd financial figures from typos.
const MAX_WEIGHT_KG = 10_000_000;

function formatRange(weightKg, range) {
  const lo = Math.round(weightKg * range[0]).toLocaleString("en-IN");
  const hi = Math.round(weightKg * range[1]).toLocaleString("en-IN");
  return `₹${lo} – ₹${hi}`;
}

export default function CropGrading({ onClose }) {
  const [cropType, setCropType] = useState("wheat");
  const [weight, setWeight] = useState("");
  const [moisture, setMoisture] = useState("");
  const [protein, setProtein] = useState("");
  const [isOrganic, setIsOrganic] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weightError, setWeightError] = useState("");

  const cropTypes = [
    { value: "wheat",     label: "Wheat",     icon: "🌾" },
    { value: "rice",      label: "Rice",      icon: "🍚" },
    { value: "maize",     label: "Maize",     icon: "🌽" },
    { value: "cotton",    label: "Cotton",    icon: "🧵" },
    { value: "sugarcane", label: "Sugarcane", icon: "🎋" },
  ];

  // Validate weight and return the parsed number, or null on error
  function parseWeight(raw) {
    const val = parseFloat(raw);
    if (!raw || raw.trim() === "") {
      setWeightError("Weight is required.");
      return null;
    }
    if (isNaN(val) || val <= 0) {
      setWeightError("Please enter a positive number.");
      return null;
    }
    if (val > MAX_WEIGHT_KG) {
      setWeightError(`Maximum weight is ${MAX_WEIGHT_KG.toLocaleString("en-IN")} kg.`);
      return null;
    }
    setWeightError("");
    return val;
  }

  const handleGrade = () => {
    const weightKg = parseWeight(weight);
    if (weightKg === null) return;

    setLoading(true);

    setTimeout(() => {
      const moistureNum = parseFloat(moisture) || 0;
      const proteinNum  = parseFloat(protein)  || 0;

      let grade = "C";
      let score = 50;

      if (cropType === "wheat") {
        if (proteinNum >= 12 && moistureNum <= 12) {
          grade = "A"; score = 90;
        } else if (proteinNum >= 10 && moistureNum <= 14) {
          grade = "B"; score = 75;
        } else if (proteinNum >= 8 && moistureNum <= 16) {
          grade = "C"; score = 60;
        } else {
          // Bug fix: grade was left as "C" but score was 40 — now explicit
          grade = "C"; score = 40;
        }
      } else if (cropType === "rice") {
        if (moistureNum <= 14) {
          grade = "A"; score = 90;
        } else if (moistureNum <= 16) {
          grade = "B"; score = 75;
        } else {
          grade = "C"; score = 60;
        }
      } else {
        if (moistureNum <= 15) {
          grade = "A"; score = 85;
        } else if (moistureNum <= 18) {
          grade = "B"; score = 70;
        } else {
          grade = "C"; score = 55;
        }
      }

      if (isOrganic) score = Math.min(100, score + 5);

      setResult({
        grade,
        score,
        moisture: moistureNum,
        protein: proteinNum,
        weightKg,
        organicBonus: isOrganic,
        priceRange: PRICE_RANGES[cropType]?.[grade] ?? PRICE_RANGES.wheat[grade],
        cropType,
      });
      setLoading(false);
    }, 1000);
  };

  const getGradeColor = (grade) => {
    if (grade === "A") return "#16a34a";
    if (grade === "B") return "#f59e0b";
    return "#ef4444";
  };

  const getGradeDescription = (grade, score) => {
    if (grade === "A") return "Premium grade — Excellent quality for export";
    if (grade === "B") return "Good grade — Suitable for domestic markets";
    // Distinguish between borderline-C (score 55-60) and poor-C (score 40)
    if (score >= 55) return "Standard grade — Suitable for local markets";
    return "Below standard — Consider drying/processing before sale";
  };

  return (
    <div style={{
      maxWidth: "500px",
      margin: "40px auto",
      padding: "24px",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      position: "relative"
    }}>
      <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>

      <h2 style={{ color: "#16a34a", fontSize: "24px", marginBottom: "20px" }}>
        📊 Crop Grading Assistant
      </h2>

      {/* Crop type */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Crop Type
        </label>
        <select
          value={cropType}
          onChange={(e) => { setCropType(e.target.value); setResult(null); }}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
        >
          {cropTypes.map(crop => (
            <option key={crop.value} value={crop.value}>{crop.icon} {crop.label}</option>
          ))}
        </select>
      </div>

      {/* Weight */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Weight (kg)
        </label>
        <input
          type="number"
          value={weight}
          min="0.1"
          max={MAX_WEIGHT_KG}
          onChange={(e) => { setWeight(e.target.value); setWeightError(""); }}
          placeholder="Enter total weight harvested"
          style={{
            width: "100%", padding: "10px", borderRadius: "8px",
            border: `1px solid ${weightError ? "#ef4444" : "#d1d5db"}`, fontSize: "14px"
          }}
        />
        {weightError && (
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>{weightError}</p>
        )}
      </div>

      {/* Moisture */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Moisture Content (%)
        </label>
        <input
          type="number"
          value={moisture}
          onChange={(e) => setMoisture(e.target.value)}
          placeholder="e.g., 12.5"
          step="0.1"
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
        />
      </div>

      {/* Protein — wheat only */}
      {cropType === "wheat" && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            Protein Content (%)
          </label>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="e.g., 11.5"
            step="0.1"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
          />
        </div>
      )}

      {/* Organic */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input type="checkbox" checked={isOrganic} onChange={(e) => setIsOrganic(e.target.checked)} />
          <span>Organic Produce</span>
        </label>
      </div>

      <button
        onClick={handleGrade}
        disabled={!weight || loading}
        style={{
          width: "100%", padding: "12px",
          backgroundColor: loading ? "#86efac" : "#16a34a",
          color: "white", border: "none", borderRadius: "8px", fontSize: "16px",
          cursor: !weight || loading ? "not-allowed" : "pointer",
          opacity: !weight || loading ? 0.7 : 1
        }}
      >
        {loading ? "⏳ Analyzing..." : "📈 Calculate Grade"}
      </button>

      {result && (
        <div style={{ marginTop: "24px", padding: "20px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>

          {/* Grade + description */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: getGradeColor(result.grade), marginBottom: "8px" }}>
              Grade {result.grade}
            </div>
            <div style={{ fontSize: "16px", color: "#555" }}>
              {getGradeDescription(result.grade, result.score)}
            </div>
          </div>

          {/* Score + estimated value range */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ padding: "12px", background: "white", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Quality Score</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111" }}>
                {result.score}/100
              </div>
            </div>
            <div style={{ padding: "12px", background: "white", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                Indicative Value Range
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#111", lineHeight: "1.3" }}>
                {formatRange(result.weightKg, result.priceRange)}
              </div>
            </div>
          </div>

          {/* Disclaimer — always visible */}
          <div style={{
            marginTop: "12px", padding: "10px 12px",
            background: "#fffbeb", borderRadius: "8px",
            border: "1px solid #fde68a", fontSize: "11px", color: "#92400e", lineHeight: "1.5"
          }}>
            ⚠️ <strong>Indicative only.</strong> Price range based on MSP / mandi reference rates
            (CACP 2024-25) for <em>{cropTypes.find(c => c.value === result.cropType)?.label}</em>.
            Actual prices vary by region, variety, and season.
            Verify with your local mandi or e-NAM before making financial decisions.
          </div>

          {result.organicBonus && (
            <div style={{ marginTop: "10px", padding: "8px", background: "#dcfce7", borderRadius: "6px", fontSize: "12px", color: "#166534", textAlign: "center" }}>
              🌱 Organic bonus applied (+5 points)
            </div>
          )}

          <div style={{ marginTop: "16px", fontSize: "14px", color: "#555" }}>
            <p><strong>Recommendations:</strong></p>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              <li>Store in cool, dry conditions</li>
              <li>Use within 6 months for optimal quality</li>
              <li>Contact local procurement centers for premium rates</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
