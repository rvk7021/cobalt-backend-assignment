# Slack Connect - Message Scheduling Application

A modern web application that allows users to connect their Slack workspaces and send instant messages or schedule messages for future delivery. Built with a secure, scalable architecture using Node.js, React, and MongoDB.

## 🔗 Live Demo

**Frontend**: https://slack-connect.netlify.app

## 🌟 Features

- **Slack OAuth Integration**: Secure workspace connection using Slack's OAuth 2.0 flow
- **Instant Messaging**: Send messages immediately to any Slack channel
- **Message Scheduling**: Schedule messages for future delivery with date/time picker
- **Responsive Design**: Modern, mobile-friendly UI with dark theme
- **Secure Authentication**: Protected routes with authentication context
- **Real-time Updates**: Live status updates for scheduled messages
- **Token Management**: Automatic token refresh and secure storage

## 🚀 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Slack Web API** - Slack integration
- **node-cron** - Task scheduling
- **Crypto** - Token encryption/decryption
- **Axios** - HTTP client
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **JavaScript (ES6+)** - Programming language
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Context API** - State management
- **React Hooks** - Component logic

### Development & Deployment
- **npm** - Package manager
- **dotenv** - Environment variables
- **Render.com** - Backend hosting
- **Netlify** - Frontend hosting
- **MongoDB Atlas** - Database hosting

## 📁 Project Structure

```
slack-connect/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── config.ts          # Environment configuration
│   │   ├── db.ts              # MongoDB connection
│   │   ├── index.ts           # Application entry point
│   │   ├── scheduler.ts       # Message scheduling logic
│   │   ├── models/            # Database models
│   │   │   ├── Workspace.ts   # Workspace schema
│   │   │   └── ScheduledMessage.ts # Scheduled message schema
│   │   ├── routes/            # API routes
│   │   │   ├── slack.ts       # Slack OAuth routes
│   │   │   └── api.ts         # Message API routes
│   │   └── utils/             # Utility functions
│   │       ├── encryption.ts  # Token encryption
│   │       └── tokenRefresh.ts # Token refresh logic
│   ├── dist/                  # Compiled JavaScript
│   ├── package.json
│   ├── tsconfig.json
│   └── DEPLOYMENT.md
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AddToSlackButton.js
│   │   │   ├── MessageSender.js
│   │   │   ├── ScheduledMessages.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── UnauthorizedAccess.js
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── pages/             # Page components
│   │   │   ├── Home.js
│   │   │   ├── Dashboard.js
│   │   │   ├── AuthSuccess.js
│   │   │   └── AuthFailed.js
│   │   ├── hooks/             # Custom hooks
│   │   │   └── useLocation.js
│   │   └── App.js             # Main app component
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🏗️ Architecture & Flow

### 1. Authentication Flow
```
User → Home Page → Slack OAuth → Slack Authorization → 
Backend Token Exchange → Database Storage → AuthSuccess → Dashboard
```

### 2. Message Sending Flow
```
Dashboard → MessageSender Component → API Call → 
Slack Web API → Message Delivery → Status Update
```

### 3. Message Scheduling Flow
```
Dashboard → ScheduledMessages Component → Database Storage → 
Cron Scheduler → Workspace Lookup → Slack Web API → Message Delivery
```

### 4. Security Flow
```
Login → AuthContext → Protected Routes → Token Validation → 
Authorized Access / Unauthorized Redirect
```

## 🔧 Key Components

### Backend Architecture

#### **Models**
- **Workspace**: Stores Slack workspace credentials and metadata
- **ScheduledMessage**: Stores scheduled message data with user/team references

#### **Routes**
- **`/slack/*`**: OAuth flow, installation, and workspace management
- **`/api/*`**: Message sending, scheduling, and management APIs

#### **Utilities**
- **Encryption**: AES-256 encryption for secure token storage
- **Token Refresh**: Automatic Slack token refresh mechanism
- **Scheduler**: Cron-based message delivery system

### Frontend Architecture

#### **Context Management**
- **AuthContext**: Manages user authentication state across components

#### **Protected Routes**
- **ProtectedRoute**: HOC that prevents unauthorized access to dashboard
- **UnauthorizedAccess**: Component shown for unauthorized access attempts

#### **Core Components**
- **AddToSlackButton**: Official Slack "Add to Slack" button
- **MessageSender**: Instant message sending interface
- **ScheduledMessages**: Message scheduling and management interface

## 🔐 Security Features

### Authentication & Authorization
- **OAuth 2.0**: Secure Slack workspace connection
- **Protected Routes**: Context-based route protection
- **Session Management**: Persistent authentication state
- **Token Encryption**: AES-256 encryption for stored tokens

### Data Security
- **Environment Variables**: Sensitive data stored securely
- **Token Refresh**: Automatic token renewal
- **CORS Configuration**: Restricted cross-origin requests
- **Input Validation**: Sanitized user inputs

##  Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Slack App credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd slack-connect
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in backend directory:
   ```env
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   SLACK_REDIRECT_URI=http://localhost:5000/slack/oauth_redirect
   MONGO_URI=your_mongodb_connection_string
   ENCRYPTION_KEY=your_32_byte_encryption_key
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```

   Create `.env` file in client directory:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

### Development

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd client
   npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Production Build

1. **Build Backend**
   ```bash
   cd backend
   npm run build
   ```

2. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

## 🌐 Deployment

### Backend (Render.com)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy with build command: `npm install && npm run build`
4. Start command: `npm start`

### Frontend (Netlify)
1. Connect your GitHub repository
2. Set build directory: `client/build`
3. Build command: `npm run build`
4. Deploy automatically on commits

## 🔍 API Documentation

### Slack OAuth Routes
- `GET /slack/install` - Initiate Slack OAuth
- `GET /slack/oauth_redirect` - OAuth callback handler
- `GET /slack/status/:teamId` - Check workspace status
- `GET /slack/workspaces` - List connected workspaces

### Message API Routes
- `POST /api/send-message` - Send instant message
- `POST /api/schedule-message` - Schedule message
- `GET /api/scheduled-messages` - Get scheduled messages
- `PUT /api/scheduled-messages/:id` - Update scheduled message
- `DELETE /api/scheduled-messages/:id` - Delete scheduled message
- `POST /api/disconnect` - Disconnect workspace

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, please contact the developer at https://ranvijayk.netlify.app/ or create an issue in the repository.

---

**🚀 Ready to revolutionize your Slack workflow? Connect, schedule, and never miss a message again! ⚡**
