import nodemailer from 'nodemailer';
import { ENV } from './env';

// FastlyGo Brand Colors
const BRAND_COLORS = {
  primary: '#FF6B00',      // Ana turuncu
  primaryDark: '#E55A00',  // Koyu turuncu
  primaryLight: '#FF8C42', // Açık turuncu
  success: '#10B981',      // Yeşil (onay)
  error: '#EF4444',        // Kırmızı (hata)
  text: '#333333',
  textLight: '#666666',
  background: '#FFF7ED',   // Açık turuncu arka plan
  white: '#FFFFFF',
};

// Logo URL (production domain)
const LOGO_URL = 'https://fastlygo.mk/images/fastlygo_gradient_logo.png';
const WEBSITE_URL = 'https://fastlygo.mk';

// Demo SMTP credentials (Ethereal Email - free test service)
const DEMO_SMTP = {
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'kellie.stiedemann@ethereal.email',
    pass: 'nZfGXPKnxQYvPVRKvM',
  },
};

// Create email transporter
let transporter: nodemailer.Transporter;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  // Production SMTP
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[Email] Using production SMTP:', process.env.SMTP_HOST);
} else {
  // Demo SMTP (Ethereal Email)
  console.log('[Email] Using demo SMTP (Ethereal Email) for testing');
  transporter = nodemailer.createTransport(DEMO_SMTP);
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const result = await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || 'FastlyGo'} <${process.env.SMTP_FROM_EMAIL || 'info@fastlygo.mk'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email] Sent to ${options.to}`);
    
    // For demo SMTP, log the preview URL
    if (!process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      console.log(`[Email] Preview: ${previewUrl}`);
    }
    
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

// Base email template with FastlyGo branding
function getBaseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FastlyGo</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${BRAND_COLORS.text};
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: ${BRAND_COLORS.white};
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 10px;
          }
          .header h1 {
            color: ${BRAND_COLORS.white};
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
            background: ${BRAND_COLORS.white};
          }
          .content p {
            margin: 0 0 15px 0;
            color: ${BRAND_COLORS.text};
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%);
            color: ${BRAND_COLORS.white} !important;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
          }
          .button:hover {
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryDark} 0%, ${BRAND_COLORS.primary} 100%);
          }
          .button-success {
            background: linear-gradient(135deg, ${BRAND_COLORS.success} 0%, #059669 100%);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }
          .info-box {
            background: ${BRAND_COLORS.background};
            border-left: 4px solid ${BRAND_COLORS.primary};
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .info-box p {
            margin: 0;
            color: ${BRAND_COLORS.text};
          }
          .feature-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
          }
          .feature-list li {
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
            color: ${BRAND_COLORS.text};
          }
          .feature-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: ${BRAND_COLORS.primary};
            font-weight: bold;
            font-size: 18px;
          }
          .footer {
            background: #f8f8f8;
            padding: 25px;
            text-align: center;
            border-top: 1px solid #eee;
          }
          .footer p {
            margin: 5px 0;
            color: ${BRAND_COLORS.textLight};
            font-size: 13px;
          }
          .footer a {
            color: ${BRAND_COLORS.primary};
            text-decoration: none;
          }
          .social-links {
            margin: 15px 0;
          }
          .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: ${BRAND_COLORS.primary};
            text-decoration: none;
          }
          .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, ${BRAND_COLORS.primary}, transparent);
            margin: 25px 0;
          }
          .highlight {
            color: ${BRAND_COLORS.primary};
            font-weight: 600;
          }
          .success-badge {
            display: inline-block;
            background: ${BRAND_COLORS.success};
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img src="${LOGO_URL}" alt="FastlyGo" class="logo" />
            </div>
            ${content}
            <div class="footer">
              <div class="social-links">
                <a href="https://instagram.com/fastlygoskopje">Instagram</a> |
                <a href="https://twitter.com/fastlygo">Twitter</a> |
                <a href="https://youtube.com/fastlygoskopje">YouTube</a>
              </div>
              <p><a href="${WEBSITE_URL}">fastlygo.mk</a> | <a href="mailto:info@fastlygo.mk">info@fastlygo.mk</a></p>
              <p>📍 Skopje, Macedonia | 📞 +389 71 246 756</p>
              <p style="margin-top: 15px; font-size: 11px;">© 2025 FastlyGo. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Email Verification Template
export function getEmailVerificationTemplate(
  userName: string,
  verificationLink: string
): string {
  const content = `
    <div class="content">
      <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0;">Email Adresinizi Doğrulayın 📧</h2>
      <p>Merhaba <strong>${userName}</strong>,</p>
      <p>FastlyGo'ya kayıt olduğunuz için teşekkürler! Hesabınızı aktifleştirmek için email adresinizi doğrulamanız gerekmektedir.</p>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Email Adresimi Doğrula</a>
      </div>
      
      <div class="info-box">
        <p>⏰ <strong>Bu link 72 saat geçerlidir.</strong></p>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: ${BRAND_COLORS.textLight};">
        Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz. Hesabınız güvende.
      </p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Password Reset Template
