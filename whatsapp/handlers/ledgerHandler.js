const {
    findTopMatches,
} = require("../../services/matchingService");

const {
    getCustomerLedger,
    formatLedger,
} = require("../../services/ledgerService");

const {
    savePendingSelection,
} = require("../../services/pendingSelectionService");

async function handleLedgerLookup(
    message,
    query
) {
    const matches =
        await findTopMatches(query);

    if (matches.length === 0) {
        await message.reply(
            "❌ Customer not found."
        );
        return;
    }

    if (
        matches.length === 1 ||
        matches[0].confidence >= 60
    ) {
        const customer =
            matches[0];

        const ledger =
            await getCustomerLedger(
                customer.id
            );

        const response =
            formatLedger(
                customer,
                ledger
            );

        await message.reply(
            response
        );

        return;
    }

    savePendingSelection(
        message.from,
        {
            type: "ledger_selection",
            matches
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
        `⚠️ Multiple matches found.

${options}`
    );
}

module.exports = {
    handleLedgerLookup,
};