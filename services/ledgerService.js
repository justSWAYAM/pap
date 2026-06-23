const pool = require("../db");

async function getCustomerLedger(customerId) {
  const summaryQuery = `
    SELECT
      COUNT(*) AS total_transactions,
      COALESCE(SUM(amount), 0) AS total_amount
    FROM transactions
    WHERE customer_id = $1
  `;

  const transactionsQuery = `
    SELECT
      amount,
      txn_date,
      txn_id
    FROM transactions
    WHERE customer_id = $1
    ORDER BY txn_date DESC, id DESC
  `;

  const [summaryResult, transactionsResult] =
    await Promise.all([
      pool.query(summaryQuery, [customerId]),
      pool.query(transactionsQuery, [customerId]),
    ]);

  return {
    totalTransactions: Number(
      summaryResult.rows[0].total_transactions
    ),
    totalAmount: Number(
      summaryResult.rows[0].total_amount
    ),
    transactions: transactionsResult.rows,
  };
}

function formatLedger(customer, ledger) {
  const lines = [];

  lines.push(`📒 ${customer.name}`);
  lines.push(`📞 ${customer.phone}`);
  lines.push("");

  if (ledger.transactions.length === 0) {
    lines.push("No transactions found.");
  } else {
    for (const txn of ledger.transactions) {
      const date = new Date(
        txn.txn_date
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      lines.push(
        `${date} - ₹${txn.amount}`
      );
    }
  }

  lines.push("");
  lines.push("──────────────");
  lines.push(
    `Total Transactions: ${ledger.totalTransactions}`
  );
  lines.push(
    `Total Amount: ₹${ledger.totalAmount}`
  );

  return lines.join("\n");
}

module.exports = {
  getCustomerLedger,
  formatLedger,
};