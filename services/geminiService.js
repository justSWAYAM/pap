const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

// Gather all available keys
const GEMINI_KEYS = [
process.env.GEMINI_API_KEY_1, // 👈 Added _API_ here
  process.env.GEMINI_API_KEY_2, // 👈 Added _API_ here
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

// Tracker kept in memory outside the function execution loop
let currentKeyIndex = 0;

async function extractPaymentDetails(imagePath) {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("No Gemini API keys found configured in environment variables.");
  }

  const imageBytes = fs.readFileSync(imagePath);

  const prompt = `
You are extracting information from an Indian payment screenshot.
Return ONLY valid JSON matching this schema:
{
  "receiver_name": "",
  "amount": 0,
  "txn_date": "",
  "txn_id": ""
}
Rules:
- receiver_name = person/business who received money
- amount = numeric only
- txn_date = YYYY-MM-DD if available
- txn_id = UPI reference / transaction reference
- If a field is missing use empty string
- Do not return markdown
- Do not return explanation
`;

  // We loop up to GEMINI_KEYS.length times to try keys sequentially starting from the rotated position
  for (let attempts = 0; attempts < GEMINI_KEYS.length; attempts++) {
    // Pick the next key in the global rotation order
    const apiKey = GEMINI_KEYS[currentKeyIndex];
    const activeIndex = currentKeyIndex;

    // Increment index pointer for the NEXT standalone function call (wrap around using modulo)
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;

    try {
      
      
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBytes.toString("base64"),
            },
          },
          {
            text: prompt,
          },
        ],
      });

      const text = response.text.trim();
      const cleanJsonText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      
      return JSON.parse(cleanJsonText);

    } catch (error) {
      const errorMessage = String(error.message || error);
      console.warn(`⚠️ Key [${activeIndex + 1}] execution failed:`, errorMessage);

      const isQuotaError = 
        errorMessage.includes("429") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") || 
        errorMessage.includes("quota");

      // If it's a quota issue and we haven't exhausted our loop attempts, let it step forward instantly
      if (isQuotaError && attempts < GEMINI_KEYS.length - 1) {
        console.log(`🔄 Quota issues hit on Key [${activeIndex + 1}]. Advancing back-up request immediately...`);
        continue;
      }

      // Halt execution immediately on system or file errors to protect key health
      throw error;
    }
  }

  throw new Error("All configured Gemini API keys have been exhausted during rotation retry cycle.");
}

module.exports = {
  extractPaymentDetails,
};