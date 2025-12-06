# Wild Silk Soap Co. - E-commerce Platform

A mobile-first e-commerce platform built with Next.js, designed for small artisan businesses. Features Stripe payments, USPS shipping label generation, and an easy-to-use admin dashboard optimized for iPhone.

## Features

- **Mobile-First Design**: Beautiful, touch-friendly UI optimized for phone users
- **Product Management**: Easy product CRUD with multi-image upload
- **iPhone Photo Upload**: Direct camera capture and photo library access with auto-compression
- **Stripe Checkout**: Secure payment processing
- **USPS Shipping Labels**: Generate printable shipping labels via EasyPost
- **Customer Accounts**: Order history and saved addresses
- **Admin Dashboard**: Manage products, orders, and shipping from your phone

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas (free tier)
- **Images**: Cloudinary (free tier)
- **Payments**: Stripe
- **Shipping**: EasyPost (USPS)
- **Hosting**: Vercel (free tier)

## Estimated Costs

| Service | Monthly Cost |
|---------|-------------|
| Vercel Hosting | $0 |
| MongoDB Atlas | $0 |
| Cloudinary | $0 |
| Stripe | 2.9% + $0.30 per transaction |
| EasyPost | ~$0.05 per label + postage |

**Total: ~$0/month** (plus payment processing fees)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free)
- Stripe account (free)
- Cloudinary account (free)
- EasyPost account (free for testing)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd WildSilkSoapCo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://...

# NextAuth.js
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# EasyPost
EASYPOST_API_KEY=your-easypost-key

# Store (optional)
NEXT_PUBLIC_STORE_NAME=Wild Silk Soap Co.
```

## Deployment to Vercel

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click "New Project" and import your repository

4. Add all environment variables in the Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add each variable from your `.env.local`

5. Deploy! Vercel will automatically build and deploy your site

6. Set up Stripe webhook:
   - In Stripe Dashboard, go to Developers > Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select event: `checkout.session.completed`
   - Copy the webhook secret to Vercel env vars

## Creating an Admin User

1. Register a new account at `/register`

2. Connect to your MongoDB database and run:
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

3. Log out and log back in to access the admin dashboard at `/admin`

## Project Structure

```
src/
├── app/
│   ├── (shop)/          # Customer storefront
│   ├── (account)/       # Auth & account pages
│   ├── admin/           # Admin dashboard
│   └── api/             # API routes
├── components/          # Reusable components
├── lib/
│   ├── models/          # Mongoose schemas
│   ├── mongodb.ts       # Database connection
│   └── auth.ts          # Auth configuration
└── types/               # TypeScript definitions
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List all products |
| `/api/products` | POST | Create product (admin) |
| `/api/products/[id]` | PUT | Update product (admin) |
| `/api/products/[id]` | DELETE | Delete product (admin) |
| `/api/orders` | GET | List orders |
| `/api/orders/[id]` | GET | Get order details |
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/shipping/rates` | POST | Get USPS rates |
| `/api/shipping/label` | POST | Create shipping label |
| `/api/upload` | POST | Upload image to Cloudinary |

## Setting Up External Services

### MongoDB Atlas
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string and add to env vars

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard > Developers
3. Use test mode for development

### Cloudinary
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get cloud name and API credentials from Dashboard
3. Free tier allows 25GB storage

### EasyPost
1. Create account at [easypost.com](https://easypost.com)
2. Get API key from Dashboard
3. Use test mode for development (free)

## License

MIT
