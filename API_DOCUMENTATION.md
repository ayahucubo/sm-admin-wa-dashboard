# RESTful API Documentation

This document describes the RESTful API endpoints available for managing feedback data with API key authentication.

## Authentication

The API supports two authentication methods:

### 1. Admin Token Authentication (Existing)
For dashboard users and internal applications:
```http
Authorization: Bearer <admin-jwt-token>
```

### 2. API Key Authentication (New)
For external applications and integrations:

**Option 1: X-API-Key Header (Recommended)**
```http
X-API-Key: <your-api-key>
```

**Option 2: Bearer Token**
```http
Authorization: Bearer <your-api-key>
```

## Available API Keys

### Development Environment
- `smm-api-key-admin-2024` - Full access (read/write/delete)
- `smm-api-key-readonly-2024` - Read-only access

### Production Environment
- Configure with your own API keys in `.env` file
- Set `VALID_API_KEYS=key1,key2,key3`

## API Endpoints

### 1. Feedback Tracker API

**Base URL:** `/api/v1/feedback/tracker`

#### GET - List Feedback Trackers
```http
GET /api/v1/feedback/tracker
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (max: 100, default: 20)
- `userId` (string): Filter by user ID
- `chatOrigin` (string): Filter by chat origin
- `feedbackSent` (boolean): Filter by feedback sent status
- `startDate` (string): Filter by start date (YYYY-MM-DD)
- `endDate` (string): Filter by end date (YYYY-MM-DD)
- `sortBy` (string): Sort field (default: last_chat_timestamp)
- `sortOrder` (string): Sort direction (asc/desc, default: desc)

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user123",
      "lastChatTimestamp": "2024-02-05T10:30:00Z",
      "feedbackSent": true,
      "feedbackRating": 5,
      "feedbackReason": "Very helpful",
      "chatOrigin": "whatsapp",
      "xid": "xa-123",
      "channelId": "channel-456",
      "accountId": "acc-789",
      "lastFeedbackTime": "2024-02-05T10:35:00Z",
      "createdAt": "2024-02-05T10:30:00Z",
      "updatedAt": "2024-02-05T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "filters": {
    "userId": "user123"
  }
}
```

#### POST - Create/Update Feedback Tracker
```http
POST /api/v1/feedback/tracker
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user123",
  "chatOrigin": "whatsapp",
  "lastChatTimestamp": "2024-02-05T10:30:00Z",
  "feedbackSent": true,
  "feedbackRating": 5,
  "feedbackReason": "Very helpful",
  "xid": "xa-123",
  "channelId": "channel-456",
  "accountId": "acc-789",
  "lastFeedbackTime": "2024-02-05T10:35:00Z"
}
```

#### PUT - Update Existing Tracker
```http
PUT /api/v1/feedback/tracker
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user123",
  "chatOrigin": "whatsapp",
  "feedbackSent": true,
  "feedbackRating": 4
}
```

#### DELETE - Delete Tracker Record (Admin/API Key with delete permission)
```http
DELETE /api/v1/feedback/tracker?userId=user123&chatOrigin=whatsapp
```

### 2. Feedback History API

**Base URL:** `/api/v1/feedback/history`

#### GET - List Feedback History
```http
GET /api/v1/feedback/history
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (max: 100, default: 20)
- `userId` (string): Filter by user ID
- `chatOrigin` (string): Filter by chat origin
- `rating` (integer): Filter by rating (1-5)
- `companyCode` (string): Filter by company code
- `startDate` (string): Filter by start date (YYYY-MM-DD)
- `endDate` (string): Filter by end date (YYYY-MM-DD)
- `sortBy` (string): Sort field (default: feedback_date)
- `sortOrder` (string): Sort direction (asc/desc, default: desc)
- `includeSummary` (boolean): Include rating statistics summary

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "user123",
      "feedbackRating": 5,
      "feedbackReason": "Very helpful response",
      "chatOrigin": "whatsapp",
      "chatName": "HR Assistant Chat",
      "companyCode": "SMM001",
      "employeeNumber": "EMP123",
      "feedbackDate": "2024-02-05",
      "xid": "xa-123",
      "channelId": "channel-456",
      "accountId": "acc-789",
      "createdAt": "2024-02-05T10:30:00Z",
      "updatedAt": "2024-02-05T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  },
  "summary": {
    "totalFeedback": 500,
    "averageRating": 4.2,
    "ratingDistribution": {
      "rating1": 10,
      "rating2": 25,
      "rating3": 80,
      "rating4": 200,
      "rating5": 185
    }
  }
}
```

#### POST - Create Feedback History
```http
POST /api/v1/feedback/history
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user123",
  "feedbackRating": 5,
  "feedbackReason": "Very helpful response",
  "chatOrigin": "whatsapp",
  "chatName": "HR Assistant Chat",
  "companyCode": "SMM001",
  "employeeNumber": "EMP123",
  "feedbackDate": "2024-02-05",
  "xid": "xa-123",
  "channelId": "channel-456",
  "accountId": "acc-789"
}
```

