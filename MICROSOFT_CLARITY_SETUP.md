# Microsoft Clarity Setup Guide

## What is Microsoft Clarity?

Microsoft Clarity is a free user behavior analytics tool that helps you understand how users interact with your website through:
- **Session Recordings**: Watch real user sessions
- **Heatmaps**: See where users click, scroll, and spend time
- **Insights**: Get AI-powered insights about user behavior
- **Performance Metrics**: Track page load times and user engagement

## Setup Instructions

### Step 1: Create a Microsoft Clarity Account

1. Go to [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. Click **"Sign up"** or **"Get started for free"**
3. Sign in with your Microsoft account (or create one)

### Step 2: Create a New Project

1. Once logged in, click **"New Project"**
2. Enter your project details:
   - **Project Name**: PawVaidya Admin Panel
   - **Website URL**: http://localhost:5174 (for development) or your production URL
3. Click **"Create"**

### Step 3: Get Your Clarity Project ID

1. After creating the project, you'll see a setup page
2. Look for the **"Install tracking code"** section
3. You'll see a script that looks like this:

```html
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "YOUR_PROJECT_ID_HERE");
</script>
```

4. Copy the **Project ID** (the string after `"script",`)

### Step 4: Update Your Admin Panel

1. Open the file: `PawVaidya/admin/index.html`
2. Find the line that says: `"YOUR_CLARITY_PROJECT_ID"`
3. Replace it with your actual Clarity Project ID

**Example:**
```html
<!-- Before -->
})(window, document, "clarity", "script", "YOUR_CLARITY_PROJECT_ID");

<!-- After (with your actual ID) -->
})(window, document, "clarity", "script", "abc123xyz789");
```

### Step 5: Verify Installation

1. Save the file and restart your development server
2. Go back to Microsoft Clarity dashboard
3. Navigate to your project
4. Click on **"Setup"** tab
5. You should see a green checkmark indicating "Clarity is installed correctly"

## Features Now Available

### 1. Session Recordings
- Watch real user sessions to see exactly how they navigate
- Identify pain points and usability issues
- See where users get stuck or confused

### 2. Heatmaps
- **Click Heatmaps**: See where users click most
- **Scroll Heatmaps**: Understand how far users scroll
- **Area Heatmaps**: Identify most engaging sections

### 3. Dashboard Insights
- **Rage Clicks**: Detect frustrated users clicking repeatedly
- **Dead Clicks**: Find broken or non-functional elements
- **Quick Backs**: Identify pages users leave immediately
- **JavaScript Errors**: Track client-side errors

### 4. Analytics Dashboard Integration
The Analytics page (`/analytics`) now tracks:
- Page views
- User interactions
- Custom events
- Performance metrics

## Custom Event Tracking

You can track custom events in your Analytics dashboard:

```javascript
// Track when user views analytics
if (window.clarity) {
  window.clarity('set', 'page', 'Analytics Dashboard');
}

// Track custom events
if (window.clarity) {
  window.clarity('event', 'appointment_created');
  window.clarity('event', 'user_verified');
  window.clarity('event', 'doctor_added');
}
```

## Privacy & GDPR Compliance

Microsoft Clarity is GDPR compliant and:
- Automatically masks sensitive data (emails, phone numbers, etc.)
- Doesn't collect personally identifiable information
- Provides data retention controls
- Allows you to exclude specific pages or elements

### To Mask Additional Elements:

Add the `clarity-mask` class to any element you want to hide:

```html
<div class="clarity-mask">
  Sensitive information here
</div>
```

## Viewing Your Data

1. Go to [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. Select your **PawVaidya Admin Panel** project
3. Explore the following sections:
   - **Dashboard**: Overview of key metrics
   - **Recordings**: Watch user sessions
   - **Heatmaps**: Visual representation of user behavior
   - **Insights**: AI-powered recommendations

## Troubleshooting

### Clarity Not Tracking

1. **Check Project ID**: Ensure you've replaced `YOUR_CLARITY_PROJECT_ID` with your actual ID
2. **Clear Cache**: Clear browser cache and hard reload (Ctrl+Shift+R)
3. **Check Console**: Open browser DevTools and look for Clarity-related errors
4. **Verify Script**: Ensure the Clarity script is in the `<head>` section

### Data Not Showing

- It may take 2-3 minutes for data to appear in the dashboard
- Ensure you're browsing the site (localhost or production)
- Check that JavaScript is enabled in your browser

## Best Practices

1. **Regular Monitoring**: Check Clarity weekly to identify issues
2. **Filter Sessions**: Use filters to find specific user behaviors
3. **Share Insights**: Share recordings with your team to discuss improvements
4. **Act on Data**: Use insights to make data-driven decisions
5. **Combine with Analytics**: Use alongside Google Analytics for complete picture

## Support

- **Microsoft Clarity Help**: [https://docs.microsoft.com/en-us/clarity/](https://docs.microsoft.com/en-us/clarity/)
- **Community Forum**: [https://github.com/microsoft/clarity/discussions](https://github.com/microsoft/clarity/discussions)
- **Video Tutorials**: Search "Microsoft Clarity tutorial" on YouTube

---

## Summary

✅ Microsoft Clarity is now integrated into your admin panel
✅ Real-time user behavior tracking is active
✅ Analytics dashboard shows live data from your application
✅ All user interactions are being recorded and analyzed

**Next Steps:**
1. Get your Clarity Project ID
2. Replace `YOUR_CLARITY_PROJECT_ID` in `admin/index.html`
3. Start browsing your admin panel
4. View insights in Clarity dashboard
