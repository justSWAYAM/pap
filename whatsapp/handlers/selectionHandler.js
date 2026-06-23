const {
    getPendingSelection,
    removePendingSelection,
} = require("../../services/pendingSelectionService");

// Moved to the top to prevent blocking the async runtime
const { addTransaction } = require("../../services/transactionService");
const { getCustomerLedger, formatLedger } = require("../../services/ledgerService");

async function handleSelection(chat, chatId, text) {
    try {
        const pending = getPendingSelection(chatId);

        if (!pending) {
            await chat.sendMessage("❌ No pending selection found for this session.");
            return;
        }

        const cleanText = text.trim();

        // 1. Standardized cancellation check on input '4'
        if (cleanText === "4") {
            removePendingSelection(chatId);
            
            await chat.sendMessage("✅ Operation cancelled.");
            return;
        }

        // Convert string input (e.g., "1", "2", "3") to array index (0, 1, 2)
        const index = parseInt(cleanText, 10) - 1;

        // 2. Validate index boundaries based only on 1, 2, or 3
        if (isNaN(index) || index < 0 || index >= pending.matches.length) {
            await chat.sendMessage(
                `❌ Invalid option. Please reply with a number between 1 and ${pending.matches.length}, or 4 to cancel.`,
            );
            return;
        }

        const customer = pending.matches[index];

        // Route behavior based on the pending operation type
        switch (pending.type) {
            case "ledger_selection": {
                const ledger = await getCustomerLedger(customer.id);
                const response = formatLedger(customer, ledger);

                removePendingSelection(chatId);
                await chat.sendMessage(response);
                break;
            }

            case "transaction_selection": {
                // Create the transaction record in the database
                const transaction = await addTransaction({
                    customerId: customer.id,
                    amount: pending.ocrData.amount,
                    txnDate: pending.ocrData.txn_date,
                    txnId: pending.ocrData.txn_id,
                    screenshotPath: pending.screenshotPath,
                    ocrData: pending.ocrData,
                });

               

                // CRITICAL: Clear out the pending cache state so they don't accidentally re-trigger it
                removePendingSelection(chatId);

                // FIX: Combined confirmation and details into a single clean message dispatch
                await chat.sendMessage(
                    `✅ *Transaction Saved Successfully*\n\n` +
                    `👤 *Customer:* ${customer.name}\n` +
                    `💰 *Amount:* ₹${transaction.amount || pending.ocrData.amount}\n` +
                    `📅 *Date:* ${transaction.txn_date || pending.ocrData.txn_date || "N/A"}\n` +
                    `🆔 *Txn ID:* ${transaction.txn_id || pending.ocrData.txn_id || "N/A"}`
                );
                break;
            }

            default:
                await chat.sendMessage("❌ Unknown pending operation.");
                removePendingSelection(chatId);
                return;
        }

    } catch (error) {
        console.error("Error inside handleSelection:", error);
        await chat.sendMessage("❌ An error occurred while saving your selection.");
    }
}

module.exports = {
    handleSelection,
};