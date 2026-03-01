# FastlyGo Mobile App API Guide

## 🌐 Base URL
```
Production: https://fastlygo.manus.space/api/trpc
Development: http://localhost:3000/api/trpc
```

## 🔐 Authentication

FastlyGo uses **Manus OAuth** for authentication with **session cookies**.

### 📱 Mobile OAuth Flow (Recommended)

**Option 1: WebView OAuth (Simplest)**
```
1. Open WebView → https://fastlygo.manus.space/api/oauth/login
2. User completes Manus OAuth login
3. Callback sets session cookie automatically
4. Extract cookie from WebView
5. Use cookie in all API requests
```

**Option 2: QR Code / Deep Link (Advanced)**
```
1. User logs in on web
2. Web calls: auth.getSessionToken()
3. Show QR code or send deep link with token
4. Mobile scans QR / opens deep link
5. Mobile calls: auth.loginWithToken({ token })
6. Session cookie is set
```

### Session Management

- **Session Duration**: 7 days
- **Cookie Name**: `manus_session`
- **Cookie Settings**: 
  - Domain: `.manus.space`
  - Path: `/`
  - Secure: `true` (HTTPS only)
  - HttpOnly: `true`
  - SameSite: `Lax`

---

## 📱 User Roles

FastlyGo has 3 main user types:

1. **Individual Users** (`role: "user"`)
   - Can place individual delivery orders
   - Can track their orders
   
2. **Couriers** (`role: "user"` + courier profile)
   - Can register as courier
   - Can accept and deliver orders
   - Can track earnings
   
3. **Businesses** (`role: "user"` + business profile)
   - Restaurants, markets, pharmacies, etc.
   - Can place bulk orders
   - Have pre-paid balance system

---

## 📦 Order Types

```typescript
type OrderType = 
  | "restaurant"   // Restaurant delivery
  | "market"       // Market/grocery delivery
  | "pharmacy"     // Pharmacy delivery
  | "individual"   // Individual parcel
  | "express"      // Express delivery
```

---

## 🔑 API Endpoints

### Authentication

#### `auth.me`
Get current user information.

**Type**: `query`  
**Auth**: Optional

