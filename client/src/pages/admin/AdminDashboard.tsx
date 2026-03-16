import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import AdminHome from "./AdminHome";
import { AdminUsersPage as AdminUsers } from "./AdminUsers";
import { OrdersPage } from "./Orders";
import { CouriersPage } from "./Couriers";
import BusinessesPage from "./Businesses";
import { AdminCategories } from "./AdminCategories";
import { AdminAreas } from "./AdminAreas";
import { AdminPages } from "./AdminPages";
import AdminPayments from "./AdminPayments";
import CourierRatings from "./CourierRatings";
import Pricing from "./Pricing";
import RevenueAnalytics from "./RevenueAnalytics";
import SurgePricing from "./SurgePricing";
import AdminNotifications from "./AdminNotifications";
import { ReviewsPage } from "./Reviews";
import AdminMap from "./AdminMap";
import { CustomersPage } from "./Customers";
import ErrorLogs from "./ErrorLogs";
import { AdminCoupons } from "./AdminCoupons";
import { AdminSupport } from "./AdminSupport";
import { AdminSiteSettings } from "./AdminSiteSettings";
import { AdminRedirects } from "./AdminRedirects";
import { AdminReferrals } from "./AdminReferrals";
import { AdminAppVersions } from "./AdminAppVersions";
import AdminSEO from "./AdminSEO";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveOrders, setLiveOrders] = useState<Map<number, any>>(new Map());
  const [courierLocations, setCourierLocations] = useState<Map<number, any>>(new Map());

  useEffect(() => {
    console.log('[AdminDashboard] Auth state:', { loading, user: user ? { email: user.email, role: user.role } : null });
    if (!loading && !user) {
      // Giriş yapmamış kullanıcıları admin login'e yönlendir
      console.log('[AdminDashboard] No user, redirecting to login');
      setLocation("/admin/login");
    } else if (!loading && user && user.role !== "admin") {
      // Giriş yapmış ama admin olmayan kullanıcıları ana sayfaya yönlendir
      console.log('[AdminDashboard] User is not admin, redirecting to home. Role:', user.role);
      setLocation("/");
    } else if (!loading && user && user.role === "admin") {
      console.log('[AdminDashboard] Admin user authenticated successfully');
    }
  }, [user, loading, setLocation]);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const newSocket = io({
      path: "/socket.io",
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("[Admin] Connected to Socket.IO");
      toast.success("Canlı takip aktif");
    });

    newSocket.on("disconnect", () => {
      console.log("[Admin] Disconnected from Socket.IO");
      toast.info("Canlı takip bağlantısı kesildi");
    });

    // Listen for order status updates
    newSocket.on("order:statusUpdated", (data: any) => {
      console.log("[Admin] Order status updated:", data);
      setLiveOrders(prev => new Map(prev).set(data.orderId, data));
      toast.info(`Sipariş #${data.orderId} durumu: ${data.status}`);
    });

    // Listen for courier location updates
    newSocket.on("courier:locationUpdated", (data: any) => {
      console.log("[Admin] Courier location updated:", data);
      setCourierLocations(prev => new Map(prev).set(data.courierId, data));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <AdminDashboardLayout>
      <Switch>
        <Route path="/admin" component={AdminHome} />
        <Route path="/admin/orders" component={OrdersPage} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/couriers" component={CouriersPage} />
        <Route path="/admin/businesses" component={BusinessesPage} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/areas" component={AdminAreas} />
        <Route path="/admin/pages" component={AdminPages} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/pricing" component={Pricing} />
        <Route path="/admin/revenue" component={RevenueAnalytics} />
        <Route path="/admin/surge-pricing" component={SurgePricing} />
        <Route path="/admin/ratings" component={CourierRatings} />

        <Route path="/admin/map" component={AdminMap} />
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/customers" component={CustomersPage} />
        <Route path="/admin/error-logs" component={ErrorLogs} />
        <Route path="/admin/reviews" component={ReviewsPage} />
        <Route path="/admin/coupons" component={AdminCoupons} />
        <Route path="/admin/support" component={AdminSupport} />
        <Route path="/admin/site-settings" component={AdminSiteSettings} />
        <Route path="/admin/redirects" component={AdminRedirects} />
        <Route path="/admin/referrals" component={AdminReferrals} />
        <Route path="/admin/app-versions" component={AdminAppVersions} />
        <Route path="/admin/seo" component={AdminSEO} />
      </Switch>
    </AdminDashboardLayout>
  );
}
