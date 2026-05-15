// User types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  lastSeen?: Date;
}

// Chat types
export interface Chat {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ChatMember {
  chatId: string;
  userId: string;
  joinedAt: Date;
  lastSeenMessageId?: string;
}

// Message types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isDeleted: boolean;
  editedAt?: Date;
}

export interface ReadReceipt {
  id: string;
  messageId: string;
  chatId: string;
  userId: string;
  readAt: Date;
}

// API Request/Response types
export interface CreateChatRequest {
  userAId: string;
  userBId: string;
}

export interface CreateChatResponse {
  chatId: string;
  isNew: boolean;
}

export interface SendMessageRequest {
  senderId: string;
  text: string;
}

export interface SendMessageResponse {
  messageId: string;
  timestamp: Date;
}

export interface GetMessagesResponse {
  messages: Message[];
  total: number;
}

export interface MarkReadRequest {
  userId: string;
}

export interface UpdateLastSeenRequest {
  userId: string;
  messageId: string;
}

export interface ListChatsResponse {
  chats: ChatWithMember[];
}

export interface ChatWithMember extends Chat {
  otherMemberId: string;
  otherMemberUsername?: string;
  lastSeenMessageId?: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}
