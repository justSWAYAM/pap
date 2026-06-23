const pool = require("../db");

async function addTransaction({
  customerId,
  amount,
  txnDate,
  txnId,
  screenshotPath,
  ocrData,
}) {
  const query = `
    INSERT INTO transactions (
      customer_id,
      amount,
      txn_date,
      txn_id,
      screenshot_path,
      ocr_data
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *;
  `;

  const values = [
    customerId,
    amount,
    txnDate,
    txnId,
    screenshotPath,
    JSON.stringify(ocrData),
  ];

  const { rows } = await pool.query(
    query,
    values
  );

  return rows[0];
}

module.exports = {
  addTransaction,
};