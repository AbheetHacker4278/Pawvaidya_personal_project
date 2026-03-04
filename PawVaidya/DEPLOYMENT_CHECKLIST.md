# Render Deployment Checklist

Use this checklist to ensure your deployment is successful.

## Pre-Deployment

- [ ] Code is pushed to GitHub repository
- [ ] MongoDB Atlas database is set up and accessible
- [ ] Cloudinary account is configured
- [ ] Email service credentials are ready
- [ ] Payment gateway credentials are ready (if using)
- [ ] OpenAI API key is obtained (if using AI features)
- [ ] All `.env.example` files reviewed

## Backend Deployment

- [ ] Create Web Service on Render
- [ ] Set Root Directory to `backend`
- [ ] Configure Build Command: `npm install`
- [ ] Configure Start Command: `npm start`
- [ ] Add all environment variables from `.env.example`
- [ ] Note backend URL for frontend/admin configuration
- [ ] Verify deployment succeeds
- [ ] Test backend health endpoint

## Frontend Deployment

- [ ] Create Static Site on Render
- [ ] Set Root Directory to `frontend`
- [ ] Configure Build Command: `npm install && npm run build`
- [ ] Set Publish Directory to `dist`
- [ ] Add `VITE_BACKEND_URL` environment variable
- [ ] Note frontend URL for CORS configuration
- [ ] Verify deployment succeeds
- [ ] Test frontend loads correctly

## Admin Deployment

- [ ] Create Static Site on Render
- [ ] Set Root Directory to `admin`
- [ ] Configure Build Command: `npm install && npm run build`
- [ ] Set Publish Directory to `dist`
- [ ] Add `VITE_BACKEND_URL` environment variable
- [ ] Note admin URL for CORS configuration
- [ ] Verify deployment succeeds
- [ ] Test admin panel loads correctly

## Post-Deployment Configuration

- [ ] Update backend `ALLOWED_ORIGINS` with frontend and admin URLs
- [ ] Wait for backend to redeploy
- [ ] Test CORS - no errors in browser console
- [ ] Verify API calls work from frontend
- [ ] Verify API calls work from admin

## Functional Testing

### User Features
- [ ] User registration works
- [ ] Email verification works
- [ ] User login works
- [ ] Password reset works
- [ ] Profile editing works
- [ ] Doctor listing loads
- [ ] Appointment booking works
- [ ] Payment processing works (if enabled)
- [ ] Chat functionality works
- [ ] Notifications work

### Admin Features
- [ ] Admin login works
- [ ] Dashboard loads with correct data
- [ ] Doctor management works
- [ ] User management works
- [ ] Appointment management works
- [ ] Reports generate correctly
- [ ] Settings can be updated

### Real-time Features
- [ ] Socket.IO connects successfully
- [ ] Chat messages send/receive in real-time
- [ ] Notifications appear in real-time
- [ ] No WebSocket errors in console

## Performance Checks

- [ ] Initial page load is acceptable
- [ ] Images load correctly from Cloudinary
- [ ] API response times are reasonable
- [ ] No console errors on any page
- [ ] Mobile responsiveness works

## Security Checks

- [ ] HTTPS is enabled (automatic on Render)
- [ ] Environment variables are not exposed
- [ ] CORS is properly configured
- [ ] JWT tokens are secure
- [ ] Admin routes are protected
- [ ] File uploads are validated

## Monitoring Setup

- [ ] Check Render dashboard for service health
- [ ] Review application logs
- [ ] Set up error tracking (optional)
- [ ] Configure uptime monitoring (optional)
- [ ] Set up alerts for downtime (optional)

## Documentation

- [ ] Update README.md with deployment URLs
- [ ] Document any custom configuration
- [ ] Save environment variables securely
- [ ] Note any known issues or limitations

## Optional Enhancements

- [ ] Configure custom domain
- [ ] Set up staging environment
- [ ] Enable automatic backups
- [ ] Add CI/CD pipeline
- [ ] Implement caching strategy
- [ ] Set up CDN for static assets

## Troubleshooting Reference

If you encounter issues, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- Render Dashboard logs
- Browser console for frontend errors
- Network tab for API call issues

## Success Criteria

Your deployment is successful when:
- ✅ All three services are deployed and running
- ✅ Users can register and login
- ✅ Appointments can be booked
- ✅ Admin can manage the platform
- ✅ No CORS errors
- ✅ Real-time features work
- ✅ All critical user flows function correctly

---

**Note**: Keep this checklist updated as you add new features or make changes to the deployment process.
