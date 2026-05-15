import type { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../types/index.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class UserService {
  
    private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }


  async getUserById(userId: string): Promise<User | null> {
    const [rows] = await this.pool.execute(
      'SELECT id, username, email, created_at as createdAt, last_seen as lastSeen FROM users WHERE id = ?',
      [userId]
    );

    const users = rows as any[];
    return users.length > 0 ? this.mapRowToUser(users[0]) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [rows] = await this.pool.execute(
      'SELECT id, username, email, created_at as createdAt, last_seen as lastSeen FROM users WHERE username = ?',
      [username]
    );

    const users = rows as any[];
    return users.length > 0 ? this.mapRowToUser(users[0]) : null;
  }

  async createUser(username: string, email: string): Promise<User> {
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new AppError('Username already exists', 'USER_EXISTS', 409);
    }

    const userId = uuidv4();
    const now = new Date();

    await this.pool.execute(
      'INSERT INTO users (id, username, email, created_at) VALUES (?, ?, ?, ?)',
      [userId, username, email, now]
    );

    return {
      id: userId,
      username,
      email,
      createdAt: now,
    };
  }

  async updateLastSeen(userId: string): Promise<void> {
    const now = new Date();
    await this.pool.execute('UPDATE users SET last_seen = ? WHERE id = ?', [
      now,
      userId,
    ]);
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      createdAt: row.createdAt,
      lastSeen: row.lastSeen,
    };
  }
}
