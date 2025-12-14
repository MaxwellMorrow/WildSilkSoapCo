# Square Integration Setup Guide

This guide will help you complete the Square payment integration for your Wild Silk Soap Co. e-commerce platform.

## ✅ What's Been Implemented

1. **Square SDK Installation** - Official `square` package installed
2. **Square Helper Library** - Created `src/lib/square.ts` for Square client initialization
3. **Order Model Updates** - Added Square payment fields (`squarePaymentLinkId`, `squareOrderId`)
4. **Checkout API Route** - Created `src/app/api/square/checkout/route.ts`
   - Creates Square Orders with cart items
   - Generates Payment Links for checkout
   - Handles shipping calculations
5. **Webhook Handler** - Created `src/app/api/square/webhook/route.ts`
   - Processes payment events from Square
   - Creates orders in your database when payments complete
   - Sends branded order confirmation emails (if Resend is configured)
6. **Email Service** - Created `src/lib/email.ts`
   - Sends branded order confirmation emails via Resend
   - Beautiful HTML email template with order details
7. **Frontend Updates** - Cart page now uses Square checkout

## 🔧 Required Environment Variables

Add these to your `.env.local` file (and Vercel environment variables for production):

```env
# Square Payments Configuration
SQUARE_ACCESS_TOKEN=your-access-token-here
SQUARE_LOCATION_ID=your-location-id-here
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SECRET=your-webhook-secret-here

# Optional: For Web Payment SDK (if you want to add embedded checkout later)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your-application-id-here

# Email Service (Gmail) - Optional but recommended for branded order confirmations
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

## 📋 Getting Your Square Credentials

### 1. Square Developer Account
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Sign in or create a Square Developer account
3. Create a new application (or use an existing one)

### 2. Get Your Access Token
1. In your application dashboard, go to **Credentials**
2. Under **Sandbox** or **Production**, copy your **Access Token**
   - Use **Sandbox** for testing (uses test cards)
   - Use **Production** for live payments
3. Add to `SQUARE_ACCESS_TOKEN`

### 3. Get Your Location ID
1. In Square Developer Dashboard, go to **Locations**
2. Select your location (or create one for sandbox)
3. Copy the **Location ID**
4. Add to `SQUARE_LOCATION_ID`

### 4. Get Your Application ID
1. In your application dashboard, go to **General**
2. Copy your **Application ID**
3. Add to `NEXT_PUBLIC_SQUARE_APPLICATION_ID` (optional, for Web Payment SDK)

### 5. Set Up Webhooks
1. In Square Developer Dashboard, go to **Webhooks**
2. Add a new webhook endpoint:
   - **URL**: `https://your-domain.vercel.app/api/square/webhook`
   - **Events to Subscribe**:
     - `payment.created`
     - `payment.updated`
3. Copy the **Webhook Signature Key**
4. Add to `SQUARE_WEBHOOK_SECRET`

### 6. Environment Setting
- Set `SQUARE_ENVIRONMENT=sandbox` for testing
- Set `SQUARE_ENVIRONMENT=production` for live payments

### 7. Email Service Setup (Optional but Recommended)
For branded order confirmation emails using Gmail:

1. **Enable 2-Step Verification** on your Google Account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app and "Other" as the device
   - Name it "Wild Silk Soap Co Order System"
   - Copy the 16-character password

3. **Add to Environment Variables**:
   - `GMAIL_USER`: Your Gmail address (e.g., `yourname@gmail.com`)
   - `GMAIL_APP_PASSWORD`: The 16-character app password you generated

**Note**: 
- Without Gmail configured, Square will send basic payment receipts, but you won't get custom branded order confirmation emails with full order details.
- Free Gmail accounts can send up to **500 emails per day**
- For higher volumes, consider Google Workspace or a dedicated email service

## 🧪 Testing

### Test Cards (Sandbox Environment)
Use these test card numbers in Square sandbox:
- **Successful Payment**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits
- **Expiration**: Any future date
- **ZIP**: Any 5 digits

### Testing the Flow
1. Add items to cart
2. Click "Proceed to Checkout"
3. You'll be redirected to Square's hosted checkout page
4. Complete payment with test card
5. You'll be redirected back to `/checkout/success`
6. Check your database - order should be created via webhook

## 🔍 How It Works

### Checkout Flow
1. User clicks checkout in cart
2. Frontend calls `/api/square/checkout`
3. Backend creates Square Order with cart items
4. Backend creates Payment Link from the Order
5. User is redirected to Square's hosted checkout
6. After payment, user returns to success page

### Webhook Flow
1. Square sends payment event to `/api/square/webhook`
2. Webhook verifies signature
3. Retrieves order details from Square
4. Creates order in your MongoDB database
5. Sends branded order confirmation email to customer (if Resend configured)
6. Order is ready for admin to view and ship

## 📚 Square Web Payment SDK (Optional)

If you want to implement an embedded checkout form instead of redirecting to Square's hosted page, you can use the Square Web Payment SDK:

1. Add script to your HTML:
```html
<script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
```

2. Use `NEXT_PUBLIC_SQUARE_APPLICATION_ID` in your frontend code

See [Square Web Payment SDK Docs](https://developer.squareup.com/docs/web-payments/overview) for more details.

## 🚨 Troubleshooting

### Checkout Not Working
- Verify all environment variables are set correctly
- Check browser console for errors
- Verify Square credentials are correct
- Ensure `SQUARE_ENVIRONMENT` matches your access token type

### Webhooks Not Firing
- Verify webhook URL is publicly accessible
- Check webhook signature verification
- Ensure webhook events are subscribed in Square dashboard
- Check server logs for webhook errors

### Orders Not Creating
- Verify webhook is receiving events
- Check database connection
- Verify order model schema matches Square data structure
- Check server logs for detailed error messages

## 📝 Next Steps

1. Set up all environment variables
2. Test in sandbox mode
3. Configure webhook in Square dashboard
4. Test complete checkout flow
5. Switch to production when ready

## 🔗 Useful Links

- [Square Developer Dashboard](https://developer.squareup.com/apps)
- [Square Payment Links API](https://developer.squareup.com/reference/square/payment-links-api)
- [Square Orders API](https://developer.squareup.com/reference/square/orders-api)
- [Square Webhooks Guide](https://developer.squareup.com/docs/webhooks/overview)

