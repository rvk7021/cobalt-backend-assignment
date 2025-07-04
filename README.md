# Slack Connect - Message Scheduler

🚀 **Live Demo**: [https://slack-connect.netlify.app](https://slack-connect.netlify.app)

A modern web application that allows users to schedule and send messages to their Slack channels at specific times. Built with React, Node.js, and MongoDB.

## 🚀 Features

- **Slack OAuth Integration** - Secure authentication with Slack workspaces
- **Channel Management** - Access to public and private channels
- **Message Scheduling** - Schedule messages for future delivery with separate date/time pickers
- **Real-time Updates** - Refresh and manage scheduled messages
- **Modern UI** - Responsive design with dark theme and animations
- **Error Handling** - Comprehensive error handling with auto-dismissing notifications
- **Token Management** - Automatic token refresh and secure storage
- **Persistent Storage** - Messages persist across login sessions using userId/teamId

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern JavaScript library for building user interfaces
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Custom Hooks** - For location and authentication management

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript development
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - Object Data Modeling (ODM) library

### External Services
- **Slack Web API** - For Slack integration and messaging
- **MongoDB Atlas** - Cloud database hosting
- **Netlify** - Frontend deployment and hosting
- **Render** - Backend API hosting

## 🏗️ Architecture

### Controller-Based Architecture
The backend follows a clean controller-based architecture for better maintainability:

```
backend/src/
├── controllers/
│   ├── authController.ts          # Authentication & logout
│   ├── channelController.ts       # Channel operations
│   ├── messageController.ts       # Message sending & scheduling
│   ├── scheduledMessageController.ts  # Scheduled message CRUD
│   └── middlewareController.ts    # Request validation
├── models/
│   ├── Workspace.ts              # Slack workspace data
│   └── ScheduledMessage.ts       # Scheduled message data
├── routes/
│   ├── api.ts                    # API route definitions
│   └── slack.ts                  # Slack OAuth routes
└── utils/
    ├── tokenRefresh.ts           # Token management
    └── encryption.ts             # Data encryption
```

### Data Models

**Workspace Model:**
- Stores Slack workspace credentials and tokens
- Handles OAuth data securely with encryption
- Tracks active status and last refresh times

**ScheduledMessage Model:**
- Links messages to users via userId/teamId for persistence
- Supports message status tracking (pending, sent, failed)
- Stores channel information and scheduled time

## 🔄 Application Flow

1. **Authentication**: User clicks "Add to Slack" button
2. **OAuth Flow**: Redirects to Slack for authorization
3. **Token Storage**: Securely stores encrypted access tokens
4. **Dashboard Access**: User accesses message scheduling interface
5. **Channel Loading**: Fetches available Slack channels
6. **Message Scheduling**: User composes and schedules messages
7. **Background Processing**: Scheduler sends messages at specified times
8. **Persistent Sessions**: Messages persist across logout/login cycles

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB database (local or Atlas)
- Slack App with appropriate permissions

## ⚙️ Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd slack-connect
```

### 2. Slack App Configuration
1. Create a new Slack app at [https://api.slack.com/apps](https://api.slack.com/apps)
2. Configure OAuth & Permissions with these scopes:
   - `channels:read` - Access public channels
   - `chat:write` - Send messages
   - `chat:write.public` - Send messages to public channels
   - `groups:read` - Access private channels
   - `users:read` - Access user information
   - `team:read` - Access workspace information
3. Set redirect URL: `YOUR_BACKEND_URL/slack/oauth_redirect`

### 3. Environment Variables

**Backend (.env):**
```env
# MongoDB
YOUR_MONGODB_URI=mongodb://localhost:27017/slack-connect

# Slack App Credentials
YOUR_SLACK_CLIENT_ID=your_slack_client_id
YOUR_SLACK_CLIENT_SECRET=your_slack_client_secret
YOUR_SLACK_REDIRECT_URI=YOUR_BACKEND_URL/slack/oauth_redirect

# Application URLs
YOUR_BACKEND_URL=http://localhost:5000
YOUR_FRONTEND_URL=http://localhost:3000

# Security
YOUR_ENCRYPTION_KEY=your-32-character-encryption-key

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

### 4. Installation & Development

**Backend Setup:**
```bash
cd backend
npm install
npm run dev
```

**Frontend Setup:**
```bash
cd client
npm install
npm start
```

### 5. Production Deployment

**Backend (Render/Heroku):**
- Set all environment variables
- Deploy backend with start script: `npm run build && npm start`

**Frontend (Netlify/Vercel):**
- Set `REACT_APP_BACKEND_URL` to your deployed backend URL
- Build and deploy: `npm run build`

## 🎯 Learning & Challenges

### 🔐 HTTPS Requirements & Tunneling
**Challenge**: Slack OAuth requires HTTPS endpoints for security, but local development runs on HTTP.

**Solution**: 
- Used tunneling services (ngrok, Cloudflare Tunnel) to expose local development server with HTTPS
- Configured Slack app redirect URLs to use HTTPS tunnel endpoints
- Implemented proper SSL certificate handling in production

**Learning**: Understanding webhook security requirements and the importance of HTTPS in OAuth flows.

### 🔄 Token Management & Refresh
**Challenge**: Slack access tokens expire and need automatic renewal without user intervention.

**Solution**:
- Implemented automatic token refresh mechanism using refresh tokens
- Built retry logic for API calls when tokens expire
- Stored encrypted tokens with expiration tracking
- Created background service to proactively refresh tokens

**Learning**: OAuth token lifecycle management and building resilient API authentication systems.

### 🗄️ Data Persistence Strategy
**Challenge**: Maintaining scheduled messages across user logout/login cycles and workspace changes.

**Solution**:
- Switched from workspace-based storage to userId/teamId combination
- Implemented soft logout that preserves scheduled messages
- Built data migration strategy for existing messages
- Used MongoDB compound indexes for efficient querying

**Learning**: Database design patterns for multi-tenant applications and data consistency strategies.

### ⏰ Distributed Scheduling System
**Challenge**: Reliable message scheduling across server restarts and scaling.

**Solution**:
- Built custom scheduler that checks pending messages every minute
- Implemented proper error handling and retry mechanisms
- Used MongoDB for persistent job storage
- Created status tracking system for message delivery

**Learning**: Building distributed systems and handling time-based operations reliably.

### 🔒 Security & Encryption
**Challenge**: Securing sensitive Slack tokens and user data.

**Solution**:
- Implemented AES encryption for token storage
- Used environment variables for encryption keys
- Built secure API endpoints with proper validation
- Implemented CORS properly with environment-based origins

**Learning**: Application security best practices and encryption implementation.

### 🎨 UI/UX Consistency
**Challenge**: Creating a modern, consistent interface across different components and states.

**Solution**:
- Developed unified design system with Tailwind CSS
- Implemented responsive design patterns
- Created consistent error handling with auto-dismiss functionality
- Built accessible form controls and navigation

**Learning**: Modern frontend development patterns and accessibility considerations.

### 🏗️ Code Organization & Scalability
**Challenge**: Managing growing codebase with clean architecture.

**Solution**:
- Implemented controller-based backend architecture
- Separated concerns with dedicated service layers
- Created reusable components and hooks
- Established consistent code patterns and TypeScript usage

**Learning**: Software architecture principles and maintainable code organization.

## 🚀 Future Enhancements

- **Recurring Messages**: Support for daily/weekly/monthly scheduling patterns
- **Message Templates**: Save and reuse common message formats
- **Team Management**: Multi-user workspace administration
- **Analytics Dashboard**: Message delivery statistics and insights
- **Message Formatting**: Rich text editor with Slack markdown support
- **Timezone Handling**: User-specific timezone settings and display

## 🤝 Support

For questions or support, please contact: [your-email@example.com](mailto:your-email@example.com)

---

**Note**: This application requires proper Slack app configuration and HTTPS endpoints for production use. Follow the setup instructions carefully for successful deployment.
