# Design Document: Chatbot Integration

## Overview

This design describes the integration of a standalone chatbot module into an existing Inventory Management System (IMS). The integration follows a modular architecture that preserves the chatbot's functionality while adapting it to work with IMS data and infrastructure.

The chatbot module consists of:
- **Backend Services**: 11 JavaScript modules handling NLP, intent classification, entity extraction, database operations, and email functionality
- **Frontend Component**: A React component with voice input/output capabilities
- **Integration Layer**: Adapters and configuration to connect chatbot services with IMS data

The design prioritizes:
1. **Non-invasive integration**: Minimal changes to existing IMS code
2. **Modularity**: Chatbot components isolated in dedicated directories
3. **Backward compatibility**: All existing IMS functionality preserved
4. **Extensibility**: Easy to add new chatbot intents and capabilities

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    IMS Frontend (React + Vite)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Existing IMS Components (Dashboard, Products, etc.) │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ChatbotWithVoice Component (NEW)                    │   │
│  │  - Voice Input/Output                                │   │
│  │  - Message Display                                   │   │
│  │  - API Communication                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              IMS Backend (Express + Supabase)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Existing IMS Routes                                 │   │
│  │  /api/v1/products, /api/v1/suppliers, etc.          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Chatbot Routes (NEW)                                │   │
│  │  /api/v1/chatbot                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Chatbot Services (NEW)                              │   │
│  │  - Intent Classifier                                 │   │
│  │  - Entity Extractor                                  │   │
│  │  - Reply Builder                                     │   │
│  │  - Casual Responder                                  │   │
│  │  - Email Service                                     │   │
│  │  - Database Adapter (connects to IMS data)          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase (PostgreSQL)                      │
│  - products table                                           │
│  - suppliers table                                          │
│  - customers table                                          │
│  - sales table                                              │
│  - purchases table                                          │
│  - alerts table                                             │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

**Backend Structure:**
```
Inventory-Managment-System-/backend/
├── src/
│   ├── chatbot/                    (NEW)
│   │   ├── services/
│   │   │   ├── chatbot.js          (Main orchestrator)
│   │   │   ├── intentDetector.js   (Intent classification)
│   │   │   ├── llmClassifier.js    (LLM-based classification)
│   │   │   ├── entityExtractor.js  (Entity extraction)
│   │   │   ├── replyBuilder.js     (Response generation)
│   │   │   ├── casualResponder.js  (Casual conversation)
│   │   │   ├── normalize.js        (Text normalization)
│   │   │   └── emailService.js     (Email functionality)
│   │   ├── adapters/
│   │   │   ├── databaseAdapter.js  (IMS database queries)
│   │   │   └── supabaseClient.js   (Supabase connection)
│   │   ├── controllers/
│   │   │   └── chatbotController.js (Request handlers)
│   │   └── routes/
│   │       └── chatbotRoutes.js    (API routes)
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── app.js                      (MODIFIED: add chatbot routes)
├── server.js
└── package.json                    (MODIFIED: add dependencies)
```

**Frontend Structure:**
```
Inventory-Managment-System-/frontend/
├── src/
│   ├── components/
│   │   ├── chatbot/                (NEW)
│   │   │   ├── ChatbotWithVoice.jsx
│   │   │   ├── ChatbotButton.jsx   (Trigger button)
│   │   │   └── chatbot.css         (Styles)
│   │   └── ... (existing components)
│   ├── pages/
│   ├── services/
│   │   └── chatbotService.js       (NEW: API calls)
│   └── App.jsx                     (MODIFIED: add chatbot)
└── package.json                    (MODIFIED: add dependencies)
```

## Components and Interfaces

### Backend Components

#### 1. Chatbot Controller (`chatbotController.js`)

**Purpose**: Handle HTTP requests for chatbot interactions

**Interface**:
```javascript
// POST /api/v1/chatbot/message
async function handleMessage(req, res) {
  Input: {
    message: string,      // User's message
    userId: string,       // Optional: user ID for context
    sessionId: string     // Optional: conversation session
  }
  Output: {
    success: boolean,
    reply: string,        // Chatbot's response
    intent: string,       // Detected intent
    data: object          // Optional: structured data (products, etc.)
  }
}

// GET /api/v1/chatbot/health
async function healthCheck(req, res) {
  Output: {
    success: boolean,
    message: string,
    services: {
      intentDetector: boolean,
      database: boolean,
      email: boolean
    }
  }
}
```

