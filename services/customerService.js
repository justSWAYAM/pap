const pool = require("../db");

/**
 * Find a customer by their phone number
 */
async function findContactByPhone(phone) {
    const result = await pool.query(
        `
        SELECT *
        FROM customers
        WHERE phone = $1
        `,
        [phone]
    );

    return result.rows[0];
}

/**
 * Add a new customer to the database
 */
async function addContact(name, phone, aliases) {
    const existing = await findContactByPhone(phone);

    // If customer exists, throw a custom error to handle in your main handler
    if (existing) {
        const error = new Error("Contact already exists");
        error.code = "ALREADY_EXISTS";
        error.existingContact = existing;
        throw error;
    }

    // PostgreSQL handles arrays natively, but if your column is JSONB/Text, 
    // keep JSON.stringify(aliases). If it's a TEXT[], use `aliases` directly.
    const result = await pool.query(
        `
        INSERT INTO customers (name, phone, aliases)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, phone, JSON.stringify(aliases)]
    );

    return result.rows[0];
}

module.exports = {
    addContact,
    findContactByPhone,
};