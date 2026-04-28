/**
 * FCM Token Manager - Otomatik OAuth2 Token Yenileme
 *
 * Firebase Cloud Messaging için Google Service Account kullanarak
 * OAuth2 access token'larını otomatik olarak yeniler.
 *
 * Kullanım:
 *   1. Firebase Console > Project Settings > Service Accounts > Generate new private key
 *   2. İndirilen JSON dosyasının içeriğini FCM_SERVICE_ACCOUNT_JSON secret'ına yapıştırın
 *   3. Bu modül her 50 dakikada bir token'ı otomatik yeniler (token 60 dk geçerli)
 *
 * Fallback:
 *   Service Account yoksa FCM_ACCESS_TOKEN env değişkenini kullanır (manuel yenileme gerekir)
 */

import { GoogleAuth } from "google-auth-library";

const FCM_SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp ms
}

let tokenCache: TokenCache | null = null;
let googleAuth: GoogleAuth | null = null;
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Secret olarak saklanan JSON'da literal \n karakterleri olabilir.
 * Bu fonksiyon bu durumu düzelterek geçerli bir JSON nesnesi döndürür.
 */
function parseServiceAccountJson(raw: string): object | null {
  // Önce doğrudan parse dene
  try {
    return JSON.parse(raw);
  } catch {
    // Literal \n karakterlerini gerçek newline'lara çevir,
    // ardından string değerleri içindeki newline'ları tekrar escape et
    try {
      const step1 = raw.replace(/\\n/g, "\n");
      const fixed = step1.replace(/"([^"]*)"/g, (_match: string, inner: string) => {
        return '"' + inner.replace(/\n/g, "\\n") + '"';
      });
      return JSON.parse(fixed);
    } catch (err2) {
      console.error("[FCM TokenManager] Failed to parse FCM_SERVICE_ACCOUNT_JSON (both attempts):", err2);
      return null;
    }
  }
}

/**
 * Service Account JSON'dan GoogleAuth instance oluştur
 */
function initGoogleAuth(): GoogleAuth | null {
  const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return null;
  }

  try {
    const credentials = parseServiceAccountJson(serviceAccountJson);
    if (!credentials) return null;
    return new GoogleAuth({
      credentials,
      scopes: FCM_SCOPES,
    });
  } catch (err) {
    console.error("[FCM TokenManager] Failed to initialize GoogleAuth:", err);
    return null;
  }
}

/**
 * Service Account kullanarak yeni access token al
 */
async function fetchNewToken(): Promise<string | null> {
  if (!googleAuth) {
    googleAuth = initGoogleAuth();
  }

  if (!googleAuth) {
    // Service Account yok, env'den al
    return process.env.FCM_ACCESS_TOKEN || null;
  }

  try {
    const client = await googleAuth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    if (!token) {
      console.error("[FCM TokenManager] Empty token received from Google Auth");
      return null;
    }

    // Token'ı cache'e al (50 dakika geçerli say, 60 dakika gerçek süre)
    tokenCache = {
      token,
      expiresAt: Date.now() + 50 * 60 * 1000, // 50 dakika
    };

    console.log("[FCM TokenManager] Token renewed successfully, expires in 50 minutes");
    return token;
  } catch (err) {
    console.error("[FCM TokenManager] Failed to fetch token:", err);
    return null;
  }
}

/**
 * Otomatik token yenileme timer'ını başlat
 */
function startAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  // Her 45 dakikada bir yenile (50 dakika cache süresi, 5 dakika önceden)
  refreshTimer = setInterval(async () => {
    console.log("[FCM TokenManager] Auto-refreshing token...");
    await fetchNewToken();
  }, 45 * 60 * 1000);

  console.log("[FCM TokenManager] Auto-refresh started (every 45 minutes)");
}

/**
 * Geçerli FCM access token'ını döndür
 * Cache'de geçerli token varsa onu kullan, yoksa yenile
 */
export async function getFcmAccessToken(): Promise<string | null> {
  // Cache'de geçerli token var mı?
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // Service Account varsa yeni token al
  const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return await fetchNewToken();
  }

  // Fallback: env'deki manuel token
  const manualToken = process.env.FCM_ACCESS_TOKEN;
  if (manualToken) {
    console.warn("[FCM TokenManager] Using manual FCM_ACCESS_TOKEN (expires in ~1 hour, needs manual refresh)");
    return manualToken;
  }

  return null;
}

/**
 * FCM sistemini başlat
 * Server startup'ında çağrılmalı
 */
export async function initFcmTokenManager(): Promise<void> {
  const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    console.log("[FCM TokenManager] Service Account found, initializing auto-refresh...");
    googleAuth = initGoogleAuth();

    if (googleAuth) {
      // İlk token'ı al
      await fetchNewToken();
      // Otomatik yenilemeyi başlat
      startAutoRefresh();
      console.log("[FCM TokenManager] ✅ Auto-refresh active - tokens will renew every 45 minutes");
    } else {
      console.error("[FCM TokenManager] ❌ Failed to initialize GoogleAuth from Service Account JSON");
    }
  } else if (process.env.FCM_ACCESS_TOKEN) {
    console.log("[FCM TokenManager] ⚠️  Using manual FCM_ACCESS_TOKEN (no Service Account configured)");
    console.log("[FCM TokenManager] To enable auto-refresh, add FCM_SERVICE_ACCOUNT_JSON secret");
  } else {
    console.log("[FCM TokenManager] ❌ No FCM credentials configured (FCM_ACCESS_TOKEN or FCM_SERVICE_ACCOUNT_JSON)");
  }
}

/**
 * FCM'in kullanılabilir olup olmadığını kontrol et
 */
export function isFcmAvailable(): boolean {
  return !!(process.env.FCM_SERVICE_ACCOUNT_JSON || process.env.FCM_ACCESS_TOKEN);
}

/**
 * Token durumunu döndür (admin panel için)
 */
export async function getFcmTokenStatus(): Promise<{
  configured: boolean;
  method: "service_account" | "manual_token" | "none";
  tokenValid: boolean;
  expiresIn?: number; // saniye
}> {
  const hasServiceAccount = !!process.env.FCM_SERVICE_ACCOUNT_JSON;
  const hasManualToken = !!process.env.FCM_ACCESS_TOKEN;

  if (!hasServiceAccount && !hasManualToken) {
    return { configured: false, method: "none", tokenValid: false };
  }

  if (hasServiceAccount) {
    const token = await getFcmAccessToken();
    const expiresIn = tokenCache ? Math.floor((tokenCache.expiresAt - Date.now()) / 1000) : 0;
    return {
      configured: true,
      method: "service_account",
      tokenValid: !!token,
      expiresIn: expiresIn > 0 ? expiresIn : 0,
    };
  }

  return {
    configured: true,
    method: "manual_token",
    tokenValid: true,
    expiresIn: undefined, // Manuel token için bilinmiyor
  };
}