#### 2. Intent Detector (`intentDetector.js`)

**Purpose**: Classify user messages into actionable intents

**Interface**:
```javascript
async function detectIntent(message) {
  Input: message (string)
  Output: {
    intent: string,       // e.g., "product_lookup", "stock_check", "supplier_contact"
    confidence: number,   // 0.0 to 1.0
    entities: object      // Extracted entities
  }
}
```

**Supported Intents**:
- `product_lookup`: User wants product information
- `stock_check`: User wants inventory levels
- `supplier_inquiry`: User wants supplier details
- `supplier_contact`: User wants to email a supplier
- `low_stock_alert`: User wants low stock items
- `sales_inquiry`: User wants sales data
- `casual`: General conversation
- `unknown`: Cannot determine intent

#### 3. Entity Extractor (`entityExtractor.js`)

**Purpose**: Extract structured data from user messages

**Interface**:
```javascript
function extractEntities(message, intent) {
  Input: 
    - message (string)
    - intent (string)
  Output: {
    productName: string,      // Optional
    supplierName: string,     // Optional
    quantity: number,         // Optional
    category: string,         // Optional
    emailSubject: string,     // Optional
    emailBody: string         // Optional
  }
}
```

**Extraction Patterns**:
- Product names: Capitalized words, quoted strings
- Quantities: Numbers followed by units
- Supplier names: Proper nouns, company names
- Email content: Text after "tell them" or "message"

#### 4. Database Adapter (`databaseAdapter.js`)

**Purpose**: Query IMS database for chatbot responses

**Interface**:
```javascript
async function queryProducts(filters) {
  Input: {
    name: string,         // Optional: product name pattern
    category: string,     // Optional: category filter
    lowStock: boolean     // Optional: only low stock items
  }
  Output: Array<{
    id: string,
    name: string,
    category: string,
    quantity: number,
    price: number,
    supplier_id: string
  }>
}

async function querySuppliers(filters) {
  Input: {
    name: string,         // Optional: supplier name pattern
    id: string            // Optional: specific supplier ID
  }
  Output: Array<{
    id: string,
    name: string,
    email: string,
    phone: string,
    address: string
  }>
}

async function getStockLevels(productId) {
  Input: productId (string)
  Output: {
    productId: string,
    productName: string,
    currentStock: number,
    reorderLevel: number,
    status: string        // "adequate", "low", "critical"
  }
}

async function getLowStockItems() {
  Input: none
  Output: Array<{
    id: string,
    name: string,
    quantity: number,
    reorderLevel: number,
    supplier: string
  }>
}
```

#### 5. Reply Builder (`replyBuilder.js`)

**Purpose**: Generate natural language responses from structured data

**Interface**:
```javascript
function buildReply(intent, data, entities) {
  Input:
    - intent (string)
    - data (object): Query results
    - entities (object): Extracted entities
  Output: string (natural language response)
}
```

**Response Templates**:
- Product lookup: "I found {count} products matching '{name}': {list}"
- Stock check: "{product} has {quantity} units in stock. {status}"
- Supplier info: "{supplier} can be reached at {email} or {phone}"
- Low stock: "You have {count} items below reorder level: {list}"
- Error: "I couldn't find any {entity}. Could you be more specific?"

#### 6. Email Service (`emailService.js`)

**Purpose**: Send emails to suppliers via SMTP

**Interface**:
```javascript
async function sendSupplierEmail(supplierEmail, subject, body, fromUser) {
  Input: {
    supplierEmail: string,
    subject: string,
    body: string,
    fromUser: string      // User's name/email
  }
  Output: {
    success: boolean,
    messageId: string,    // If successful
    error: string         // If failed
  }
}
```

#### 7. Casual Responder (`casualResponder.js`)

**Purpose**: Handle non-inventory conversations

**Interface**:
```javascript
function getCasualResponse(message) {
  Input: message (string)
  Output: string (friendly response)
}
```

