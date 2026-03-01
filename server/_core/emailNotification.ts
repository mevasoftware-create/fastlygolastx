import { ENV } from "./env";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Manus built-in email API (if available)
 * For now, this is a placeholder - you can integrate with SendGrid, AWS SES, or other email services
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log the email
    console.log(`[Email] Would send email to ${payload.to}:`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body: ${payload.html.substring(0, 100)}...`);
    
    // In production, use an email service:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: payload.to }] }],
    //     from: { email: 'noreply@fastlygo.app', name: 'FastlyGo' },
    //     subject: payload.subject,
    //     content: [{ type: 'text/html', value: payload.html }],
    //   }),
    // });
    
    return true;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(
  userEmail: string,
  orderNumber: string,
  status: string,
  trackingUrl: string
): Promise<boolean> {
  const statusMessages: Record<string, { subject: string; title: string; message: string }> = {
    pending: {
      subject: "Siparişiniz Oluşturuldu",
      title: "Sipariş Oluşturuldu",
      message: "Siparişiniz başarıyla oluşturuldu. Kurye araması yapılıyor...",
    },
    accepted: {
      subject: "Siparişiniz Kabul Edildi",
      title: "Kurye Atandı",
      message: "Kuryeniz siparişinizi kabul etti ve yola çıkıyor.",
    },
    picked_up: {
      subject: "Sipariş Alındı",
      title: "Sipariş Alındı",
      message: "Kuryeniz siparişinizi aldı ve size doğru yola çıktı.",
    },
    in_transit: {
      subject: "Sipariş Yolda",
      title: "Sipariş Yolda",
      message: "Kuryeniz size doğru geliyor. Canlı takip için aşağıdaki linke tıklayın.",
    },
    delivered: {
      subject: "Sipariş Teslim Edildi",
      title: "Teslim Edildi",
      message: "Siparişiniz başarıyla teslim edildi. Bizi tercih ettiğiniz için teşekkürler!",
    },
    cancelled: {
      subject: "Sipariş İptal Edildi",
      title: "İptal Edildi",
      message: "Siparişiniz iptal edildi.",
    },
  };

  const notification = statusMessages[status];
  if (!notification) {
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: #fff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .order-info {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .order-info p {
          margin: 10px 0;
        }
        .order-info strong {
          color: #FF6B00;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          background: #FF6B00;
          color: white;
          border-radius: 20px;
          font-weight: bold;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #FF6B00;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background: #FF8C00;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e0e0e0;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚀 FastlyGo</h1>
        <p>Hızlı ve Güvenilir Teslimat</p>
      </div>
      
      <div class="content">
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        
        <div class="order-info">
          <p><strong>Sipariş Numarası:</strong> ${orderNumber}</p>
          <p><strong>Durum:</strong> <span class="status-badge">${notification.title}</span></p>
        </div>
        
        ${status !== 'cancelled' && status !== 'delivered' ? `
          <a href="${trackingUrl}" class="button">Siparişi Takip Et</a>
        ` : ''}
        
        <p style="margin-top: 30px;">
          Herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin.
        </p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} FastlyGo. Tüm hakları saklıdır.</p>
        <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `FastlyGo - ${notification.subject}`,
    html,
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>FastlyGo'ya Hoş Geldiniz</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%);
          color: white;
          padding: 40px;
          text-align: center;
          border-radius: 10px;
        }
        .content {
          padding: 30px 0;
        }
        .feature {
          padding: 15px;
          margin: 10px 0;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #FF6B00;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚀 FastlyGo'ya Hoş Geldiniz!</h1>
        <p>Merhaba ${userName},</p>
      </div>
      
      <div class="content">
        <p>FastlyGo ailesine katıldığınız için teşekkür ederiz! Artık hızlı ve güvenilir teslimat hizmetimizden yararlanabilirsiniz.</p>
        
        <h3>Neler Yapabilirsiniz?</h3>
        
        <div class="feature">
          <strong>📦 Hızlı Sipariş</strong>
          <p>Birkaç tıklama ile sipariş oluşturun ve kuryenizin gelişini takip edin.</p>
        </div>
        
        <div class="feature">
          <strong>🗺️ Canlı Takip</strong>
          <p>Kuryenizin konumunu gerçek zamanlı olarak haritada görün.</p>
        </div>
        
        <div class="feature">
          <strong>💳 Güvenli Ödeme</strong>
          <p>Kredi kartı veya nakit ödeme seçenekleriyle güvenle ödeyin.</p>
        </div>
        
        <a href="https://fastlygo.com" class="button">Hemen Sipariş Ver</a>
        
        <p style="margin-top: 30px;">
          İyi teslimatlar dileriz!<br>
          <strong>FastlyGo Ekibi</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject: "FastlyGo'ya Hoş Geldiniz!",
    html,
  });
}
