import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPool, initializeDatabase } from './config/database.ts';
import { initializeFirebase } from './config/firebase.ts';
import { createChatRouter } from './routes/chatRoutes.ts';
import { createUserRouter } from './routes/userRoutes.ts';
import { errorHandler } from './middleware/errorHandler.ts';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize services
let dbPool: any;
let firestore: any;

const initializeApp = async () => {
  try {
    // connect to mysql
    dbPool = createPool();
    await initializeDatabase(dbPool);
    console.log(' Database connected');

    // Initialize Firebase
    firestore = initializeFirebase();
    console.log('firebase initialize');

    // Mount routes
    app.use('/api/user', createUserRouter(dbPool));
    app.use('/api/chat', createChatRouter(dbPool, firestore));

    // Health check
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() });
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      });
    });

    // Error handler (must be last)
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});

// Start the application
initializeApp();