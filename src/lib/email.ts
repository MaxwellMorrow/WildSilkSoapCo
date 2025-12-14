import nodemailer from "nodemailer";

// Create reusable transporter for Gmail SMTP
const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

export async function sendAccountConfirmationEmail(
  email: string,
  name: string
) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("Gmail credentials not configured (GMAIL_USER and GMAIL_APP_PASSWORD), skipping email send");
    return null;
  }

  try {
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Wild Silk Soap Co.";
    const fromEmail = process.env.GMAIL_USER || "";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000";

    const info = await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: email,
      subject: `Welcome to ${storeName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${storeName}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2D3436; background-color: #FDF8F3; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #D4A574 0%, #B88B5D 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 600; font-family: 'Georgia', serif;">
                ${storeName}
              </h1>
              <p style="color: #FFFFFF; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
                Hand Poured • Skin Loving
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 64px; height: 64px; background-color: #A8C09A; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <svg style="width: 32px; height: 32px; color: #FFFFFF;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 style="color: #2D3436; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
                  Welcome, ${name}!
                </h2>
                <p style="color: #636E72; margin: 0; font-size: 16px;">
                  Your account has been successfully created.
                </p>
              </div>

              <!-- Confirmation Message -->
              <div style="background-color: #FDF8F3; border-left: 4px solid #D4A574; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #2D3436; line-height: 1.8;">
                  Thank you for joining ${storeName}! We're thrilled to have you as part of our community of soap lovers.
                </p>
              </div>

              <!-- What You Can Do -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #2D3436; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; border-bottom: 2px solid #F0E6D8; padding-bottom: 10px;">
                  What You Can Do Now
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #636E72; font-size: 15px; line-height: 1.8;">
                  <li>Browse our handcrafted soap collection</li>
                  <li>Save your shipping addresses for faster checkout</li>
                  <li>Track your orders and view order history</li>
                  <li>Receive exclusive offers and updates</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #D4A574 0%, #B88B5D 100%); color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  Start Shopping
                </a>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #F0E6D8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #2D3436; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  Need Help?
                </h3>
                <p style="margin: 0; color: #636E72; font-size: 15px; line-height: 1.8;">
                  If you have any questions or need assistance, feel free to reply to this email or contact us at{" "}
                  <a href="mailto:${fromEmail}" style="color: #D4A574; text-decoration: none; font-weight: 500;">
                    ${fromEmail}
                  </a>
                  . We're here to help!
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 30px; border-top: 1px solid #F0E6D8;">
                <p style="margin: 0 0 10px 0; color: #636E72; font-size: 14px;">
                  Thank you for choosing ${storeName}!
                </p>
                <p style="margin: 0; color: #636E72; font-size: 12px;">
                  © ${new Date().getFullYear()} ${storeName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Account confirmation email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send account confirmation email:", error);
    // Don't throw - email failures shouldn't break account creation
    return null;
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  order: {
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number; image?: string }>;
    subtotal: number;
    shippingCost: number;
    total: number;
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  }
) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("Gmail credentials not configured (GMAIL_USER and GMAIL_APP_PASSWORD), skipping email send");
    return null;
  }

  try {
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Wild Silk Soap Co.";
    const fromEmail = process.env.GMAIL_USER || "";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000";
    
    // Helper function to get absolute image URL
    const getImageUrl = (imageUrl?: string): string => {
      if (!imageUrl) return "";
      // If already absolute URL, return as is
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
      }
      // If relative URL, make it absolute
      if (imageUrl.startsWith("/")) {
        return `${baseUrl}${imageUrl}`;
      }
      // Otherwise assume it's already a full URL or return empty
      return imageUrl;
    };

    const info = await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2D3436; background-color: #FDF8F3; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #D4A574 0%, #B88B5D 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 600; font-family: 'Georgia', serif;">
                ${storeName}
              </h1>
              <p style="color: #FFFFFF; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
                Hand Poured • Skin Loving
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 64px; height: 64px; background-color: #A8C09A; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <svg style="width: 32px; height: 32px; color: #FFFFFF;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 style="color: #2D3436; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
                  Thank You for Your Order!
                </h2>
                <p style="color: #636E72; margin: 0; font-size: 16px;">
                  Your order has been confirmed and is being prepared with care.
                </p>
              </div>

              <!-- Order Number -->
              <div style="background-color: #FDF8F3; border-left: 4px solid #D4A574; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #636E72; font-weight: 500;">
                  Order Number
                </p>
                <p style="margin: 8px 0 0 0; font-size: 20px; color: #2D3436; font-family: 'Courier New', monospace; font-weight: 600;">
                  ${order.orderNumber}
                </p>
              </div>

              <!-- Order Items -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #2D3436; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; border-bottom: 2px solid #F0E6D8; padding-bottom: 10px;">
                  Order Details
                </h3>
                ${order.items.map(item => {
                  const imageUrl = getImageUrl(item.image);
                  // Escape HTML to prevent XSS
                  const escapedName = item.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                  const escapedImageUrl = imageUrl.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                  return `
                  <div style="display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #F0E6D8;">
                    ${imageUrl ? `
                    <div style="flex-shrink: 0; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; background-color: #F0E6D8;">
                      <img src="${escapedImageUrl}" alt="${escapedName}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                    </div>
                    ` : ""}
                    <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <p style="margin: 0; font-size: 16px; color: #2D3436; font-weight: 500;">
                          ${escapedName}
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #636E72;">
                          Quantity: ${item.quantity}
                        </p>
                      </div>
                      <p style="margin: 0; font-size: 16px; color: #2D3436; font-weight: 600;">
                        $${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                `;
                }).join("")}
              </div>

              <!-- Totals -->
              <div style="background-color: #FDF8F3; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #636E72; font-size: 16px;">Subtotal</span>
                  <span style="color: #2D3436; font-size: 16px; font-weight: 500;">$${order.subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #636E72; font-size: 16px;">Shipping</span>
                  <span style="color: #2D3436; font-size: 16px; font-weight: 500;">
                    ${order.shippingCost === 0 ? "Free" : `$${order.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div style="border-top: 2px solid #D4A574; padding-top: 15px; margin-top: 15px; display: flex; justify-content: space-between;">
                  <span style="color: #2D3436; font-size: 18px; font-weight: 600;">Total</span>
                  <span style="color: #2D3436; font-size: 20px; font-weight: 700;">$${order.total.toFixed(2)}</span>
                </div>
              </div>

              <!-- Shipping Address -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #2D3436; margin: 0 0 15px 0; font-size: 20px; font-weight: 600; border-bottom: 2px solid #F0E6D8; padding-bottom: 10px;">
                  Shipping Address
                </h3>
                <div style="color: #636E72; font-size: 16px; line-height: 1.8;">
                  <p style="margin: 0; font-weight: 500; color: #2D3436;">${order.shippingAddress.name}</p>
                  <p style="margin: 4px 0 0 0;">${order.shippingAddress.street}</p>
                  <p style="margin: 4px 0 0 0;">
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
                  </p>
                  <p style="margin: 4px 0 0 0;">${order.shippingAddress.country}</p>
                </div>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #F0E6D8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #2D3436; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  What's Next?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #636E72; font-size: 15px; line-height: 1.8;">
                  <li>We'll prepare your handcrafted soaps with care</li>
                  <li>You'll receive a tracking number when shipped</li>
                  <li>Your order will arrive in 3-5 business days</li>
                </ul>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 30px; border-top: 1px solid #F0E6D8;">
                <p style="margin: 0 0 10px 0; color: #636E72; font-size: 14px;">
                  Questions? Reply to this email or contact us at{" "}
                  <a href="mailto:${fromEmail}" style="color: #D4A574; text-decoration: none; font-weight: 500;">
                    ${fromEmail}
                  </a>
                </p>
                <p style="margin: 0; color: #636E72; font-size: 12px;">
                  © ${new Date().getFullYear()} ${storeName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Order confirmation email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    // Don't throw - email failures shouldn't break order processing
    return null;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("Gmail credentials not configured (GMAIL_USER and GMAIL_APP_PASSWORD), skipping email send");
    return null;
  }

  try {
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Wild Silk Soap Co.";
    const fromEmail = process.env.GMAIL_USER || "";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const info = await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: email,
      subject: `Reset Your Password - ${storeName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2D3436; background-color: #FDF8F3; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #87A96B 0%, #6B8550 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 600; font-family: 'Georgia', serif;">
                ${storeName}
              </h1>
              <p style="color: #FFFFFF; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
                Hand Poured • Skin Loving
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 64px; height: 64px; background-color: #6B4C93; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <svg style="width: 32px; height: 32px; color: #FFFFFF;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 style="color: #2D3436; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
                  Reset Your Password
                </h2>
                <p style="color: #636E72; margin: 0; font-size: 16px;">
                  Hello ${name}, we received a request to reset your password.
                </p>
              </div>

              <!-- Reset Message -->
              <div style="background-color: #FDF8F3; border-left: 4px solid #87A96B; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <p style="margin: 0; font-size: 16px; color: #2D3436; line-height: 1.8;">
                  Click the button below to reset your password. This link will expire in 1 hour for security reasons.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #87A96B 0%, #6B8550 100%); color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  Reset Password
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="margin: 0; color: #636E72; font-size: 14px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 8px 0 0 0; color: #6B4C93; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">
                  ${resetUrl}
                </p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #F0E6D8; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #2D3436; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  Didn't Request This?
                </h3>
                <p style="margin: 0; color: #636E72; font-size: 15px; line-height: 1.8;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged. For security, this link expires in 1 hour.
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 30px; border-top: 1px solid #F0E6D8;">
                <p style="margin: 0 0 10px 0; color: #636E72; font-size: 14px;">
                  Questions? Reply to this email or contact us at{" "}
                  <a href="mailto:${fromEmail}" style="color: #87A96B; text-decoration: none; font-weight: 500;">
                    ${fromEmail}
                  </a>
                </p>
                <p style="margin: 0; color: #636E72; font-size: 12px;">
                  © ${new Date().getFullYear()} ${storeName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Don't throw - email failures shouldn't break the flow
    return null;
  }
}