**Patterns**:
- Greetings: "hello", "hi", "hey" → "Hello! How can I help with inventory today?"
- Thanks: "thank you", "thanks" → "You're welcome! Anything else?"
- Help: "help", "what can you do" → Lists capabilities
- Goodbye: "bye", "goodbye" → "Goodbye! Let me know if you need anything."

### Frontend Components

#### 1. ChatbotWithVoice Component

**Purpose**: Main chatbot UI with voice capabilities

**Props**:
```javascript
{
  apiEndpoint: string,      // Backend API URL
  userId: string,           // Optional: current user ID
  theme: object,            // Optional: custom styling
  enableVoice: boolean      // Default: true
}
```

**State**:
```javascript
{
  messages: Array<{
    id: string,
    text: string,
    sender: "user" | "bot",
    timestamp: Date
  }>,
  isListening: boolean,     // Voice input active
  isSpeaking: boolean,      // Voice output active
  isTyping: boolean,        // Bot is processing
  isOpen: boolean           // Chatbot visible
}
```

**Methods**:
```javascript
async sendMessage(text)     // Send text message to backend
startVoiceInput()           // Activate speech recognition
stopVoiceInput()            // Deactivate speech recognition
speakResponse(text)         // Text-to-speech output
toggleChatbot()             // Open/close chatbot
```

#### 2. ChatbotButton Component

**Purpose**: Floating button to open chatbot

**Props**:
```javascript
{
  onClick: function,        // Open chatbot handler
  position: string,         // "bottom-right", "bottom-left"
  unreadCount: number       // Optional: notification badge
}
```

#### 3. Chatbot Service (`chatbotService.js`)

**Purpose**: API communication layer

**Interface**:
```javascript
async function sendMessage(message, userId, sessionId) {
  Input: {
    message: string,
    userId: string,
    sessionId: string
  }
  Output: {
    reply: string,
    intent: string,
    data: object
  }
}

async function checkHealth() {
  Output: {
    available: boolean,
    services: object
  }
}
```

## Data Models

### Message Model

```javascript
{
  id: string,               // Unique message ID
  sessionId: string,        // Conversation session
  userId: string,           // User who sent message
  text: string,             // Message content
  sender: "user" | "bot",   // Message source
  timestamp: Date,          // When sent
  intent: string,           // Detected intent (bot messages)
  entities: object,         // Extracted entities (bot messages)
  metadata: object          // Additional data
}
```

### Intent Model

```javascript
{
  name: string,             // Intent identifier
  confidence: number,       // Classification confidence (0-1)
  entities: object,         // Extracted entities
  requiredEntities: Array<string>, // Entities needed for this intent
  handler: function         // Function to handle this intent
}
```

### Query Result Model

```javascript
{
  success: boolean,
  data: Array<object>,      // Query results
  count: number,            // Number of results
  query: object,            // Original query parameters
  executionTime: number     // Query duration (ms)
}
```

### Email Request Model

```javascript
{
  to: string,               // Recipient email
  from: string,             // Sender email
  subject: string,          // Email subject
  body: string,             // Email body (plain text)
  html: string,             // Optional: HTML body
  userId: string,           // User requesting email
  timestamp: Date           // When requested
}
```

## Integration Points

### 1. Backend Integration

**File**: `Inventory-Managment-System-/backend/src/app.js`

**Changes**:
```javascript
// Add chatbot routes
const chatbotRoutes = require('./chatbot/routes/chatbotRoutes');
app.use('/api/v1/chatbot', chatbotRoutes);
```

### 2. Frontend Integration

**File**: `Inventory-Managment-System-/frontend/src/App.jsx`

**Changes**:
```javascript
import ChatbotWithVoice from './components/chatbot/ChatbotWithVoice';
import ChatbotButton from './components/chatbot/ChatbotButton';

function App() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  
  return (
    <div>
      {/* Existing IMS components */}
      
      {/* Chatbot integration */}
      <ChatbotButton 
        onClick={() => setChatbotOpen(true)}
        position="bottom-right"
      />
      {chatbotOpen && (
        <ChatbotWithVoice
          apiEndpoint={`${API_BASE_URL}/api/v1/chatbot`}
          userId={currentUser?.id}
          onClose={() => setChatbotOpen(false)}
        />
      )}
    </div>
  );
}
```

### 3. Dependency Merging

