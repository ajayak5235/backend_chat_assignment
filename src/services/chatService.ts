import type { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, ChatMember, ChatWithMember } from '../types/index.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class ChatService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createOrGetChat(userAId: string, userBId: string): Promise<{ chatId: string; isNew: boolean }> {
    if (userAId === userBId) {
      throw new AppError('Cannot create chat with yourself', 'INVALID_USERS', 400);
    }

    const normalizedUserA = userAId < userBId ? userAId : userBId;
    const normalizedUserB = userAId < userBId ? userBId : userAId;

    // Try to find existing chat
    const [existingRows] = await this.pool.execute(
      'SELECT id FROM chats WHERE user_a_id = ? AND user_b_id = ? AND is_active = TRUE',
      [normalizedUserA, normalizedUserB]
    );

    const existingChats = existingRows as any[];
    if (existingChats.length > 0) {
      return { chatId: existingChats[0].id, isNew: false };
    }

    // Create new chat
    const chatId = uuidv4();
    const now = new Date();

    try {
      await this.pool.execute(
        'INSERT INTO chats (id, user_a_id, user_b_id, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
        [chatId, normalizedUserA, normalizedUserB, now, now]
      );

      // Add both users to chat_members
      await this.pool.execute(
        'INSERT INTO chat_members (chat_id, user_id, joined_at) VALUES (?, ?, ?), (?, ?, ?)',
        [chatId, normalizedUserA, now, chatId, normalizedUserB, now]
      );

      return { chatId, isNew: true };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        const [rows] = await this.pool.execute(
          'SELECT id FROM chats WHERE user_a_id = ? AND user_b_id = ? AND is_active = TRUE',
          [normalizedUserA, normalizedUserB]
        );
        const chats = rows as any[];
        return { chatId: chats[0].id, isNew: false };
      }
      throw error;
    }
  }

  async getChatById(chatId: string): Promise<Chat | null> {
    const [rows] = await this.pool.execute(
      'SELECT id, user_a_id as userAId, user_b_id as userBId, created_at as createdAt, updated_at as updatedAt, is_active as isActive FROM chats WHERE id = ?',
      [chatId]
    );

    const chats = rows as any[];
    return chats.length > 0 ? this.mapRowToChat(chats[0]) : null;
  }

  async getUserChats(userId: string): Promise<ChatWithMember[]> {
    const [rows] = await this.pool.execute(
      `SELECT 
        c.id,
        c.user_a_id as userAId,
        c.user_b_id as userBId,
        c.created_at as createdAt,
        c.updated_at as updatedAt,
        c.is_active as isActive,
        cm.last_seen_message_id as lastSeenMessageId,
        CASE 
          WHEN c.user_a_id = ? THEN c.user_b_id
          ELSE c.user_a_id
        END as otherMemberId
      FROM chats c
      LEFT JOIN chat_members cm ON c.id = cm.chat_id AND cm.user_id = ?
      WHERE (c.user_a_id = ? OR c.user_b_id = ?) AND c.is_active = TRUE
      ORDER BY c.updated_at DESC`,
      [userId, userId, userId, userId]
    );

    const chats = rows as any[];
    return chats.map((row) => ({
      id: row.id,
      userAId: row.userAId,
      userBId: row.userBId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isActive: row.isActive,
      otherMemberId: row.otherMemberId,
      lastSeenMessageId: row.lastSeenMessageId,
    }));
  }

  async updateLastSeenMessage(chatId: string, userId: string, messageId: string): Promise<void> {
    await this.pool.execute(
      'UPDATE chat_members SET last_seen_message_id = ? WHERE chat_id = ? AND user_id = ?',
      [messageId, chatId, userId]
    );
  }

  async getChatMembers(chatId: string): Promise<ChatMember[]> {
    const [rows] = await this.pool.execute(
      'SELECT chat_id as chatId, user_id as userId, joined_at as joinedAt, last_seen_message_id as lastSeenMessageId FROM chat_members WHERE chat_id = ?',
      [chatId]
    );

    const members = rows as any[];
    return members.map((row) => ({
      chatId: row.chatId,
      userId: row.userId,
      joinedAt: row.joinedAt,
      lastSeenMessageId: row.lastSeenMessageId,
    }));
  }

  private mapRowToChat(row: any): Chat {
    return {
      id: row.id,
      userAId: row.userAId,
      userBId: row.userBId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isActive: row.isActive,
    };
  }
}
