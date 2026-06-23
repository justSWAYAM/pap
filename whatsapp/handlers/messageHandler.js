const { isContactMessage, handleContact } = require("./contactHandler");
const { handleImage } = require("./imageHandler");
const { handleSelection } = require("./selectionHandler");
const { handleLedgerLookup } = require("./ledgerHandler");

const {
  getPendingSelection,
} = require("../../services/pendingSelectionService");

async function handleMessage(msg, chat) {
  // Images
  if (msg.type === "image") {
    await handleImage(msg);
    return;
  }

  if (msg.type !== "chat") {
    return;
  }

  const text = (msg.body || "").trim();

  if (!text) {
    return;
  }

  

  // Status
  if (text.toLowerCase() === "status") {
    const pending =
      getPendingSelection(msg.from);

    if (!pending) {
      await chat.sendMessage(
        "No active operation."
      );
    } else {
      await chat.sendMessage(
        `Pending: ${pending.type}`
      );
    }

    return;
  }

  // Pending state handling
  const pending =
    getPendingSelection(msg.from);

  if (pending) {
    

    if (
      ["1", "2", "3", "4"]
        .includes(text)
    ) {
      
      await handleSelection(
        chat,
        msg.from,
        text
      );

      return;
    }

    // Ignore everything else while waiting
    return;
  }

  // Ping
  if (
    text.toLowerCase() === "ping"
  ) {
    await chat.sendMessage(
      "pong"
    );
    return;
  }

  // Contact Creation
  if (
    isContactMessage(text)
  ) {
    await handleContact(
      chat,
      text
    );
    return;
  }

  // Ledger Lookup
  if (
    text.toLowerCase().startsWith(
      "ok "
    )
  ) {
    const customerQuery =
      text.slice(3).trim();

    if (!customerQuery) {
      await chat.sendMessage(
        "Usage: ok <customer>"
      );
      return;
    }

    await handleLedgerLookup(
      msg,
      customerQuery
    );

    return;
  }

  // Unknown commands ignored
}

module.exports = {
  handleMessage,
};