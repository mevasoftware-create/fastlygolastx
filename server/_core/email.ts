import nodemailer from 'nodemailer';

/**
 * Email service for sending transactional emails
 * Uses Gmail SMTP by default, can be configured via environment variables
 */

// Create reusable transporter
const createTransporter = () => {
  // For development, use Ethereal Email (fake SMTP service)
  // For production, use real SMTP credentials from environment variables
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use Ethereal Email (test account)
    // Note: In production, you MUST set SMTP_* environment variables
    console.warn('[Email] No SMTP credentials found. Using test mode (emails will not be sent).');
    
    // For now, return a mock transporter that logs emails instead of sending
    return {
      sendMail: async (options: any) => {
        console.log('[Email] Mock email sent:', {
          to: options.to,
          subject: options.subject,
          text: options.text?.substring(0, 100) + '...',
        });
        return { messageId: 'mock-' + Date.now() };
      },
    } as any;
  }
};

const transporter = createTransporter();

// Email translations for password reset
const emailTranslations = {
  en: {
    subject: 'Password Reset Request - FastlyGo',
    headerTitle: 'FastlyGo',
    headerSubtitle: 'Password Reset Request',
    greeting: 'Hello,',
    message1: 'You have requested to reset your password for your FastlyGo account.',
    message2: 'Please click the button below to reset your password:',
    buttonText: 'Reset Password',
    linkText: 'Or copy and paste this link into your browser:',
    expireText: 'This link will expire in 1 hour.',
    ignoreText: 'If you did not request this password reset, please ignore this email.',
    regards: 'Best regards,',
    teamName: 'FastlyGo Team',
    tagline: 'Fast and Reliable Delivery Solution in Skopje, Macedonia',
    followUs: 'Follow us on social media',
  },
  tr: {
    subject: 'Şifre Sıfırlama Talebi - FastlyGo',
    headerTitle: 'FastlyGo',
    headerSubtitle: 'Şifre Sıfırlama Talebi',
    greeting: 'Merhaba,',
    message1: 'FastlyGo hesabınız için şifre sıfırlama talebinde bulundunuz.',
    message2: 'Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:',
    buttonText: 'Şifreyi Sıfırla',
    linkText: 'Veya bu linki tarayıcınıza kopyalayıp yapıştırın:',
    expireText: 'Bu link 1 saat içinde geçerliliğini yitirecektir.',
    ignoreText: 'Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelin.',
    regards: 'Saygılarımızla,',
    teamName: 'FastlyGo Ekibi',
    tagline: 'Üsküp, Makedonya\'da Hızlı ve Güvenilir Teslimat Çözümü',
    followUs: 'Bizi sosyal medyada takip edin',
  },
  mk: {
    subject: 'Барање за ресетирање на лозинка - FastlyGo',
    headerTitle: 'FastlyGo',
    headerSubtitle: 'Барање за ресетирање на лозинка',
    greeting: 'Здраво,',
    message1: 'Баравте ресетирање на лозинката за вашата FastlyGo сметка.',
    message2: 'Кликнете на копчето подолу за да ја ресетирате лозинката:',
    buttonText: 'Ресетирај лозинка',
    linkText: 'Или копирајте го овој линк во вашиот прелистувач:',
    expireText: 'Овој линк ќе истече за 1 час.',
    ignoreText: 'Ако не го побаравте ова ресетирање, игнорирајте ја оваа е-пошта.',
    regards: 'Со почит,',
    teamName: 'FastlyGo Тим',
    tagline: 'Брзо и сигурно решение за достава во Скопје, Македонија',
    followUs: 'Следете не на социјалните мрежи',
  },
  sq: {
    subject: 'Kërkesa për rivendosjen e fjalëkalimit - FastlyGo',
    headerTitle: 'FastlyGo',
    headerSubtitle: 'Kërkesa për rivendosjen e fjalëkalimit',
    greeting: 'Përshëndetje,',
    message1: 'Keni kërkuar rivendosjen e fjalëkalimit për llogarinë tuaj FastlyGo.',
    message2: 'Klikoni butonin më poshtë për të rivendosur fjalëkalimin:',
    buttonText: 'Rivendos fjalëkalimin',
    linkText: 'Ose kopjoni dhe ngjisni këtë link në shëfletuesin tuaj:',
    expireText: 'Ky link do të skadojë pas 1 ore.',
    ignoreText: 'Nëse nuk e kërkuat këtë rivendosje, injoroni këtë email.',
    regards: 'Me respekt,',
    teamName: 'Ekipi FastlyGo',
    tagline: 'Zgjidhje e shpejtë dhe e besueshme për dorëzim në Shkup, Maqedoni',
    followUs: 'Na ndiqni në rrjetet sociale',
  },
};

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string,
  language: 'en' | 'tr' | 'mk' | 'sq' = 'en'
): Promise<boolean> {
  try {
    // Validate email format
    if (!email || typeof email !== 'string') {
      console.error('[Email] Invalid email parameter:', email);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Email] Invalid email format:', email);
      return false;
    }
    const t = emailTranslations[language] || emailTranslations.en;
    const normalizedEmail = email.toLowerCase();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: normalizedEmail,
      subject: t.subject,
      html: getPasswordResetTemplate(resetToken, resetUrl, language),
      text: `
${t.headerSubtitle}

${t.message1}

${t.message2}
${resetUrl}

${t.expireText}

${t.ignoreText}

${t.regards}
${t.teamName}
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    return false;
  }
}

/**
 * Send password reset success email
 */
export async function sendPasswordResetSuccessEmail(
  email: string
): Promise<boolean> {
  try {
    // Validate email format
    if (!email || typeof email !== 'string') {
      console.error('[Email] Invalid email parameter:', email);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Email] Invalid email format:', email);
      return false;
    }

    const normalizedEmail = email.toLowerCase();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: normalizedEmail,
      subject: 'Password Reset Successful - FastlyGo',
      html: getPasswordResetSuccessTemplate(),
      text: `
Password Reset Successful

Your password has been successfully reset.

If you did not make this change, please contact our support team immediately.

Best regards,
FastlyGo Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Password reset success email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send password reset success email:', error);
    return false;
  }
}