**Backend Dependencies to Add**:
```json
{
  "axios": "^1.13.4",      // Already in IMS (same version)
  "nodemailer": "^8.0.0",  // Already in IMS (higher version - keep)
  "pg": "^8.18.0"          // NEW - add to IMS
}
```

**Frontend Dependencies to Add**:
```json
{
  "gsap": "^3.14.2"        // NEW - for animations
}
```

**No Conflicts**: Both systems use compatible versions of shared dependencies.

### 4. Environment Variables

**Add to** `Inventory-Managment-System-/backend/.env`:
```
# Chatbot Configuration
CHATBOT_ENABLED=true
CHATBOT_LLM_API_KEY=your_llm_api_key_here
CHATBOT_LLM_ENDPOINT=https://api.openai.com/v1/chat/completions

# Email Configuration (may already exist)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=inventory@yourcompany.com

# Supabase (already exists - reuse)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 5. Database Schema

**No Schema Changes Required**: Chatbot uses existing IMS tables (products, suppliers, customers, etc.) in read-only mode for queries. No new tables needed.

**Optional Enhancement**: Add a `chatbot_sessions` table to store conversation history:
```sql
CREATE TABLE chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Backend Error Handling

**Error Categories**:

1. **Intent Detection Errors**
   - Cause: LLM API unavailable, malformed input
   - Handling: Fall back to rule-based classification
   - Response: "I'm having trouble understanding. Could you rephrase?"

2. **Database Query Errors**
   - Cause: Connection failure, invalid query
   - Handling: Log error, return user-friendly message
   - Response: "I couldn't access the inventory data right now. Please try again."

3. **Email Service Errors**
   - Cause: SMTP failure, invalid recipient
   - Handling: Log error, inform user
   - Response: "I couldn't send that email. Please check the supplier's email address."

4. **Voice Recognition Errors**
   - Cause: Browser incompatibility, permission denied
   - Handling: Gracefully degrade to text-only mode
   - Response: Display message "Voice input unavailable. Please type your message."

**Error Response Format**:
```javascript
{
  success: false,
  error: {
    code: string,         // e.g., "INTENT_DETECTION_FAILED"
    message: string,      // User-friendly message
    details: string,      // Technical details (logged, not shown to user)
    timestamp: Date
  }
}
```

### Frontend Error Handling

**Error Scenarios**:

1. **API Connection Failure**
   - Display: "Cannot connect to chatbot service. Please check your connection."
   - Action: Retry button, fallback to offline mode

2. **Voice Permission Denied**
   - Display: "Microphone access denied. Using text mode."
   - Action: Hide voice button, show text input

3. **Message Send Failure**
   - Display: "Message not sent. Retry?"
   - Action: Retry button, keep message in input field

**Error UI Component**:
```javascript
<ErrorBoundary fallback={<ChatbotError />}>
  <ChatbotWithVoice />
</ErrorBoundary>
```

## Testing Strategy

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage of the chatbot integration.

### Unit Testing

**Backend Unit Tests**:
- Test each chatbot service module independently
- Mock database connections and external APIs
- Verify error handling for edge cases
- Test specific intent detection examples
- Test entity extraction patterns
- Test email formatting and validation

**Frontend Unit Tests**:
- Test ChatbotWithVoice component rendering
- Test message sending and receiving
- Test voice activation/deactivation
- Test UI state transitions
- Test error display components

**Integration Tests**:
- Test complete message flow (frontend → backend → database → response)
- Test chatbot API endpoints with real database queries
- Test email sending with test SMTP server
- Test voice functionality in browser environment

### Property-Based Testing

Property-based tests will verify universal properties across many generated inputs using a JavaScript PBT library (fast-check). Each test will run a minimum of 100 iterations with randomized inputs.

**Test Configuration**:
- Library: fast-check (for JavaScript/TypeScript)
- Iterations: 100 minimum per property
- Tagging: Each test tagged with feature name and property number


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Redundancy Analysis**:
- Properties 5.2, 5.3, 5.4 (querying different tables) can be combined into one property about database query correctness
- Properties 10.2, 10.3, 10.4, 10.5 (handling different intents) can be combined into one property about intent routing
- Properties 11.2, 11.3 (testing different query types) can be combined into one property about query result correctness
- Properties 12.1, 12.2, 12.4 (backward compatibility) can be combined into one comprehensive property

