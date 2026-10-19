/**
 * Vercel Serverless Function: Proxy securizat pentru trimiterea aplicatiilor de curier
 * catre Webhook-ul Google Apps Script & Google Sheets.
 */

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || 
  "https://script.google.com/macros/s/AKfycbxbI7IwbaTI-5IabaTRukJdvKtcX4se5_igCeptagyEhaiQZLfziiMHvprJsa7SOzGXiQ/exec";

const SECRET_TOKEN = process.env.GOOGLE_APPS_SCRIPT_TOKEN || "bolt_fleet2_secure_2026";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

export default async function handler(req, res) {
  // Setari CORS pentru apeluri din orice domeniu/mobil
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { name, cnp, phone, email, city, vehicle, file } = req.body || {};

    // Validare de baza
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Numele și prenumele sunt obligatorii." });
    }

    const cleanCnp = String(cnp || "").replace(/\D/g, "");
    if (cleanCnp.length !== 13) {
      return res.status(400).json({ success: false, error: "CNP-ul trebuie să conțină exact 13 cifre numerice." });
    }

    const cleanPhone = String(phone || "").trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({ success: false, error: "Numărul de telefon este invalid." });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, error: "Orașul de livrare este obligatoriu." });
    }

    const payload = {
      token: SECRET_TOKEN,
      action: "submit_applicant",
      name: name.trim(),
      cnp: cleanCnp,
      phone: cleanPhone,
      email: (email || "").trim().toLowerCase(),
      city: city.trim(),
      vehicle: vehicle || "🚗 Mașină",
      file: file || null,
      source: "Vercel Web App"
    };

    // Trimitem catre Google Apps Script cu urmarire automata a redirectului 302
    const gasResponse = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const responseText = await gasResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn("Răspunsul Apps Script nu este JSON:", responseText.slice(0, 200));
      responseData = { success: true, raw: responseText };
    }

    if (gasResponse.ok && (responseData.success !== false)) {
      return res.status(200).json({
        success: true,
        message: "Înscrierea a fost transmisă cu succes către flotă!",
        data: responseData
      });
    } else {
      console.error("Eroare returnată de Apps Script:", responseData);
      return res.status(500).json({
        success: false,
        error: responseData.error || "A apărut o problemă la înregistrare. Reîncercați."
      });
    }
  } catch (error) {
    console.error("Eroare de rețea / serverless handler:", error);
    return res.status(500).json({
      success: false,
      error: "Eroare internă de server: " + (error.message || String(error))
    });
  }
}
