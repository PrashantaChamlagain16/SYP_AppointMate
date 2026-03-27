const { Pool } = require("pg");
require("dotenv").config();

const shouldUseSsl = process.env.DB_SSL === "true";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
      },
);

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

pool.testConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT current_database() AS db, NOW() AS connected_at",
    );
    console.log(`PostgreSQL Connected (${result.rows[0].db})`);
  } finally {
    client.release();
  }
};

module.exports = pool;
