import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, Package, Shield, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Login() {
  const { language, isLoading: languageLoading } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [, setLocation] = useLocation();

  // Get email from URL params if coming from register page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError(t('invalidEmail', language));
      return false;
    }
    setEmailError("");
    return true;
  };

  const utils = trpc.useUtils();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(t('loginSuccess', language));
      
      // Store token in localStorage for Authorization header
      localStorage.setItem('manus-runtime-user-info', JSON.stringify({
        id: data.userId,
        role: data.role,
        token: data.token,
      }));
      
      // Navigate based on role and approval status
      // Use window.location.href for a full page reload to avoid auth race conditions
      const approvalStatus = (data as any).approvalStatus as string | undefined;
      if (data.role === 'courier') {
        if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
          window.location.href = '/pending-approval';
        } else {
          window.location.href = '/courier';
        }
      } else if (data.role === 'business') {
        if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
          window.location.href = '/pending-approval';
        } else {
          window.location.href = '/business-dashboard';
        }
      } else {
        window.location.href = '/';
      }
    },
    onError: (error) => {
      toast.error(error.message || t('loginFailed', language));
      setIsLoading(false);
    },
  });

  const oauthMutation = trpc.auth.googleLogin.useMutation({
    onSuccess: async (data) => {
      toast.success(t('loginSuccess', language));
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('manus-runtime-user-info', JSON.stringify({
        id: data.userId,
        role: data.role,
        token: data.token,
      }));
      
      // Invalidate auth state to refresh user info
      await utils.auth.me.invalidate();
      
      // Force page reload to ensure all state is fresh
      const oauthApprovalStatus = (data as any).approvalStatus as string | undefined;
      setTimeout(() => {
        if (data.role === 'courier') {
          if (oauthApprovalStatus === 'pending' || oauthApprovalStatus === 'rejected') {
            window.location.href = '/pending-approval';
          } else {
            window.location.href = '/courier';
          }
        } else if (data.role === 'business') {
          if (oauthApprovalStatus === 'pending' || oauthApprovalStatus === 'rejected') {
            window.location.href = '/pending-approval';
          } else {
            window.location.href = '/business-dashboard';
          }
        } else {
          window.location.href = '/';
        }
      }, 100);
    },
    onError: (error) => {
      toast.error(t('loginFailed', language));
      setIsLoading(false);
    },
  });

  const handleGoogleCallback = (response: any) => {
    try {
      const token = response.credential;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      setIsLoading(true);
      oauthMutation.mutateAsync({
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
      });
    } catch (error) {
      toast.error(t('loginFailed', language));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      setTimeout(() => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '',
            callback: handleGoogleCallback,
          });
        }
      }, 100);
    };

    return () => {
      try {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      } catch {
        // Ignore — node already removed
      }
    };
  }, []);

  const handleOAuthLogin = (provider: string) => {
    if (provider === 'google') {
      // Trigger Google Sign-In
      if (window.google) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: open Google Sign-In
            window.google.accounts.id.renderButton(
              document.createElement('div'),
              { theme: 'outline', size: 'large' }
            );
          }
        });
      }
    } else {
      toast.info(t('signingIn', language));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    if (!password) {
      toast.error(t('password', language) + ' ' + t('required', language));
      return;
    }

    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  if (languageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToHome', language)}
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo & Title */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                {APP_LOGO && (
                  <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12 object-contain" />
                )}
                <span className="text-2xl font-bold text-foreground">
                  Fast<span className="text-gradient">ly</span>Go
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('welcomeBack', language)}</h1>
                <p className="text-muted-foreground mt-2">{t('loginDesc', language)}</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="card-modern p-8 space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-semibold">
                    {t('email', language)}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        validateEmail(e.target.value);
                      }}
                      className="input-modern pl-12 h-12"
                      disabled={isLoading}
                    />
                  </div>
                  {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-semibold">
                    {t('password', language)}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-modern pl-12 pr-12 h-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link href="/forgot-password">
                    <Button variant="link" className="text-orange-600 hover:text-orange-700 p-0 h-auto font-medium">
                      {t('forgotPassword', language)}
                    </Button>
                  </Link>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 btn-primary font-semibold rounded-xl text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('signingIn', language)}
                    </>
                  ) : (
                    t('signIn', language)
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">{t('orContinueWith', language)}</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Google */}
                  <Button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoading}
                    variant="outline"
                    className="h-12 rounded-xl border-2 hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </Button>

                  {/* Apple */}
                  <Button
                    type="button"
                    onClick={() => handleOAuthLogin('apple')}
                    disabled={isLoading}
                    className="h-12 bg-foreground hover:bg-foreground/90 text-background rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-muted-foreground">
                {t('dontHaveAccount', language)}{' '}
                <Link href="/register">
                  <Button variant="link" className="text-orange-600 hover:text-orange-700 p-0 h-auto font-semibold">
                    {t('signUp', language)}
                  </Button>
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col justify-center p-16 text-white">
          <div className="space-y-8 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              {t('heroTitle', language)}
              <span className="block mt-2 text-white/90">{t('heroSubtitle', language)}</span>
            </h2>
            
            <div className="space-y-6">
              <FeatureItem 
                icon={<Zap className="w-6 h-6" />}
                title={t('fastDelivery', language)}
                description={t('fastDeliveryDesc', language)}
              />
              <FeatureItem 
                icon={<Shield className="w-6 h-6" />}
                title={t('securePayment', language)}
                description={t('securePaymentDesc', language)}
              />
              <FeatureItem 
                icon={<Package className="w-6 h-6" />}
                title={t('support247', language)}
                description={t('support247Desc', language)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-white/70 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}
