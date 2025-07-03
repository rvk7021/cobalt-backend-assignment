# Deployment Configuration for Render.com

## Build Command:
```bash
npm install && npm run build
```

## Start Command:
```bash
npm start
```

## Environment Variables to Set:
- SLACK_CLIENT_ID=your_slack_client_id
- SLACK_CLIENT_SECRET=your_slack_client_secret  
- SLACK_REDIRECT_URI=https://cobalt-backend-assignment.onrender.com/slack/oauth_redirect
- MONGO_URI=your_mongodb_connection_string
- ENCRYPTION_KEY=your_32_byte_encryption_key
- PORT=5000
- FRONTEND_URL=https://your-frontend-url.com

## Deployment Steps:

1. **Install Dependencies**: `npm install`
2. **Build TypeScript**: `npm run build` 
3. **Start Application**: `npm start`

## Troubleshooting:

If you get "Cannot find module" error, ensure:
1. TypeScript is compiled: Check if `dist/` directory exists
2. Build command runs: `npm run build`
3. Entry point is correct: `dist/index.js` exists

## Files Structure After Build:
```
backend/
├── dist/           # Compiled JavaScript (created after build)
│   ├── index.js
│   ├── config.js
│   ├── db.js
│   └── ...
├── src/            # TypeScript source
└── package.json
```
