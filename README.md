# backend_chat_assignment


## ENV Example
HOST=localhost
USER=root
PASSWORD=database_password
DATABASE=chat_db
PORT_DB=3306

FIREBASE_PROJECT_ID= projectId
FIREBASE_PRIVATE_KEY= privateKey
FIREBASE_CLIENT_EMAIL= clientEmail
FIREBASE_DATABASE_URL=databaseURL

PORT=3000
NODE_ENV=development

## Health Check
http://localhost:3000/health
///////////////////////////////////

### Create User
 POST http://localhost:3000/api/user 
 {
    "username": "ajay",
    "email": "ajay@example.com"
  }
////////////////////////////////////////////////

### Get User by ID

 http://localhost:3000/api/user/userId

# Get User by Username
 http://localhost:3000/api/user/username/ajay

///////////////////////////////////////////////////////

## Chat Management

### Create or Get Chat
 POST http://localhost:3000/api/chat/create 
{
    "userAId": "userId1",
    "userBId": "userId2"
}

//////////////////////////////////////

# Send Message
 POST http://localhost:3000/api/chat/chatId/message/send 
{
    "senderId": "userId",
    "text": "Hello!"
  }

# Get Messages (with limit)
http://localhost:3000/api/chat/chatId/messages?limit=50


### Get Messages (with pagination)
http://localhost:3000/api/chat/chatId/messages?limit=50&lastMessageId=messageId

/////////////////////////////////////////////////////////////////////////////////

### Mark Message Read

 POST http://localhost:3000/api/chat/chatId/message/messageId/read
{
    "userId": "userId"
  }

### Update Last Seen Message
 POST http://localhost:3000/api/chat/chatId/lastseen
  '{
    "userId": "userId",
    "messageId": "messageId"
  }
/////////////////////////////////////////////////////////

### List User Chats
 http://localhost:3000/api/chat/user/userId/chats
 
/////////////////////////////////////////////////////////

### Example Error Response
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
