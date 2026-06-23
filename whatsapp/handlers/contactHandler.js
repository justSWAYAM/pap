const {
  addContact,
} = require("../../services/customerService");

const {
  generateAliases,
} = require("../utils/aliases");

const {
  normalizePhone,
} = require("../utils/phone");

function isContactMessage(text) {
  return (
    text.includes("[Name]") &&
    text.includes("[Mobile]")
  );
}

async function handleContact(chat, text) {
  const name =
    text.match(/\[Name\](.*)/i)?.[1]?.trim();

  const rawPhone =
    text.match(/\[Mobile\](.*)/i)?.[1]?.trim();

  const phone =
    normalizePhone(rawPhone || "");

  if (!name || !phone) {
    await chat.sendMessage(
      "❌ Invalid contact format"
    );
    return;
  }

  const aliases =
    generateAliases(name);

  try {
    const contact =
      await addContact(
        name,
        phone,
        aliases
      );

    await chat.sendMessage(
`✅ Contact Added

Name: ${contact.name}
Phone: ${contact.phone}`
    );
  } catch (error) {
    if (
      error.code ===
      "ALREADY_EXISTS"
    ) {
      await chat.sendMessage(
`⚠️ Contact Already Exists

Name: ${error.existingContact.name}
Phone: ${error.existingContact.phone}`
      );
      return;
    }

    // Fallback for any other unexpected database or system errors
    console.error("Error adding contact:", error);
    await chat.sendMessage("❌ Failed to add contact");
  }
} // <-- This closing brace was missing

module.exports = {
  isContactMessage,
  handleContact,
};