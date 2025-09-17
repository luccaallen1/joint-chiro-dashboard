# Deploy Joint Chiro Dashboard to Replit

## Quick Setup

1. **Create New Repl**
   - Go to [replit.com](https://replit.com)
   - Click "Create Repl"
   - Choose "Import from GitHub" or "Upload folder"

2. **Upload Project**
   - Upload entire `JointChiro.Data.Dashboard` folder
   - Or connect your GitHub repo if you have one

## Replit Configuration

The project is now configured with:
- ✅ `.replit` file for Replit settings
- ✅ `start:replit` script in package.json
- ✅ Combined frontend + API server
- ✅ Static file serving for React app

## Environment Variables

Set these in Replit's "Secrets" tab (🔒 icon):

```
NODE_ENV=production
DATABASE_URL=postgresql://your-db-url
AIRTABLE_API_KEY=your-key
AIRTABLE_BASE_ID=your-base-id
AIRTABLE_TABLE_ID=your-table-id
```

## Database Setup

Replit includes PostgreSQL! To set it up:

1. **Add Database**
   - In your Repl, click "Database" tab
   - Enable PostgreSQL
   - Copy the connection string to `DATABASE_URL`

2. **Run Migrations**
   ```bash
   npm run migrate
   ```

## Deployment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Application**
   ```bash
   npm run start:replit
   ```

3. **Your app will be live at:**
   - Main Dashboard: `https://your-repl-name.your-username.repl.co`
   - Database Viewer: `https://your-repl-name.your-username.repl.co/database`

## What Happens When You Deploy

1. Builds React frontend (`npm run build:frontend`)
2. Installs all dependencies
3. Starts combined server on port 80/443
4. Serves React app + API endpoints
5. Connects to Replit PostgreSQL database

## Features Available

✅ **Analytics Dashboard** - Main clinic performance view
✅ **Chat Links Table** - All clinic links with UTM tracking
✅ **Custom UTM Creator** - Generate custom tracking links
✅ **QR Code Downloads** - Generate QR codes for any link
✅ **Database Viewer** - Browse all database tables (/database)
✅ **Responsive Design** - Works on mobile and desktop

## Troubleshooting

- **Build fails**: Check Node.js version (should be 18+)
- **Database connection**: Verify `DATABASE_URL` in Secrets
- **Port issues**: Replit auto-assigns ports, use `process.env.PORT`

Your Joint Chiro Dashboard is ready for Replit! 🚀