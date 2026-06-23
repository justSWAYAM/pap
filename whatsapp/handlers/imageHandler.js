const fs = require("fs");
const path = require("path");

const { extractPaymentDetails } = require("../../services/geminiService");
const { findTopMatches } = require("../../services/matchingService");
const {
  savePendingSelection,
} = require("../../services/pendingSelectionService");

async function handleImage(message) {
  try {
   

    if (!message.hasMedia) {
      await message.reply("❌ No image found.");
      return;
    }

    const media = await message.downloadMedia();
    if (!media) {
      await message.reply("❌ Failed to download image.");
      return;
    }

    // Handle directory mapping safely
    const screenshotsDir = path.join(process.cwd(), "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const extension = media.mimetype?.split("/")[1] || "jpg";
    const fileName = `${Date.now()}.${extension}`;
    const filePath = path.join(screenshotsDir, fileName);

    fs.writeFileSync(filePath, media.data, "base64");
   

    await message.reply(`📸 Screenshot saved\n\nFile: ${fileName}`);

    // 1. OCR Extraction via Gemini
   
    const paymentDetails = await extractPaymentDetails(filePath);
    

    if (!paymentDetails || !paymentDetails.receiver_name) {
      await message.reply(
        "❌ Could not identify the receiver from the screenshot.",
      );
      return;
    }

    // 2. Query Fuzzy Match Algorithm
    
    const matches = await findTopMatches(paymentDetails.receiver_name);
    

    if (!matches || matches.length === 0) {
      await message.reply(
        `❌ No matching customer found for:\n${paymentDetails.receiver_name}\n\nPlease add the customer first.`,
      );
      return;
    }

    const bestMatch = matches[0];

    // 3. Fallback Flow: Low Confidence Match (< 60%)
    if (bestMatch.confidence < 60) {
      // CRITICAL FIX: Added `await` here so session state writes completely before prompting user
      savePendingSelection(
        message.from,
        {
          type: "transaction_selection",
          ocrData: paymentDetails,
          matches,
          screenshotPath: filePath
        }
      );

      const options =
        matches
          .map(
            (m, i) =>
              `${i + 1} → ${m.name}
📞 ${m.phone}
Confidence: ${m.confidence}%`
          )
          .join("\n\n")
        + "\n\n4 → Cancel";

      await message.reply(
        `⚠️ Customer not confidently identified.\n\n` +
        `Receiver: ${paymentDetails.receiver_name}\n` +
        `Amount: ₹${paymentDetails.amount || "N/A"}\n\n` +
        `${options}\n\n` +
        `Reply with the number (e.g., 1, 2,3,4)`,
      );
      return;
    }

    // 4. Happy Path Flow: High Confidence Match (>= 60%)
    await message.reply(
      `✅ Customer Matched\n\n` +
      `Customer: ${bestMatch.name}\n` +
      `Confidence: ${bestMatch.confidence}%\n\n` +
      `Ready to save transaction.`,
    );

    
  } catch (error) {
    
    try {
      await message.reply("❌ Failed to process screenshot.");
    } catch (_) {
      // Silently catch chat reply failures if client goes offline
    }
  }
}

module.exports = {
  handleImage,
};
