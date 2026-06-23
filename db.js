const { Pool } = require("pg");

const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "ledger",
    user: "swayammishra",
    password: ""
});

module.exports = pool;