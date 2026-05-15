import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { Firestore } from 'firebase-admin/firestore';
import { ChatService } from '../services/chatService.ts';
import { MessageService } from '../services/messageService.ts';
import { UserService } from '../services/userService.ts';
import type {
  CreateChatRequest,
  SendMessageRequest,
  MarkReadRequest,
  UpdateLastSeenRequest,
} from '../types/index.ts';
import { asyncHandler, AppError } from '../middleware/errorHandler.ts';

export const createChatRouter = (pool: Pool, firestore: Firestore) => {
  const router = Router();
  const chatService = new ChatService(pool);
  const messageService = new MessageService(firestore);
  const userService = new UserService(pool);

  // Create or Get Chat
  router.post(
    '/create',
    asyncHandler(async (req: Request, res: Response) => {
      const { userAId, userBId } = req.body as CreateChatRequest;

      if (!userAId || !userBId) {
        throw new AppError('userAId and userBId are required', 'MISSING_PARAMS', 400);
      }

      const userA = await userService.getUserById(userAId);
      const userB = await userService.getUserById(userBId);

      if (!userA || !userB) {
        throw new AppError('One or both users do not exist', 'USER_NOT_FOUND', 404);
      }

      const result = await chatService.createOrGetChat(userAId, userBId);

      res.status(201).json({
        data: result,
      });
    })
  );

  // Send Message
  router.post(
    '/:chatId/message/send',
    asyncHandler(async (req: Request, res: Response) => {
      const { chatId } = req.params;
      const { senderId, text } = req.body as SendMessageRequest;

      if (!senderId || !text) {
        throw new AppError('senderId and text are required', 'MISSING_PARAMS', 400);
      }

      const chat = await chatService.getChatById(chatId);
      if (!chat) {
        throw new AppError('Chat not found', 'CHAT_NOT_FOUND', 404);
      }

      const sender = await userService.getUserById(senderId);
      if (!sender) {
        throw new AppError('Sender not found', 'USER_NOT_FOUND', 404);
      }

      const messageId = await messageService.sendMessage(chatId, senderId, text);

      res.status(201).json({
        data: {
          messageId,
          timestamp: new Date(),
        },
      });
    })
  );

  // Get Messages
  router.get(
    '/:chatId/messages',
    asyncHandler(async (req: Request, res: Response) => {
      const { chatId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const lastMessageId = req.query.lastMessageId as string | undefined;

      const chat = await chatService.getChatById(chatId);
      if (!chat) {
        throw new AppError('Chat not found', 'CHAT_NOT_FOUND', 404);
      }

      const messages = await messageService.getMessages(chatId, limit, lastMessageId);

      res.status(200).json({
        data: {
          messages,
          total: messages.length,
        },
      });
    })
  );

  // Mark Message Read
  router.post(
    '/:chatId/message/:messageId/read',
    asyncHandler(async (req: Request, res: Response) => {
      const { chatId, messageId } = req.params;
      const { userId } = req.body as MarkReadRequest;

      if (!userId) {
        throw new AppError('userId is required', 'MISSING_PARAMS', 400);
      }

      const chat = await chatService.getChatById(chatId);
      if (!chat) {
        throw new AppError('Chat not found', 'CHAT_NOT_FOUND', 404);
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404);
      }

      await messageService.markMessageRead(chatId, messageId, userId);

      res.status(200).json({
        data: {
          success: true,
        },
      });
    })
  );

  // Update Last Seen Message
  router.post(
    '/:chatId/lastseen',
    asyncHandler(async (req: Request, res: Response) => {
      const { chatId } = req.params;
      const { userId, messageId } = req.body as UpdateLastSeenRequest;

      if (!userId || !messageId) {
        throw new AppError('userId and messageId are required', 'MISSING_PARAMS', 400);
      }

      const chat = await chatService.getChatById(chatId);
      if (!chat) {
        throw new AppError('Chat not found', 'CHAT_NOT_FOUND', 404);
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404);
      }

      await chatService.updateLastSeenMessage(chatId, userId, messageId);
      await userService.updateLastSeen(userId);

      res.status(200).json({
        data: {
          success: true,
        },
      });
    })
  );

  // List User Chats
  router.get(
    '/user/:userId/chats',
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.params;

      const user = await userService.getUserById(userId);
      if (!user) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404);
      }

      const chats = await chatService.getUserChats(userId);

      res.status(200).json({
        data: {
          chats,
        },
      });
    })
  );

  return router;
};
