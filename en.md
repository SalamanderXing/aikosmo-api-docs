# Chatbot API Documentation

API_DOMAIN=`aikosmo-server-production.up.railway.app`

## Endpoints

### 1. Initialize Chat Session

- **URL:** `https://${API_URL}/new_chat`
- **Method:** `POST`

- **Headers:**
  - `X-API-Key`: `API_KEY`

- **Query Parameters:**
  - `language`: Language code (e.g., `"en"`)
  - `chatbot_slug`: Identifier for the specific chatbot (optional)

- **Response:**
```json
  {
    "message": "Intro message",
    "suggested_questions": ["Question 1", "Question 2"],
    "token": "session_token"
  }
```

## 2. Get Intro Message

- **URL:** `https://${API_URL}/intro_message`
- **Method:** `POST`

- **Headers:**
  - `X-API-Key`: `API_KEY`

- **Query Parameters:**
  - `language`: Language code (e.g., `"en"`)
  - `chatbot_slug`: Identifier for the specific chatbot
  - `token`: Existing session token (optional)

- **Response:**
```json
  {
    "message": "Intro message",
    "suggested_questions": ["Question 1", "Question 2"],
    "history": [
      {"role": "user", "content": "Message"},
      {"role": "assistant", "content": "Response"}
    ],
    "token": "session_token"
  }
```

## 3. WebSocket Connection

- **URL:** `wss://${API_URL}/ws/${token}/${language}?chatbot_slug=${CHATBOT_SLUG}`

- **Headers:**
  - `X-API-Key`: `API_KEY`

### WebSocket Communication

#### Sending Messages

Send user messages directly through the WebSocket connection.

#### Receiving Messages

The WebSocket connection receives various types of messages:

1. **Regular Messages:** Text responses from the chatbot.
2. **Control Messages:**
   - `<\|keep_alive\|>`: Keep-alive signal.
   - `<\|on_checking\|>`: Chatbot is checking availability.
   - `<\|on_done_checking\|>`: Chatbot finished checking availability.
   - `<\|reset\|>`: Chatbot is resetting the last message to rewrite it.
   - `<\|on_streaming_done\|>`: Chatbot finished streaming the current message.
2. **Control Messages:**
   - <&#124;keep_alive&#124;>: Keep-alive signal.
   - `<&#124;on_checking&#124;>`: Chatbot is checking availability.
   - `<&#124;on_done_checking&#124;>`: Chatbot finished checking availability.
   - `<&#124;reset&#124;>`: Chatbot is resetting the last message to rewrite it.
   - `<&#124;on_streaming_done&#124;>`: Chatbot finished streaming the current message.

### Usage Flow

1. Initialize a chat session using the `/new_chat` endpoint or get intro message using `/intro_message`.
2. Establish a WebSocket connection using the received token.
3. Send user messages through the WebSocket.
4. Receive and process chatbot responses and control messages.
5. Handle special control messages for specific chatbot actions.