#### PUT - Update Feedback History
```http
PUT /api/v1/feedback/history
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": 1,
  "feedbackRating": 4,
  "feedbackReason": "Updated feedback reason"
}
```

#### DELETE - Delete History Record (Admin/API Key with delete permission)
```http
DELETE /api/v1/feedback/history?id=1
```

### 3. Chat History API (New)

The new chat history API provides advanced features for managing and analyzing chat data with external API integration.

**Base URL:** `/api/v1/chat`

#### GET - Comprehensive Chat History
```http
GET /api/v1/chat
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (max: 200, default: 50)
- `menu` (string): Filter by menu (comma-separated for multiple)
- `contact` (string): Filter by contact name or phone number
- `startDate` (string): Filter by start date (YYYY-MM-DD)
- `endDate` (string): Filter by end date (YYYY-MM-DD)
- `search` (string): Search in chat content, responses, menus, etc.
- `sortBy` (string): Sort field (timestamp, currentMenu, contact, workflowName)
- `sortOrder` (string): Sort direction (asc/desc, default: desc)
- `includeStatistics` (boolean): Include chat statistics summary

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "executionId": "exec-123",
      "startedAt": "2024-02-05T10:30:00Z",
      "chat": "Bagaimana cara mengajukan cuti?",
      "chatResponse": "Untuk mengajukan cuti, silakan...",
      "currentMenu": "menu_cuti",
      "workflowId": "workflow-456",
      "workflowName": "HR Assistant Bot",
      "contact": "John Doe",
      "phoneNumber": "628123456789",
      "date": "2024-02-05T10:30:00Z",
      "timestamp": 1707134600000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25
  },
  "statistics": {
    "totalChats": 1250,
    "totalContacts": 89,
    "menuDistribution": {
      "menu_cuti": 340,
      "menu_benefit": 280,
      "menu_payroll": 230
    },
    "dailyStats": {
      "2024-02-05": 45,
      "2024-02-04": 38
    },
    "averageResponseLength": 125,
    "topMenus": [
      { "menu": "menu_cuti", "count": 340 },
      { "menu": "menu_benefit", "count": 280 }
    ],
    "contactActivity": [
      {
        "contact": "John Doe",
        "chatCount": 15,
        "lastActivity": "2024-02-05T10:30:00Z"
      }
    ]
  }
}
```

### 4. Active Chats API (New)

**Base URL:** `/api/v1/chat/active`

#### GET - Active Chat Contacts
```http
GET /api/v1/chat/active
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (max: 200, default: 50)
- `status` (string): Filter by contact status
- `search` (string): Search contact name or phone number
- `sortBy` (string): Sort field (phoneNumber, contactName, lastActivity)
- `sortOrder` (string): Sort direction (asc/desc, default: desc)
- `includeSummary` (boolean): Include activity summary

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "phoneNumber": "628123456789",
      "contactName": "John Doe",
      "lastActivity": "2024-02-05T10:30:00Z",
      "status": "active",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 89,
    "totalPages": 2
  },
  "summary": {
    "totalActive": 89,
    "totalContacts": 89,
    "recentActivity": 12
  }
}
```

### 5. Individual Chat History API (New)

**Base URL:** `/api/v1/chat/[phoneNumber]`