/**
 * HTML template for password reset email with multi-language support
 */
function getPasswordResetTemplate(resetToken: string, resetUrl: string, language: 'en' | 'tr' | 'mk' | 'sq' = 'en'): string {
  const t = emailTranslations[language] || emailTranslations.en;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.headerSubtitle} - FastlyGo</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${t.headerTitle}</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">${t.headerSubtitle}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ${t.greeting}
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ${t.message1}
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ${t.message2}
              </p>
              
              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #666666;">
                ${t.linkText}
              </p>
              <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #FF6B00; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #666666;">
                <strong>${t.expireText}</strong>
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                ${t.ignoreText}
              </p>
            </td>
          </tr>
          
          <!-- Social Media -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #666666;">
                ${t.followUs}
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://www.facebook.com/fastlygo" style="text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/32/733/733547.png" alt="Facebook" width="32" height="32" style="display: block;" />
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.instagram.com/fastlygo.mk" style="text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/32/2111/2111463.png" alt="Instagram" width="32" height="32" style="display: block;" />
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://twitter.com/fastlygo" style="text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/32/733/733579.png" alt="Twitter" width="32" height="32" style="display: block;" />
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.tiktok.com/@fastlygo" style="text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/32/3046/3046121.png" alt="TikTok" width="32" height="32" style="display: block;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                ${t.regards}<br>
                <strong style="color: #FF6B00;">${t.teamName}</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                ${t.tagline}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: email,
      subject: 'Welcome to FastlyGo! 🚀',
      html: getWelcomeTemplate(name),
      text: `
Welcome to FastlyGo!

Hi ${name},

Thank you for joining FastlyGo! We're excited to have you on board.

With FastlyGo, you can:
- Order food delivery from your favorite restaurants
- Send packages across Skopje quickly and safely
- Track your deliveries in real-time

Get started now and experience the fastest delivery service in Skopje!

Best regards,
FastlyGo Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  pickupAddress: string,
  deliveryAddress: string,
  totalPrice: number
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: email,
      subject: `Order Confirmation #${orderNumber} - FastlyGo`,
      html: getOrderConfirmationTemplate(orderNumber, pickupAddress, deliveryAddress, totalPrice),
      text: `
Order Confirmation

Your order #${orderNumber} has been confirmed!

Pickup: ${pickupAddress}
Delivery: ${deliveryAddress}
Total: €${totalPrice.toFixed(2)}

We'll notify you when a courier is assigned to your order.

Track your order: https://fastlygo.mk/track-order/${orderNumber}

Best regards,
FastlyGo Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send order confirmation email:', error);
    return false;
  }
}

/**
 * Send courier assigned email
 */
export async function sendCourierAssignedEmail(
  email: string,
  orderNumber: string,
  courierName: string,
  courierPhone: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: email,
      subject: `Courier Assigned to Order #${orderNumber} - FastlyGo`,
      html: getCourierAssignedTemplate(orderNumber, courierName, courierPhone),
      text: `
Courier Assigned

Good news! A courier has been assigned to your order #${orderNumber}.

Courier: ${courierName}
Phone: ${courierPhone}

Your courier is on the way to pick up your package.

Track your order: https://fastlygo.mk/track-order/${orderNumber}

Best regards,
FastlyGo Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Courier assigned email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send courier assigned email:', error);
    return false;
  }
}

/**
 * Send delivery completed email
 */
export async function sendDeliveryCompletedEmail(
  email: string,
  orderNumber: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: email,
      subject: `Delivery Completed #${orderNumber} - FastlyGo`,
      html: getDeliveryCompletedTemplate(orderNumber),
      text: `
Delivery Completed

Your order #${orderNumber} has been successfully delivered!

Thank you for using FastlyGo. We hope you enjoyed our service.

Please rate your experience: https://fastlygo.mk/orders

Best regards,
FastlyGo Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Delivery completed email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send delivery completed email:', error);
    return false;
  }
}

/**
 * Send courier approval email
 */
export async function sendCourierApprovalEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: email,
      subject: 'Courier Application Approved - FastlyGo',
      html: getCourierApprovalTemplate(name),
      text: `
