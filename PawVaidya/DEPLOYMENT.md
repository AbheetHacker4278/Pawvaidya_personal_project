# PawVaidya Deployment Guide for Render.com

This guide will walk you through deploying the PawVaidya application (Backend, Frontend, and Admin Panel) to Render.com.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas**: Set up a MongoDB database (recommended) or use any cloud MongoDB service
4. **Cloudinary Account**: For image uploads
5. **Email Service**: Configure Nodemailer or Mailtrap
6. **Payment Gateway**: Razorpay account (if using payments)
7. **OpenAI API Key**: For AI features

## Architecture Overview

The application consists of three services:
- **Backend**: Node.js/Express API (Web Service)
- **Frontend**: React/Vite application (Static Site)
- **Admin**: React/Vite admin panel (Static Site)

## Step 1: Deploy Backend Service

### 1.1 Create Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pawvaidya-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free or Starter (upgrade as needed)

### 1.2 Configure Environment Variables

Add the following environment variables in Render Dashboard:

```
MONGODB_URI=<your_mongodb_atlas_connection_string>
PORT=4000
JWT_SECRET=<generate_random_secret>
ADMIN_JWT_SECRET=<generate_random_secret>
ADMIN_EMAIL=admin@pawvaidya.com
ADMIN_PASSWORD=<your_secure_password>
CLOUDINARY_NAME=<your_cloudinary_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_SECRET_KEY=<your_cloudinary_secret_key>
EMAIL_USER=<your_email>
EMAIL_PASS=<your_email_password>
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
RAZORPAY_KEY_ID=<your_razorpay_key_id>
RAZORPAY_KEY_SECRET=<your_razorpay_key_secret>
OPENAI_API_KEY=<your_openai_api_key>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_REDIRECT_URI=<your_redirect_uri>
REDIS_URL=<your_redis_url_if_using>
```

**Important**: Leave `ALLOWED_ORIGINS` empty for now. We'll add it after deploying frontend and admin.

### 1.3 Deploy

Click **Create Web Service** and wait for deployment to complete.

Note your backend URL: `https://pawvaidya-backend.onrender.com`

## Step 2: Deploy Frontend Service

### 2.1 Create Static Site

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pawvaidya-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 2.2 Configure Environment Variables

Add the following environment variable:

```
VITE_BACKEND_URL=https://pawvaidya-backend.onrender.com
```

Replace with your actual backend URL from Step 1.3.

### 2.3 Deploy

Click **Create Static Site** and wait for deployment.

Note your frontend URL: `https://pawvaidya-frontend.onrender.com`

## Step 3: Deploy Admin Panel

### 3.1 Create Static Site

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pawvaidya-admin`
   - **Branch**: `main`
   - **Root Directory**: `admin`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3.2 Configure Environment Variables

Add the following environment variable:

```
VITE_BACKEND_URL=https://pawvaidya-backend.onrender.com
```

Replace with your actual backend URL from Step 1.3.

### 3.3 Deploy

Click **Create Static Site** and wait for deployment.

Note your admin URL: `https://pawvaidya-admin.onrender.com`

## Step 4: Update CORS Configuration

Now that all services are deployed, update the backend's CORS configuration:

1. Go to your backend service in Render Dashboard
2. Navigate to **Environment** tab
3. Add/Update the `ALLOWED_ORIGINS` variable:

```
ALLOWED_ORIGINS=https://pawvaidya-frontend.onrender.com,https://pawvaidya-admin.onrender.com
```

Replace with your actual frontend and admin URLs.

4. Save changes - this will trigger a redeploy of the backend.

## Step 5: Verification

### 5.1 Test Backend

Visit `https://pawvaidya-backend.onrender.com` - you should see "Badhia Chall raha hai Guru"

### 5.2 Test Frontend

1. Visit your frontend URL
2. Try registering a new user
3. Try logging in
4. Check browser console for any CORS errors
5. Test booking an appointment

### 5.3 Test Admin Panel

1. Visit your admin URL
2. Log in with admin credentials
3. Verify dashboard loads
4. Check all admin features

### 5.4 Test Socket.IO

1. Open browser console
2. Check for WebSocket connection messages
3. Test real-time features (chat, notifications)

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Verify `ALLOWED_ORIGINS` includes your exact frontend/admin URLs
2. Check for trailing slashes - they should match exactly
3. Ensure backend has redeployed after updating environment variables

### Build Failures

**Frontend/Admin Build Fails:**
- Check Node.js version matches (20.x)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Backend Build Fails:**
- Verify all environment variables are set
- Check MongoDB connection string
- Review server logs

### Database Connection Issues

- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Render's IP ranges
- Verify connection string is correct
- Check MongoDB Atlas cluster is running

### File Upload Issues

- Verify Cloudinary credentials are correct
- Check Cloudinary account has sufficient quota
- Review backend logs for upload errors

### Socket.IO Not Working

- Ensure WebSocket connections are enabled (Render supports this by default)
- Check browser console for connection errors
- Verify backend is running and accessible

## Performance Optimization

### Free Tier Limitations

Render's free tier:
- Spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free

**Solutions:**
1. Upgrade to paid tier for always-on service
2. Use a service like UptimeRobot to ping your backend every 14 minutes
3. Implement a loading state in frontend for cold starts

### Caching

Consider adding:
- Redis for session management
- CDN for static assets
- Database query caching

## Custom Domains (Optional)

To use custom domains:

1. Go to service settings in Render
2. Click **Custom Domain**
3. Add your domain
4. Update DNS records as instructed
5. Update `ALLOWED_ORIGINS` with new domain

## Monitoring

### Render Dashboard

- Check service logs regularly
- Monitor resource usage
- Set up alerts for downtime

### Application Monitoring

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user tracking

## Security Checklist

- [ ] All environment variables are set and secure
- [ ] JWT secrets are strong and unique
- [ ] Database credentials are not exposed
- [ ] CORS is properly configured
- [ ] HTTPS is enabled (automatic on Render)
- [ ] Admin password is strong
- [ ] API keys are kept secret

## Backup Strategy

1. **Database**: Enable MongoDB Atlas automated backups
2. **Code**: Keep GitHub repository updated
3. **Environment Variables**: Document all variables securely
4. **Media Files**: Cloudinary handles backups automatically

## Updating Your Application

To deploy updates:

1. Push changes to GitHub
2. Render automatically detects and deploys changes
3. Monitor deployment logs
4. Verify changes in production

For manual deploys:
- Go to service in Render Dashboard
- Click **Manual Deploy** → **Deploy latest commit**

## Support

If you encounter issues:

1. Check Render status page: https://status.render.com
2. Review Render documentation: https://render.com/docs
3. Check application logs in Render Dashboard
4. Contact Render support for platform issues

## Cost Estimation

**Free Tier:**
- Backend: Free (with limitations)
- Frontend: Free
- Admin: Free
- Total: $0/month

**Starter Tier:**
- Backend: $7/month (always-on, better performance)
- Frontend: Free
- Admin: Free
- Total: $7/month

**Production Tier:**
- Backend: $25/month (2GB RAM, auto-scaling)
- Frontend: Free
- Admin: Free
- Database: MongoDB Atlas M10 (~$57/month)
- Total: ~$82/month

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domain (optional)
3. Enable automatic backups
4. Implement CI/CD pipeline
5. Add staging environment
6. Set up error tracking
7. Configure email notifications for deployments

---

**Congratulations!** Your PawVaidya application is now deployed on Render! 🎉