**Response**:
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
} | null
```

**Example**:
```typescript
const user = await trpc.auth.me.query();
if (user) {
  console.log(`Logged in as ${user.name}`);
}
```

---

#### `auth.checkSession`
Check if current session is valid (for mobile app startup).

**Type**: `query`  
**Auth**: Optional

**Response**:
```typescript
{
  isValid: boolean;
  expiresAt: Date | null;
}
```

**Example**:
```typescript
const session = await trpc.auth.checkSession.query();
if (!session.isValid) {
  // Redirect to login
}
```

---

#### `auth.refreshSession`
Refresh current session to extend expiry.

**Type**: `mutation`  
**Auth**: Required

**Response**:
```typescript
{
  success: boolean;
  expiresAt: Date;
}
```

**Example**:
```typescript
const result = await trpc.auth.refreshSession.mutate();
console.log(`Session extended until ${result.expiresAt}`);
```

---

#### `auth.getSessionToken`
Generate a temporary token for QR code / deep link login.

**Type**: `mutation`  
**Auth**: Required

**Response**:
```typescript
{
  sessionToken: string;  // Base64 encoded token
  expiresAt: Date;       // Token expires in 5 minutes
}
```

**Example**:
```typescript
// On web app
const { sessionToken } = await trpc.auth.getSessionToken.mutate();
const qrCode = generateQRCode(sessionToken);
// Show QR code to user
```

---

#### `auth.loginWithToken`
Login using a session token (from QR code / deep link).

**Type**: `mutation`  
**Auth**: Not required

**Input**:
```typescript
{
  token: string;  // Token from getSessionToken
}
```

**Response**:
```typescript
{
  success: boolean;
  user: User;
}
```

**Example**:
```typescript
// On mobile app
const result = await trpc.auth.loginWithToken.mutate({
  token: scannedToken
});
// Session cookie is now set
```

---

#### `auth.logout`
Logout current user.

**Type**: `mutation`  
**Auth**: Optional

**Response**:
```typescript
{
  success: true;
}
```

---

### Orders

#### `orders.create`
Create a new delivery order.

**Type**: `mutation`  
**Auth**: Required

**Input**:
```typescript
{
  orderType: "restaurant" | "market" | "pharmacy" | "individual" | "express";
  pickupAddress: string;
  pickupLatitude?: string;
  pickupLongitude?: string;
  deliveryAddress: string;
  deliveryLatitude?: string;
  deliveryLongitude?: string;
  packageDescription?: string;
  specialInstructions?: string;
  vehicleType?: "bicycle" | "motorcycle";
  pricingScenario?: "A" | "B" | "C";
}
```

**Response**:
```typescript
{
  success: boolean;
  orderNumber: string;
  orderId: number;
  totalFee: number;  // in cents (EUR)
}
```

---

#### `orders.myOrders`
Get current user's orders.

**Type**: `query`  
**Auth**: Required

**Response**:
```typescript
Array<{
  id: number;
  orderNumber: string;
  orderType: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";
  totalFee: number;  // in cents
  createdAt: Date;
  // ... more fields
}>
```

---

#### `orders.getById`
Get order details by ID.

**Type**: `query`  
**Auth**: Required

**Input**:
```typescript
{
  orderId: number;
}
```

---

#### `orders.cancel`
Cancel an order.

**Type**: `mutation`  
**Auth**: Required

**Input**:
```typescript
{
  orderId: number;
}
```

**Response**:
```typescript
{
  success: boolean;
}
```

---

### Courier

#### `courier.register`
Register as a courier.

**Type**: `mutation`  
**Auth**: Required

**Input**:
```typescript
{
  vehicleType: "bicycle" | "motorcycle";
  vehiclePlate?: string;
  phoneNumber: string;
  address: string;
  city?: string;
  experience?: string;
}
```

---

#### `courier.availableOrders`
Get list of available orders for courier to accept.

**Type**: `query`  
**Auth**: Required (must be courier)

**Response**:
```typescript
Array<Order>
```

---

#### `courier.acceptOrder`
Accept an available order.

**Type**: `mutation`  
**Auth**: Required (must be courier)

**Input**:
```typescript
{
  orderId: number;
}
```

---

#### `courier.updateStatus`
Update order delivery status.

**Type**: `mutation`  
**Auth**: Required (must be courier)

**Input**:
```typescript
{
  orderId: number;
  status: "accepted" | "picked_up" | "delivered";
  latitude?: string;
  longitude?: string;
}
```

---

#### `courier.updateLocation`
Update courier's current location (for live tracking).

**Type**: `mutation`  
**Auth**: Required (must be courier)

**Input**:
```typescript
{
  latitude: string;
  longitude: string;
}
```

---

#### `courier.toggleAvailability`
Toggle courier availability status.

**Type**: `mutation`  
**Auth**: Required (must be courier)

**Input**:
```typescript
{
  isAvailable: boolean;
}
```

---

### Business

#### `business.register`
Register as a business (restaurant, market, pharmacy, etc.).

**Type**: `mutation`  
**Auth**: Required

**Input**:
```typescript
{
  businessName: string;
  businessType: "restaurant" | "market" | "pharmacy" | "other";
  address: string;
  latitude?: string;
  longitude?: string;
  phoneNumber: string;
  taxId?: string;
}
```

---

#### `business.createOrder`
Create an order as a business (deducted from balance).

**Type**: `mutation`  
**Auth**: Required (must be business)

**Input**: Same as `orders.create`

**Response**: Includes `deductedFromBalance` and `remainingBalance`

---

#### `business.getBalance`
Get business account balance.

**Type**: `query`  
**Auth**: Required (must be business)

**Response**:
```typescript
{
  balance: number;        // in cents
  totalDebt: number;      // in cents
  availableCredit: number; // in cents
}
```

---

#### `business.myOrders`
Get business orders.

**Type**: `query`  
**Auth**: Required (must be business)

---

#### `business.getProfile`
Get business profile.

**Type**: `query`  
**Auth**: Required (must be business)

---

#### `business.getTransactions`
Get business transaction history.

**Type**: `query`  
**Auth**: Required (must be business)

---

### Pricing

#### `pricing.calculate`
Calculate delivery price.

**Type**: `query`  
**Auth**: Optional

**Input**:
```typescript
{
  distance: number;        // in meters
  scenario?: "A" | "B" | "C";
}
```

**Response**:
```typescript
{
  distance: number;        // meters
  baseFee: number;         // cents (EUR)
  distanceFee: number;     // cents (EUR)
  totalFee: number;        // cents (EUR)
  estimatedDuration: number; // minutes
}
```

---

### Notifications

#### `notification.myNotifications`
Get user notifications.

**Type**: `query`  
**Auth**: Required

**Input**:
```typescript
{
  limit?: number;      // default: 20
  offset?: number;     // default: 0
  unreadOnly?: boolean; // default: false
}
```

**Response**:
```typescript
{
  notifications: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  total: number;
  unreadCount: number;
}
```

---

#### `notification.markAsRead`
Mark notification as read.

**Type**: `mutation`  
**Auth**: Required

**Input**:
```typescript
{
  notificationId: number;
}
```

---

## ⚠️ Error Handling

All errors follow tRPC format:

```typescript
{
  error: {
    json: {
      message: string;
      code: number;
      data: {
        code: "UNAUTHORIZED" | "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR";
        httpStatus: number;
        path: string;
      }
    }
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED` (401): Not logged in or session expired
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `BAD_REQUEST` (400): Invalid input
- `INTERNAL_SERVER_ERROR` (500): Server error

---

## 💡 Usage Examples

### Flutter/Dart Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class FastlyGoAPI {
  static const baseUrl = 'https://fastlygo.manus.space/api/trpc';
  String? sessionCookie;

  // Check session on app startup
  Future<bool> checkSession() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth.checkSession'),
      headers: {
        'Cookie': sessionCookie ?? '',
      },
    );
    
    final data = json.decode(response.body);
    return data['result']['data']['isValid'];
  }

  // Get current user
  Future<Map?> getCurrentUser() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth.me'),
      headers: {
        'Cookie': sessionCookie ?? '',
      },
    );
    
    final data = json.decode(response.body);
    return data['result']['data'];
  }

  // Create order
  Future<Map> createOrder(Map orderData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders.create'),
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie ?? '',
      },
      body: json.encode(orderData),
    );
    
    return json.decode(response.body);
  }
}
```

---

## 🔄 WebSocket Support

Real-time updates are planned for future versions:
- Live courier location tracking
- Order status updates
- Push notifications

---

## 📞 Support

For API questions or issues:
- **Documentation**: https://fastlygo.manus.space/MOBILE_APP_API_GUIDE.md
- **Base URL**: https://fastlygo.manus.space/api/trpc

---

**Last Updated**: 2025-11-05  
**API Version**: 1.0  
**Status**: ✅ Production Ready
