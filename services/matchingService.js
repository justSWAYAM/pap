const pool = require("../db");

async function findTopMatches(receiverName) {
  if (!receiverName) {
    return [];
  }

  const cleanedName = receiverName
    .replace(/^(mr|mrs|ms)\.?\s+/i, "")
    .trim();

  if (!cleanedName) {
    return [];
  }

  try {
    const query = `
      SELECT
        id,
        name,
        phone,  -- 👈 FIX: Added phone column here so PostgreSQL retrieves it
        aliases,
        ROUND(
          (
            GREATEST(
              similarity(LOWER(name), LOWER($1)),
              COALESCE(
                (
                  SELECT MAX(
                    similarity(
                      LOWER(alias),
                      LOWER($1)
                    )
                  )
                  FROM jsonb_array_elements_text(aliases) alias
                ),
                0
              )
            ) * 100
          )::numeric,
          0
        ) AS confidence
      FROM customers
      ORDER BY confidence DESC
      LIMIT 3;
    `;

    const { rows } = await pool.query(query, [cleanedName]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone, // 👈 Now this will correctly contain the data
      aliases: row.aliases,
      confidence: Number(row.confidence),
    }));
  } catch (error) {
    console.error("Error matching customer:", error);
    throw error;
  }
}

module.exports = {
  findTopMatches,
};