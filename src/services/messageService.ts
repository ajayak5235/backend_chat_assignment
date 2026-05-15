import { Firestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { Message, ReadReceipt } from '../types/index.ts';
import { AppError } from '../middleware/errorHandler.ts';

export class MessageService {
  private firestore: Firestore;
  
    constructor(Firestore: Firestore) {
      this.firestore = Firestore;
    }

  async sendMessage(chatId: string, senderId: string, text: string): Promise<string> {
    if (!text.trim()) {
      throw new AppError('Message text cannot be empty', 'EMPTY_MESSAGE', 400);
    }

    const messageId = uuidv4();
    const timestamp = new Date();

    const message: Message = {
      id: messageId,
      chatId,
      senderId,
      text,
      timestamp,
      isDeleted: false,
    };

    try {
      await this.firestore.collection('chats').doc(chatId).collection('messages').doc(messageId).set(message);
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new AppError('Failed to send message', 'MESSAGE_SEND_ERROR', 500);
    }
  }

  async getMessages(
    chatId: string,
    limit: number = 50,
    lastMessageId?: string
  ): Promise<Message[]> {
    if (limit > 100) limit = 100;
    if (limit < 1) limit = 1;

    try {
      let query = this.firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .where('isDeleted', '==', false)
        .orderBy('timestamp', 'desc')
        .limit(limit);

      if (lastMessageId) {
        const lastDoc = await this.firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .doc(lastMessageId)
          .get();

        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      const messages = snapshot.docs.map((doc) => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
        editedAt: doc.data().editedAt?.toDate(),
      } as Message));

      return messages.reverse(); // Return in ascending order
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new AppError('Failed to fetch messages', 'MESSAGE_FETCH_ERROR', 500);
    }
  }

  async markMessageRead(chatId: string, messageId: string, userId: string): Promise<void> {
    try {
      const receiptId = uuidv4();
      const readAt = new Date();

      const receipt: ReadReceipt = {
        id: receiptId,
        messageId,
        chatId,
        userId,
        readAt,
      };

      await this.firestore.collection('chats').doc(chatId).collection('read_receipts').doc(`${messageId}_${userId}`).set(receipt);
    } catch (error) {
      console.error('Error marking message read:', error);
      throw new AppError('Failed to mark message as read', 'READ_RECEIPT_ERROR', 500);
    }
  }

  async getReadReceipts(chatId: string, messageId: string): Promise<ReadReceipt[]> {
    try {
      const snapshot = await this.firestore
        .collection('chats')
        .doc(chatId)
        .collection('read_receipts')
        .where('messageId', '==', messageId)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        readAt: doc.data().readAt.toDate(),
      } as ReadReceipt));
    } catch (error) {
      console.error('Error fetching read receipts:', error);
      throw new AppError('Failed to fetch read receipts', 'READ_RECEIPT_FETCH_ERROR', 500);
    }
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    try {
      await this.firestore.collection('chats').doc(chatId).collection('messages').doc(messageId).update({
        isDeleted: true,
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new AppError('Failed to delete message', 'MESSAGE_DELETE_ERROR', 500);
    }
  }

  async editMessage(chatId: string, messageId: string, newText: string): Promise<void> {
    if (!newText.trim()) {
      throw new AppError('Message text cannot be empty', 'EMPTY_MESSAGE', 400);
    }

    try {
      await this.firestore.collection('chats').doc(chatId).collection('messages').doc(messageId).update({
        text: newText,
        editedAt: new Date(),
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw new AppError('Failed to edit message', 'MESSAGE_EDIT_ERROR', 500);
    }
  }
}