Courier Application Approved

Congratulations ${name}!

Your courier application has been approved. You can now start accepting delivery orders.

Log in to your courier dashboard to get started: https://fastlygo.mk/courier-dashboard

Welcome to the FastlyGo courier team!

Best regards,
FastlyGo Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Courier approval email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send courier approval email:', error);
    return false;
  }
}

/**
 * Send business approval email
 */
export async function sendBusinessApprovalEmail(
  email: string,
  businessName: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"FastlyGo" <info@fastlygo.mk>',
      to: email,
      subject: 'Business Application Approved - FastlyGo',
      html: getBusinessApprovalTemplate(businessName),
      text: `
Business Application Approved

Congratulations!

Your business "${businessName}" has been approved on FastlyGo.

You can now start creating delivery orders for your business.

Log in to your business dashboard: https://fastlygo.mk/business-dashboard

Welcome to FastlyGo!

Best regards,
FastlyGo Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Business approval email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send business approval email:', error);
    return false;
  }
}

/**
 * HTML template for welcome email
 */
function getWelcomeTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FastlyGo</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🚀 Welcome to FastlyGo!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; color: #333333;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you for joining FastlyGo! We're excited to have you on board.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                With FastlyGo, you can:
              </p>
              <ul style="margin: 0 0 30px 0; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                <li>Order food delivery from your favorite restaurants</li>
                <li>Send packages across Skopje quickly and safely</li>
                <li>Track your deliveries in real-time</li>
              </ul>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 20px 0;">
                    <a href="https://fastlygo.mk" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Best regards,<br>
                <strong style="color: #FF6B00;">FastlyGo Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML template for order confirmation email
 */
function getOrderConfirmationTemplate(
  orderNumber: string,
  pickupAddress: string,
  deliveryAddress: string,
  totalPrice: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✓ Order Confirmed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Your order <strong>#${orderNumber}</strong> has been confirmed!
              </p>
              <table width="100%" cellpadding="10" cellspacing="0" style="margin: 0 0 30px 0; border: 1px solid #eeeeee; border-radius: 6px;">
                <tr>
                  <td style="font-size: 14px; color: #666666; border-bottom: 1px solid #eeeeee;"><strong>Pickup:</strong></td>
                  <td style="font-size: 14px; color: #333333; border-bottom: 1px solid #eeeeee;">${pickupAddress}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #666666; border-bottom: 1px solid #eeeeee;"><strong>Delivery:</strong></td>
                  <td style="font-size: 14px; color: #333333; border-bottom: 1px solid #eeeeee;">${deliveryAddress}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #666666;"><strong>Total:</strong></td>
                  <td style="font-size: 18px; color: #FF6B00; font-weight: bold;">€${totalPrice.toFixed(2)}</td>
                </tr>
              </table>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                We'll notify you when a courier is assigned to your order.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://fastlygo.mk/track-order/${orderNumber}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Track Order
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Best regards,<br>
                <strong style="color: #FF6B00;">FastlyGo Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML template for courier assigned email
 */
function getCourierAssignedTemplate(
  orderNumber: string,
  courierName: string,
  courierPhone: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Courier Assigned</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🚴 Courier Assigned</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Good news! A courier has been assigned to your order <strong>#${orderNumber}</strong>.
              </p>
              <table width="100%" cellpadding="10" cellspacing="0" style="margin: 0 0 30px 0; border: 1px solid #eeeeee; border-radius: 6px;">
                <tr>
                  <td style="font-size: 14px; color: #666666; border-bottom: 1px solid #eeeeee;"><strong>Courier:</strong></td>
                  <td style="font-size: 14px; color: #333333; border-bottom: 1px solid #eeeeee;">${courierName}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #666666;"><strong>Phone:</strong></td>
                  <td style="font-size: 14px; color: #333333;">${courierPhone}</td>
                </tr>
              </table>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Your courier is on the way to pick up your package.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://fastlygo.mk/track-order/${orderNumber}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Track Order
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Best regards,<br>
                <strong style="color: #FF6B00;">FastlyGo Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML template for delivery completed email
 */
function getDeliveryCompletedTemplate(orderNumber: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Completed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✓ Delivery Completed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Your order <strong>#${orderNumber}</strong> has been successfully delivered!
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you for using FastlyGo. We hope you enjoyed our service.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Please take a moment to rate your experience:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://fastlygo.mk/orders" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Rate Your Experience
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Best regards,<br>
                <strong style="color: #FF6B00;">FastlyGo Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML template for courier approval email
 */
function getCourierApprovalTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Courier Application Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 Application Approved!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; color: #333333;">
                Congratulations <strong>${name}</strong>!
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Your courier application has been approved. You can now start accepting delivery orders.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Welcome to the FastlyGo courier team!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://fastlygo.mk/courier-dashboard" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Best regards,<br>
                <strong style="color: #FF6B00;">FastlyGo Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML template for business approval email
 */
function getBusinessApprovalTemplate(businessName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Application Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 Business Approved!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; color: #333333;">
                Congratulations!
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Your business <strong>"${businessName}"</strong> has been approved on FastlyGo.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                You can now start creating delivery orders for your business.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://fastlygo.mk/business-dashboard" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Best regards,<br>
                <strong style="color: #FF6B00;">FastlyGo Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML template for password reset success email
 */
function getPasswordResetSuccessTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful - FastlyGo</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✓ Password Reset Successful</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Hello,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Your password has been successfully reset.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                You can now log in to your FastlyGo account with your new password.
              </p>
              
              <!-- Login Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="https://fastlygo.mk/login" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Go to Login
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
                <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Best regards,<br>
                <strong style="color: #FF6B00;">FastlyGo Team</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                Fast and Reliable Delivery Solution in Skopje, Macedonia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
