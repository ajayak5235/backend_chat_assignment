import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const createPool = () => {
  const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: parseInt(process.env.PORT_DB),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
};

export const initializeDatabase = async (pool: mysql.Pool) => {
  const connection = await pool.getConnection();

  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      )
    `);

    // Create chats table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id VARCHAR(36) PRIMARY KEY,
        user_a_id VARCHAR(36) NOT NULL,
        user_b_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_chat (user_a_id, user_b_id),
        INDEX idx_users (user_a_id, user_b_id)
      )
    `);

    // Create chat_members table for tracking last seen messages
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_members (
        chat_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen_message_id VARCHAR(36),
        PRIMARY KEY (chat_id, user_id),
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
};
