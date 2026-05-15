import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { UserService } from '../services/userService.ts';
import { asyncHandler, AppError } from '../middleware/errorHandler.ts';

export const createUserRouter = (pool: Pool) => {
  const router = Router();
  const userService = new UserService(pool);

  // Create User
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const { username, email } = req.body;

      if (!username || !email) {
        throw new AppError('username and email are required', 'MISSING_PARAMS', 400);
      }

      const user = await userService.createUser(username, email);

      res.status(201).json({
        data: user,
      });
    })
  );

  // Get User
  router.get(
    '/:userId',
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.params;

      const user = await userService.getUserById(userId);
      if (!user) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404);
      }

      res.status(200).json({
        data: user,
      });
    })
  );

  // Get User by Username
  router.get(
    '/username/:username',
    asyncHandler(async (req: Request, res: Response) => {
      const { username } = req.params;

      const user = await userService.getUserByUsername(username);
      if (!user) {
        throw new AppError('User not found', 'USER_NOT_FOUND', 404);
      }

      res.status(200).json({
        data: user,
      });
    })
  );

  return router;
};