This reflection ensures each property provides unique validation value without logical redundancy.

### Properties

**Property 1: Module Import Resolution**
*For any* chatbot module file, all import statements should resolve to valid module paths without throwing module-not-found errors.
**Validates: Requirements 1.3, 2.3**

**Property 2: Dependency Version Selection**
*For any* dependency that exists in both chatbot and IMS package.json files, the merged package.json should contain the higher version number.
**Validates: Requirements 3.2**

**Property 3: API Request Routing**
*For any* valid chatbot API request, the request should be routed to the correct chatbot controller handler without 404 errors.
**Validates: Requirements 4.2**

**Property 4: Route Uniqueness**
*For any* chatbot route path, it should not conflict with any existing IMS route path (no duplicate routes).
**Validates: Requirements 4.3**

**Property 5: Response Format Consistency**
*For any* chatbot API response (success or error), the response should conform to the standard JSON format with required fields (success, reply/error, timestamp).
**Validates: Requirements 4.4**

**Property 6: Error Status Codes**
*For any* error condition in chatbot processing, the HTTP response should have an appropriate error status code (4xx for client errors, 5xx for server errors) and include an error message.
**Validates: Requirements 4.5**

**Property 7: Database Query Correctness**
*For any* inventory-related query (products, suppliers, stock levels), the chatbot should query the correct IMS database table and return data matching the query parameters.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 8: Database Error Handling**
*For any* database error (connection failure, query error), the chatbot response should contain a user-friendly error message rather than exposing raw database errors.
**Validates: Requirements 5.6**

**Property 9: Environment Variable Error Messages**
*For any* missing required environment variable, the backend startup error message should clearly identify which specific variable is missing.
**Validates: Requirements 6.5**

**Property 10: Voice Input Transcription**
*For any* speech input captured by the voice interface, the transcribed text should be sent to the chatbot API as a message.
**Validates: Requirements 8.2**

**Property 11: Voice Output Synthesis**
*For any* chatbot text response when voice is enabled, the text should be synthesized to speech output.
**Validates: Requirements 8.3**

**Property 12: Voice State Visual Feedback**
*For any* voice state change (listening, speaking, idle), the UI should display corresponding visual feedback indicators.
**Validates: Requirements 8.5**

**Property 13: Supplier Entity Extraction**
*For any* user message requesting supplier contact, the entity extractor should identify and extract the supplier name and message content.
**Validates: Requirements 9.1, 9.2**

**Property 14: Email Success Confirmation**
*For any* successful email send operation, the chatbot response should include confirmation text indicating the email was sent.
**Validates: Requirements 9.4**

**Property 15: Email Failure Notification**
*For any* failed email send operation, the chatbot response should inform the user of the failure and the error should be logged.
**Validates: Requirements 9.5**

**Property 16: Intent Classification**
*For any* user message, the intent classifier should return a valid intent from the supported intent list (product_lookup, stock_check, supplier_inquiry, supplier_contact, low_stock_alert, sales_inquiry, casual, unknown).
**Validates: Requirements 10.1**

**Property 17: Intent-Based Routing**
*For any* classified intent, the chatbot should route the request to the appropriate handler (database query for inventory intents, casual responder for casual intents, clarification for unknown intents).
**Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**

**Property 18: Query Result Accuracy**
*For any* inventory query (products or suppliers), the chatbot response data should match the actual database records for the given query parameters.
**Validates: Requirements 11.2, 11.3**

**Property 19: Error Condition Handling**
*For any* error condition (invalid input, database failure, service unavailable), the chatbot should return an appropriate error response without crashing.
**Validates: Requirements 11.4**

**Property 20: Backward Compatibility**
*For any* existing IMS API endpoint or feature, the behavior and response format should remain unchanged after chatbot integration.
**Validates: Requirements 12.1, 12.2, 12.4**

**Property 21: Frontend Component Integrity**
*For any* existing IMS frontend page or component, it should render correctly without errors after chatbot integration.
**Validates: Requirements 12.3**

**Property 22: Fault Isolation**
*For any* chatbot module failure or error, all non-chatbot IMS features should continue to function normally.
**Validates: Requirements 12.5**
