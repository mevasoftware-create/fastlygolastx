export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/brand/fastlygo_icon_only.png";

// Base URL for canonical URLs and SEO
// Always use production domain for SEO purposes (canonical, hreflang)
export const BASE_URL = 'https://fastlygo.mk';

// Custom login page URL
export const getLoginUrl = () => {
  return "/login";
};

// FastlyGo Brand Colors
export const BRAND_COLORS = {
  primary: "#FF6B00", // Orange
  secondary: "#1C1C1C", // Dark Charcoal
  success: "#10B981", // Green
  warning: "#F59E0B", // Amber
  danger: "#EF4444", // Red
} as const;

// Vehicle Types
export const VEHICLE_TYPES = {
  bicycle: "Bisiklet",
  motorcycle: "Motosiklet",
  car: "Otomobil",
  any: "Farketmez",
} as const;

// Order Types
export const ORDER_TYPES = {
  restaurant: "Restoran Teslimati",
  market: "Market Teslimati",
  individual: "Bireysel Kurye",
  express: "Ekspres Gönderi",
} as const;

// Order Status
export const ORDER_STATUS = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  picked_up: "Alindi",
  in_transit: "Yolda",
  delivered: "Teslim Edildi",
  cancelled: "Iptal Edildi",
} as const;

// Pricing Scenarios
export const PRICING_SCENARIOS = {
  A: "Hepsi Bizden (Motor + Şoför + Yakit)",
  B: "Motor Dişaridan",
  C: "Komisyon Modeli",
} as const;

// User Roles
export const USER_ROLES = {
  user: "Müşteri",
  courier: "Kurye",
  restaurant: "Restoran",
  admin: "Yönetici",
} as const;