export function getPasswordResetTemplate(
  userName: string,
  resetLink: string
): string {
  const content = `
    <div class="content">
      <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0;">Şifre Sıfırlama Talebi 🔐</h2>
      <p>Merhaba <strong>${userName}</strong>,</p>
      <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Şifremi Sıfırla</a>
      </div>
      
      <div class="info-box">
        <p>⏰ <strong>Bu link 24 saat geçerlidir.</strong></p>
        <p style="margin-top: 10px;">Güvenliğiniz için bu linki kimseyle paylaşmayın.</p>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: ${BRAND_COLORS.textLight};">
        Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz. Şifreniz değişmeyecektir.
      </p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Welcome Email Template
export function getWelcomeTemplate(userName: string): string {
  const content = `
    <div class="content">
      <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0;">FastlyGo'ya Hoş Geldiniz! 🎉</h2>
      <p>Merhaba <strong>${userName}</strong>,</p>
      <p>FastlyGo ailesine katıldığınız için çok mutluyuz! Skopje'nin en hızlı ve güvenilir teslimat hizmetine hoş geldiniz.</p>
      
      <h3 style="color: ${BRAND_COLORS.text};">Neler Yapabilirsiniz?</h3>
      <ul class="feature-list">
        <li>15 dakikada hızlı teslimat siparişi verin</li>
        <li>Siparişlerinizi gerçek zamanlı takip edin</li>
        <li>Kurye olarak kazanç sağlayın</li>
        <li>İşletmenizi kaydedin ve siparişleri yönetin</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${WEBSITE_URL}/new-order" class="button">İlk Siparişinizi Verin</a>
      </div>
      
      <div class="divider"></div>
      
      <p>Sorularınız mı var? Bize her zaman <a href="mailto:info@fastlygo.mk" style="color: ${BRAND_COLORS.primary};">info@fastlygo.mk</a> adresinden ulaşabilirsiniz.</p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Courier Approval Template
export function getCourierApprovalTemplate(courierName: string): string {
  const content = `
    <div class="content">
      <div style="text-align: center;">
        <span class="success-badge">✅ ONAYLANDI</span>
        <h2 style="color: ${BRAND_COLORS.success}; margin-top: 15px;">Kurye Başvurunuz Onaylandı! 🎉</h2>
      </div>
      
      <p>Merhaba <strong>${courierName}</strong>,</p>
      <p><strong>Harika haber!</strong> FastlyGo kurye başvurunuz onaylandı. Artık sipariş kabul edebilir ve kazanmaya başlayabilirsiniz!</p>
      
      <h3 style="color: ${BRAND_COLORS.text};">Sonraki Adımlar:</h3>
      <ul class="feature-list">
        <li>Kurye panelinize giriş yapın</li>
        <li>Müsaitlik durumunuzu "Çevrimiçi" yapın</li>
        <li>Bekleyen siparişleri görüntüleyin ve kabul edin</li>
        <li>Teslimatları tamamlayın ve kazancınızı artırın</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${WEBSITE_URL}/courier" class="button button-success">Kurye Paneline Git</a>
      </div>
      
      <div class="info-box">
        <p>💡 <strong>İpucu:</strong> Yoğun saatlerde (11:00-14:00 ve 18:00-21:00) daha fazla sipariş alabilirsiniz!</p>
      </div>
      
      <p style="text-align: center;">Başarılar dileriz! 🚀</p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Courier Rejection Template
export function getCourierRejectionTemplate(courierName: string, reason?: string): string {
  const reasonHtml = reason ? `
        <div class="info-box" style="border-left-color: ${BRAND_COLORS.error};">
          <p><strong>Sebep:</strong> ${reason}</p>
        </div>
      ` : '';
  
  const content = `
    <div class="content">
      <h2 style="color: ${BRAND_COLORS.text}; margin-top: 0;">Kurye Başvurunuz Hakkında</h2>
      <p>Merhaba <strong>${courierName}</strong>,</p>
      <p>Üzgünüz, FastlyGo kurye başvurunuz şu anda onaylanamadı.</p>
      
      ${reasonHtml}
      
      <p>Başvurunuzu tekrar değerlendirmemizi isterseniz veya daha fazla bilgi almak için bizimle iletişime geçebilirsiniz:</p>
      
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 5px 0;">📧 <a href="mailto:info@fastlygo.mk" style="color: ${BRAND_COLORS.primary};">info@fastlygo.mk</a></li>
        <li style="padding: 5px 0;">📞 +389 71 246 756</li>
      </ul>
      
      <div class="divider"></div>
      
      <p>İlginiz için teşekkür ederiz. Gelecekte tekrar başvurmanızı bekliyoruz!</p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Business Approval Template
export function getBusinessApprovalTemplate(businessName: string, contactPerson: string): string {
  const content = `
    <div class="content">
      <div style="text-align: center;">
        <span class="success-badge">✅ ONAYLANDI</span>
        <h2 style="color: ${BRAND_COLORS.success}; margin-top: 15px;">İşletme Başvurunuz Onaylandı! 🎉</h2>
      </div>
      
      <p>Merhaba <strong>${contactPerson}</strong>,</p>
      <p><strong>Harika haber!</strong> <span class="highlight">${businessName}</span> işletmenizin FastlyGo başvurusu onaylandı. Artık teslimat siparişleri oluşturabilirsiniz!</p>
      
      <h3 style="color: ${BRAND_COLORS.text};">Sonraki Adımlar:</h3>
      <ul class="feature-list">
        <li>İşletme panelinize giriş yapın</li>
        <li>Teslimat siparişleri oluşturun</li>
        <li>Siparişlerinizi gerçek zamanlı takip edin</li>
        <li>Aylık raporlarınızı görüntüleyin</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${WEBSITE_URL}/business" class="button button-success">İşletme Paneline Git</a>
      </div>
      
      <div class="info-box">
        <p>💼 <strong>İşletme Avantajları:</strong> Toplu sipariş indirimleri, öncelikli kurye ataması ve özel müşteri desteği!</p>
      </div>
      
      <p style="text-align: center;">İş birliğimizin başarılı olmasını diliyoruz! 🤝</p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Business Rejection Template
export function getBusinessRejectionTemplate(businessName: string, contactPerson: string, reason?: string): string {
  const reasonHtml = reason ? `
        <div class="info-box" style="border-left-color: ${BRAND_COLORS.error};">
          <p><strong>Sebep:</strong> ${reason}</p>
        </div>
      ` : '';
  
  const content = `
    <div class="content">
      <h2 style="color: ${BRAND_COLORS.text}; margin-top: 0;">İşletme Başvurunuz Hakkında</h2>
      <p>Merhaba <strong>${contactPerson}</strong>,</p>
      <p>Üzgünüz, <strong>${businessName}</strong> işletmenizin FastlyGo başvurusu şu anda onaylanamadı.</p>
      
      ${reasonHtml}
      
      <p>Başvurunuzu tekrar değerlendirmemizi isterseniz veya daha fazla bilgi almak için bizimle iletişime geçebilirsiniz:</p>
      
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 5px 0;">📧 <a href="mailto:info@fastlygo.mk" style="color: ${BRAND_COLORS.primary};">info@fastlygo.mk</a></li>
        <li style="padding: 5px 0;">📞 +389 71 246 756</li>
      </ul>
      
      <div class="divider"></div>
      
      <p>İlginiz için teşekkür ederiz.</p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Order Confirmation Template
export function getOrderConfirmationTemplate(
  customerName: string,
  orderNumber: string,
  pickupAddress: string,
  deliveryAddress: string,
  totalFee: number,
  trackingLink: string
): string {
  const content = `
    <div class="content">
      <div style="text-align: center;">
        <span class="success-badge">📦 SİPARİŞ ALINDI</span>
        <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 15px;">Siparişiniz Oluşturuldu!</h2>
      </div>
      
      <p>Merhaba <strong>${customerName}</strong>,</p>
      <p>Siparişiniz başarıyla oluşturuldu ve en kısa sürede bir kurye atanacaktır.</p>
      
      <div class="info-box">
        <p><strong>Sipariş Numarası:</strong> <span class="highlight">${orderNumber}</span></p>
      </div>
      
      <h3 style="color: ${BRAND_COLORS.text};">Sipariş Detayları:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>📍 Alış Adresi:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${pickupAddress}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>🏠 Teslimat Adresi:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${deliveryAddress}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><strong>💰 Toplam Ücret:</strong></td>
          <td style="padding: 10px; color: ${BRAND_COLORS.primary}; font-weight: bold;">${totalFee} MKD</td>
        </tr>
      </table>
      
      <div style="text-align: center;">
        <a href="${trackingLink}" class="button">Siparişi Takip Et</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: ${BRAND_COLORS.textLight};">
        Kurye atandığında ve sipariş durumu değiştiğinde size bildirim göndereceğiz.
      </p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Courier Assigned Template
export function getCourierAssignedTemplate(
  customerName: string,
  orderNumber: string,
  courierName: string,
  courierPhone: string,
  trackingLink: string
): string {
  const content = `
    <div class="content">
      <div style="text-align: center;">
        <span class="success-badge">🏍️ KURYE ATANDI</span>
        <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 15px;">Kuryeniz Yolda!</h2>
      </div>
      
      <p>Merhaba <strong>${customerName}</strong>,</p>
      <p><strong>${orderNumber}</strong> numaralı siparişiniz için bir kurye atandı ve yola çıktı!</p>
      
      <div class="info-box">
        <p><strong>Kurye:</strong> ${courierName}</p>
        <p><strong>Telefon:</strong> <a href="tel:${courierPhone}" style="color: ${BRAND_COLORS.primary};">${courierPhone}</a></p>
      </div>
      
      <div style="text-align: center;">
        <a href="${trackingLink}" class="button">Canlı Takip Et</a>
      </div>
      
      <p style="text-align: center; font-size: 13px; color: ${BRAND_COLORS.textLight};">
        Kuryenizin konumunu harita üzerinden canlı olarak takip edebilirsiniz.
      </p>
    </div>
  `;
  return getBaseTemplate(content);
}

// Delivery Completed Template
export function getDeliveryCompletedTemplate(
  customerName: string,
  orderNumber: string,
  ratingLink: string
): string {
  const content = `
    <div class="content">
      <div style="text-align: center;">
        <span class="success-badge">✅ TESLİM EDİLDİ</span>
        <h2 style="color: ${BRAND_COLORS.success}; margin-top: 15px;">Siparişiniz Teslim Edildi!</h2>
      </div>
      
      <p>Merhaba <strong>${customerName}</strong>,</p>
      <p><strong>${orderNumber}</strong> numaralı siparişiniz başarıyla teslim edildi. FastlyGo'yu tercih ettiğiniz için teşekkür ederiz!</p>
      
      <div class="info-box">
        <p>⭐ <strong>Deneyiminizi değerlendirin!</strong></p>
        <p>Kuryemizi değerlendirerek hizmet kalitemizi artırmamıza yardımcı olun.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${ratingLink}" class="button">Kuryeyi Değerlendir</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="text-align: center;">Bir sonraki siparişinizde görüşmek üzere! 🚀</p>
    </div>
  `;
  return getBaseTemplate(content);
}
