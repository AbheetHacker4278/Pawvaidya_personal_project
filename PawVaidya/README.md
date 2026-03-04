# PawVaidya - Veterinary Consultancy Platform

A comprehensive veterinary consultancy platform with user portal, admin panel, and real-time features.

## Quick Start

### Local Development

1. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Fill in your environment variables
   npm install
   npm run server
   ```

2. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   # Set VITE_BACKEND_URL=http://localhost:4000
   npm install
   npm run dev
   ```

3. **Admin**
   ```bash
   cd admin
   cp .env.example .env
   # Set VITE_BACKEND_URL=http://localhost:4000
   npm install
   npm run dev
   ```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Render.com.

### Quick Deploy to Render

1. Push code to GitHub
2. Import repository in Render Dashboard
3. Use `render.yaml` for automatic setup
4. Configure environment variables
5. Deploy!

## Project Structure

```
PawVaidya/
├── backend/          # Node.js/Express API
├── frontend/         # React user portal
├── admin/            # React admin panel
├── render.yaml       # Render deployment config
├── DEPLOYMENT.md     # Deployment guide
└── README.md         # This file
```

## Features

- User registration and authentication
- Doctor profiles and scheduling
- Appointment booking
- Real-time chat
- Payment integration
- Admin dashboard
- Community blogs
- And more...

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Frontend**: React, Vite, Tailwind CSS
- **Admin**: React, Vite, Material-UI
- **Deployment**: Render.com

## Environment Variables

Check `.env.example` files in each directory for required environment variables.

## License

All rights reserved.

## Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section.
