require('dotenv').config();
const { Pool } = require('pg');

// Verify DATABASE_URL exists before initializing
if (!process.env.DATABASE_URL) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is missing on Render!");
} else {
  console.log("Connecting with database host:", process.env.DATABASE_URL.split('@')[1] || "URL FOUND");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false 
  },
  connectionTimeoutMillis: 10000
});

module.exports = {
  async findByUsername(username) {
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0];
  },

  async createUser({ username, passwordHash }) {
    const res = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );
    return res.rows[0];
  },

  async getBudget(userId) {
    const res = await pool.query('SELECT * FROM budgets WHERE user_id = $1', [userId]);
    if (res.rows.length === 0) return null;
    
    const row = res.rows[0];
    return {
      income: row.income,
      expenses: row.expenses,
      savings: row.savings,
      debt: row.debt,
      updatedAt: row.updated_at
    };
  },

  async saveBudget(userId, { income, expenses, savings, debt }) {
    const query = `
      INSERT INTO budgets (user_id, income, expenses, savings, debt, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        income = EXCLUDED.income,
        expenses = EXCLUDED.expenses,
        savings = EXCLUDED.savings,
        debt = EXCLUDED.debt,
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [userId, income || 0, expenses || 0, savings || 0, debt || 0];
    const res = await pool.query(query, values);
    
    const row = res.rows[0];
    return {
      income: row.income,
      expenses: row.expenses,
      savings: row.savings,
      debt: row.debt,
      updatedAt: row.updated_at
    };
  }
};