#### GET - Individual Contact Chat History
```http
GET /api/v1/chat/628123456789
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (max: 500, default: 100)
- `startDate` (string): Filter by start date (YYYY-MM-DD)
- `endDate` (string): Filter by end date (YYYY-MM-DD)
- `menu` (string): Filter by specific menu
- `sortOrder` (string): Sort direction (asc/desc, default: desc)
- `includeStatistics` (boolean): Include individual statistics

**Example Response:**
```json
{
  "success": true,
  "phoneNumber": "628123456789",
  "contactInfo": {
    "phoneNumber": "628123456789",
    "contactName": "John Doe",
    "isActive": true
  },
  "data": [
    {
      "executionId": "exec-123",
      "startedAt": "2024-02-05T10:30:00Z",
      "chat": "Bagaimana cara mengajukan cuti?",
      "chatResponse": "Untuk mengajukan cuti, silakan...",
      "currentMenu": "menu_cuti",
      "workflowId": "workflow-456",
      "workflowName": "HR Assistant Bot",
      "timestamp": 1707134600000,
      "responseLength": 125,
      "chatLength": 28
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 45,
    "totalPages": 1
  },
  "statistics": {
    "totalMessages": 45,
    "totalMenus": 8,
    "averageResponseLength": 125,
    "averageChatLength": 32,
    "mostUsedMenu": "menu_cuti",
    "firstInteraction": "2024-01-15T08:30:00Z",
    "lastInteraction": "2024-02-05T10:30:00Z",
    "menuDistribution": {
      "menu_cuti": 15,
      "menu_benefit": 12,
      "menu_payroll": 8
    },
    "activityByHour": {
      "9": 8,
      "10": 12,
      "11": 10
    },
    "interactionFrequency": {
      "daily": 3,
      "weekly": 8,
      "monthly": 45
    }
  }
}
```

### 6. Legacy Chat History API (Updated)

The existing monitoring API has been updated to support API key authentication while maintaining backward compatibility.

**Base URL:** `/api/monitoring/feedback-rating`

```http
GET /api/monitoring/feedback-rating?days=30&type=chart
GET /api/monitoring/feedback-rating?type=details&page=1&limit=20
```

### 6. Legacy APIs (Updated with API Key Support)

#### Legacy Feedback Rating API
The existing monitoring API has been updated to support API key authentication while maintaining backward compatibility.

**Base URL:** `/api/monitoring/feedback-rating`

```http
GET /api/monitoring/feedback-rating?days=30&type=chart
GET /api/monitoring/feedback-rating?type=details&page=1&limit=20
```

#### Legacy Chat History API
The existing chat history monitoring API has been updated to support API key authentication.

**Base URL:** `/api/monitoring/chat-history`

```http
GET /api/monitoring/chat-history?menu=menu_cuti&startDate=2024-01-01&endDate=2024-02-05
```

**Query Parameters:**
- `menu` (string): Filter by menu (comma-separated)
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `page` (integer): Page number
- `limit` (integer): Items per page

## Error Responses

### Authentication Errors
```json
{
  "success": false,
  "error": "Unauthorized. Please login to access this resource.",
  "code": "UNAUTHORIZED",
  "authMethods": {
    "adminToken": "Use Authorization: Bearer <admin-token> header",
    "apiKey": "Use X-API-Key: <api-key> header or Authorization: Bearer <api-key>"
  }
}
```

### Permission Errors
```json
{
  "success": false,
  "error": "Insufficient permissions to access this resource.",
  "code": "FORBIDDEN"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": "Invalid page parameter. Must be a positive integer."
}
```

## CORS Support

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key`

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting based on API key usage for production environments.

## Security Notes

1. **API Key Storage**: In production, store API keys securely and rotate them regularly
2. **HTTPS**: Always use HTTPS in production environments
3. **Permissions**: Grant minimum required permissions to API keys
4. **Monitoring**: Monitor API usage and implement alerts for suspicious activity
5. **Validation**: Always validate input data and sanitize outputs

## Example Usage

### JavaScript/Node.js
```javascript
// Using API Key for chat history
const response = await fetch('/api/v1/chat?limit=10&includeStatistics=true', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});

const data = await response.json();
console.log(data);

// Get individual chat history
const contactHistory = await fetch('/api/v1/chat/628123456789?includeStatistics=true', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});

// Get active chats
const activeChats = await fetch('/api/v1/chat/active?includeSummary=true', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});
```

### cURL
```bash
# Get comprehensive chat history
curl -H "X-API-Key: your-api-key-here" \
     "http://localhost:3000/api/v1/chat?limit=10&menu=menu_cuti&includeStatistics=true"

# Get active chats with summary
curl -H "X-API-Key: your-api-key-here" \
     "http://localhost:3000/api/v1/chat/active?includeSummary=true"

# Get individual chat history
curl -H "X-API-Key: your-api-key-here" \
     "http://localhost:3000/api/v1/chat/628123456789?includeStatistics=true"

# Legacy feedback rating
curl -H "X-API-Key: your-api-key-here" \
     "http://localhost:3000/api/monitoring/feedback-rating?days=30&type=chart"

# Get feedback history with API key
curl -H "X-API-Key: your-api-key-here" \
     "http://localhost:3000/api/v1/feedback/history?limit=5"

# Create new feedback
curl -X POST \
     -H "X-API-Key: your-api-key-here" \
     -H "Content-Type: application/json" \
     -d '{"userId":"user123","feedbackRating":5,"chatOrigin":"whatsapp"}' \
     "http://localhost:3000/api/v1/feedback/history"
```

### Python
```python
import requests

headers = {'X-API-Key': 'your-api-key-here'}

# Get chat history with statistics
response = requests.get(
    'http://localhost:3000/api/v1/chat', 
    headers=headers,
    params={
        'limit': 10,
        'includeStatistics': 'true',
        'startDate': '2024-01-01',
        'endDate': '2024-02-05'
    }
)
chat_data = response.json()

# Get individual contact chat
contact_response = requests.get(
    'http://localhost:3000/api/v1/chat/628123456789',
    headers=headers,
    params={'includeStatistics': 'true'}
)
individual_data = contact_response.json()

# Get feedback history
feedback_response = requests.get(
    'http://localhost:3000/api/v1/feedback/history', 
    headers=headers
)
feedback_data = feedback_response.json()

print(f"Total chats: {chat_data.get('statistics', {}).get('totalChats', 0)}")
print(f"Individual messages: {individual_data.get('statistics', {}).get('totalMessages', 0)}")
```