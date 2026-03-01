import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { COOKIE_NAME } from "@shared/const";
import { IncomingMessage } from "http";
import * as authService from "./authService";
import * as db from "../db";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? ["https://fastlygo.mk"]
        : true, // Allow all origins in development
      credentials: true,
    },
    path: "/socket.io",
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const req = socket.request as IncomingMessage & { headers: { cookie?: string } };
      const cookieHeader = req.headers.cookie;
      
      if (!cookieHeader) {
        return next(new Error("Authentication required"));
      }

      // Parse session cookie
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key.trim()] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      const sessionToken = cookies[COOKIE_NAME];
      
      if (!sessionToken) {
        return next(new Error("Authentication required"));
      }

      // Verify JWT token
      const payload = authService.verifyToken(sessionToken);
      
      if (!payload || !payload.userId) {
        return next(new Error("Invalid session"));
      }

      // Get user from database
      const user = await db.getUserById(payload.userId);
      
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userRole = user.role;
      
      next();
    } catch (error) {
      console.error("[Socket.IO] Authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[Socket.IO] User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-specific room
    if (socket.userRole === "admin") {
      socket.join("admins");
    } else if (socket.userRole === "courier") {
      socket.join("couriers");
    }

    // Courier location update
    socket.on("courier:updateLocation", async (data: { latitude: string; longitude: string; orderId?: number }) => {
      if (socket.userRole !== "courier") {
        socket.emit("error", { message: "Only couriers can update location" });
        return;
      }

      console.log(`[Socket.IO] Courier ${socket.userId} location update:`, data);

      // Broadcast to admins
      io?.to("admins").emit("courier:locationUpdated", {
        courierId: socket.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        orderId: data.orderId,
        timestamp: new Date(),
      });

      // If order is specified, broadcast to customer
      if (data.orderId) {
        io?.to(`order:${data.orderId}`).emit("courier:locationUpdated", {
          courierId: socket.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          orderId: data.orderId,
          timestamp: new Date(),
        });
      }
    });

    // Order status update
    socket.on("order:statusUpdate", async (data: { orderId: number; status: string }) => {
      console.log(`[Socket.IO] Order ${data.orderId} status update:`, data.status);

      // Broadcast to order room (customer + courier + admins)
      io?.to(`order:${data.orderId}`).emit("order:statusUpdated", {
        orderId: data.orderId,
        status: data.status,
        timestamp: new Date(),
      });

      // Broadcast to admins
      io?.to("admins").emit("order:statusUpdated", {
        orderId: data.orderId,
        status: data.status,
        timestamp: new Date(),
      });
    });

    // Join order room (for real-time tracking)
    socket.on("order:join", (orderId: number) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket.IO] User ${socket.userId} joined order room: ${orderId}`);
    });

    // Leave order room
    socket.on("order:leave", (orderId: number) => {
      socket.leave(`order:${orderId}`);
      console.log(`[Socket.IO] User ${socket.userId} left order room: ${orderId}`);
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`[Socket.IO] User disconnected: ${socket.userId}`);
    });
  });

  console.log("[Socket.IO] Server initialized");
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Helper functions to emit events from backend
export function emitToUser(userId: number, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToOrder(orderId: number, event: string, data: any) {
  io?.to(`order:${orderId}`).emit(event, data);
}

export function emitToAdmins(event: string, data: any) {
  io?.to("admins").emit(event, data);
}

export function emitToCouriers(event: string, data: any) {
  io?.to("couriers").emit(event, data);
}
