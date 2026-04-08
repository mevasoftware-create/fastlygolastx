import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { NotFoundPage } from "@/pages/ErrorPage";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";

import { Route, Switch, Redirect, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";

// Eager load critical pages for faster initial load
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CategoryPage from "./pages/CategoryPage";
import AreaPage from "./pages/AreaPage";
import Areas from "./pages/Areas";
// Categories sayfası Services ile birleştirildi

// Lazy load non-critical pages to reduce initial bundle
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Services = lazy(() => import("./pages/Services"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const CourierDashboard = lazy(() => import("./pages/CourierDashboard"));
const BusinessRegister = lazy(() => import("./pages/BusinessRegister"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CourierRegister = lazy(() => import("./pages/CourierRegister"));
const Order = lazy(() => import("./pages/Order"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Profile = lazy(() => import("./pages/Profile"));
// CourierMap removed - no longer needed
const ApiDocs = lazy(() => import("./pages/ApiDocs"));

const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ErrorLogs = lazy(() => import("./pages/admin/ErrorLogs"));

const CourierPayments = lazy(() => import("./pages/CourierPayments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  const [location] = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Dynamic Category and Area Pages - MUST be before Home route */}
        <Route path={"/categories/:slug"} component={CategoryPage} />
        <Route path={"/categories"}>{() => { window.location.replace('/services'); return null; }}</Route>
        <Route path={"/areas/:slug"} component={AreaPage} />
        <Route path={"/areas"} component={Areas} />
        
        <Route path={"/"} component={Home} />
        <Route path={"/pending-approval"} component={PendingApproval} />
        {/* CourierMap route removed */}
        <Route path={"/api-docs"} component={ApiDocs} />
        <Route path={"/how-it-works"} component={HowItWorks} />
        <Route path={"/services"} component={Services} />
        <Route path={"/about-us"} component={AboutUs} />

        <Route path="/courier/register" component={CourierRegister} />
        <Route path="/courier/payments" component={CourierPayments} />
        <Route path="/courier" component={CourierDashboard} />
        <Route path={"/business/register"} component={BusinessRegister} />
        <Route path={"/business"} component={BusinessDashboard} />

        <Route path={"/admin/login"} component={AdminLogin} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/admin/*"} component={AdminDashboard} />
        <Route path={"/new-order"} component={Order} />
        <Route path={"/my-orders"} component={MyOrders} />
        <Route path={"/order-history"} component={() => { window.location.href = '/my-orders'; return null; }} />
        <Route path={"/track-order/:orderNumber"} component={TrackOrder} />
        <Route path={"/profile"} component={Profile} />

        <Route path={"/login"} component={Login} />
        <Route path={"/register"} component={Register} />
        <Route path={"/verify-email"} component={VerifyEmail} />
        <Route path={"/forgot-password"} component={ForgotPassword} />
        <Route path={"/reset-password"} component={ResetPassword} />
        <Route path={"/notifications"} component={Notifications} />
        <Route path={"/notification-settings"} component={NotificationSettings} />
        <Route path={"/settings/notifications"} component={NotificationPreferences} />
        <Route path={"/terms-of-service"} component={TermsOfService} />
        <Route path={"/privacy-policy"} component={PrivacyPolicy} />
        <Route path="/404" component={NotFoundPage} />
        {/* Final fallback route */}
        <Route component={NotFoundPage} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider
          defaultTheme="light"
        >
          <TooltipProvider>
            <Toaster />
            <PWAInstallPrompt />
            <PushNotificationPrompt />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
