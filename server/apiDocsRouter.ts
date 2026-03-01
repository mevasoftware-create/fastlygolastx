import { publicProcedure, router } from "./_core/trpc";
import * as schema from "../drizzle/schema";

/**
 * API Dokümantasyon Router
 * Veritabanı şeması, endpoint'ler ve veri modellerini döndürür
 */
export const apiDocsRouter = router({
  /**
   * GET /api/schema
   * Veritabanı şemasını döndürür
   */
  schema: publicProcedure.query(() => {
    const tables = Object.keys(schema).filter(key => 
      key !== 'User' && key !== 'InsertUser' && 
      !key.startsWith('Insert') && !key.startsWith('Select')
    );

    const schemaInfo = tables.map(tableName => {
      const table = (schema as any)[tableName];
      if (!table || typeof table !== 'object') return null;

      return {
        name: tableName,
        columns: Object.keys(table).filter(key => key !== 'Symbol(drizzle:Name)'),
      };
    }).filter(Boolean);

    return {
      success: true,
      tables: schemaInfo,
      totalTables: schemaInfo.length,
    };
  }),

  /**
   * GET /api/endpoints
   * Tüm API endpoint'lerini listeler
   */
  endpoints: publicProcedure.query(() => {
    const endpoints = [
      // Auth Endpoints
      { method: 'GET', path: '/api/trpc/auth.me', description: 'Get current user info' },
      { method: 'POST', path: '/api/trpc/auth.logout', description: 'Logout current user' },
      
      // Order Endpoints
      { method: 'POST', path: '/api/trpc/order.create', description: 'Create new order' },
      { method: 'GET', path: '/api/trpc/order.myOrders', description: 'Get user orders' },
      { method: 'GET', path: '/api/trpc/order.track', description: 'Track order by ID' },
      
      // Courier Endpoints
      { method: 'POST', path: '/api/trpc/courier.apply', description: 'Apply to be a courier' },
      { method: 'GET', path: '/api/trpc/courier.availableOrders', description: 'Get available orders for courier' },
      { method: 'POST', path: '/api/trpc/courier.acceptOrder', description: 'Accept an order' },
      { method: 'POST', path: '/api/trpc/courier.updateLocation', description: 'Update courier location' },
      
      // Business Endpoints
      { method: 'POST', path: '/api/trpc/business.register', description: 'Register as business' },
      { method: 'GET', path: '/api/trpc/business.orders', description: 'Get business orders' },
      { method: 'POST', path: '/api/trpc/business.requestCourier', description: 'Request courier for delivery' },
      
      // Admin Endpoints
      { method: 'GET', path: '/api/trpc/admin.getPendingCouriers', description: 'Get pending courier applications' },
      { method: 'POST', path: '/api/trpc/admin.approveCourier', description: 'Approve courier application' },
      { method: 'POST', path: '/api/trpc/admin.rejectCourier', description: 'Reject courier application' },
      { method: 'GET', path: '/api/trpc/admin.getPendingBusinesses', description: 'Get pending business registrations' },
      { method: 'POST', path: '/api/trpc/admin.approveBusiness', description: 'Approve business registration' },
      { method: 'POST', path: '/api/trpc/admin.rejectBusiness', description: 'Reject business registration' },
      { method: 'GET', path: '/api/trpc/admin.getAllOrders', description: 'Get all orders (admin)' },
      { method: 'GET', path: '/api/trpc/admin.stats', description: 'Get platform statistics' },
      
      // System Endpoints
      { method: 'POST', path: '/api/trpc/system.notifyOwner', description: 'Send notification to owner' },
      
      // API Documentation Endpoints
      { method: 'GET', path: '/api/trpc/apiDocs.schema', description: 'Get database schema' },
      { method: 'GET', path: '/api/trpc/apiDocs.endpoints', description: 'Get all API endpoints' },
      { method: 'GET', path: '/api/trpc/apiDocs.models', description: 'Get data models' },
    ];

    return {
      success: true,
      endpoints,
      totalEndpoints: endpoints.length,
    };
  }),

  /**
   * GET /api/models
   * Veri modellerini gösterir
   */
  models: publicProcedure.query(() => {
    const models = [
      {
        name: 'User',
        description: 'Platform kullanıcıları',
        fields: [
          { name: 'id', type: 'number', description: 'Unique user ID' },
          { name: 'name', type: 'string', description: 'User name' },
          { name: 'email', type: 'string', description: 'User email' },
          { name: 'phone', type: 'string', description: 'Phone number' },
          { name: 'role', type: 'enum', description: 'User role (admin, user)' },
          { name: 'createdAt', type: 'timestamp', description: 'Account creation date' },
          { name: 'lastSignedIn', type: 'timestamp', description: 'Last login date' },
        ],
      },
      {
        name: 'Courier',
        description: 'Kurye bilgileri',
        fields: [
          { name: 'id', type: 'number', description: 'Unique courier ID' },
          { name: 'userId', type: 'number', description: 'Related user ID' },
          { name: 'vehicleType', type: 'string', description: 'Vehicle type (bike, motorcycle, car)' },
          { name: 'licenseNumber', type: 'string', description: 'License plate number' },
          { name: 'status', type: 'enum', description: 'Status (pending, approved, rejected, active, inactive)' },
          { name: 'rating', type: 'number', description: 'Average rating' },
          { name: 'totalDeliveries', type: 'number', description: 'Total completed deliveries' },
          { name: 'currentLat', type: 'number', description: 'Current latitude' },
          { name: 'currentLng', type: 'number', description: 'Current longitude' },
          { name: 'lastLocationUpdate', type: 'timestamp', description: 'Last location update time' },
        ],
      },
      {
        name: 'Restaurant',
        description: 'İşletme bilgileri',
        fields: [
          { name: 'id', type: 'number', description: 'Unique restaurant ID' },
          { name: 'userId', type: 'number', description: 'Related user ID' },
          { name: 'businessName', type: 'string', description: 'Business name' },
          { name: 'address', type: 'string', description: 'Business address' },
          { name: 'phone', type: 'string', description: 'Business phone' },
          { name: 'status', type: 'enum', description: 'Status (pending, approved, rejected, active)' },
          { name: 'balance', type: 'number', description: 'Account balance' },
          { name: 'debt', type: 'number', description: 'Outstanding debt' },
        ],
      },
      {
        name: 'Order',
        description: 'Sipariş bilgileri',
        fields: [
          { name: 'id', type: 'number', description: 'Unique order ID' },
          { name: 'userId', type: 'number', description: 'Customer user ID' },
          { name: 'courierId', type: 'number', description: 'Assigned courier ID' },
          { name: 'restaurantId', type: 'number', description: 'Restaurant ID (if applicable)' },
          { name: 'pickupAddress', type: 'string', description: 'Pickup address' },
          { name: 'deliveryAddress', type: 'string', description: 'Delivery address' },
          { name: 'pickupLat', type: 'number', description: 'Pickup latitude' },
          { name: 'pickupLng', type: 'number', description: 'Pickup longitude' },
          { name: 'deliveryLat', type: 'number', description: 'Delivery latitude' },
          { name: 'deliveryLng', type: 'number', description: 'Delivery longitude' },
          { name: 'status', type: 'enum', description: 'Order status (pending, accepted, picked_up, delivered, cancelled)' },
          { name: 'price', type: 'number', description: 'Delivery price' },
          { name: 'distance', type: 'number', description: 'Distance in km' },
          { name: 'notes', type: 'string', description: 'Additional notes' },
          { name: 'createdAt', type: 'timestamp', description: 'Order creation time' },
          { name: 'completedAt', type: 'timestamp', description: 'Order completion time' },
        ],
      },
    ];

    return {
      success: true,
      models,
      totalModels: models.length,
    };
  }),
});
