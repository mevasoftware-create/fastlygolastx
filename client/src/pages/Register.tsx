import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, User, CheckCircle, Shield, Zap, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Register() {
  const { language, isLoading: languageLoading } = useLanguage();
  const [, setLocation] = useLocation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-muted";
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 1) return t('weakPassword', language);
    if (passwordStrength === 2) return t('fairPassword', language);
    if (passwordStrength === 3) return t('goodPassword', language);
    return t('strongPassword', language);
  };

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success(t('accountCreated', language));
      setLocation('/login?email=' + encodeURIComponent(formData.email));
    },
    onError: (error) => {
      toast.error(error.message || t('registrationFailed', language));
      setIsLoading(false);
    },
  });

  const oauthMutation = trpc.auth.googleLogin.useMutation({
    onSuccess: (data) => {
      toast.success(t('accountCreated', language));
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('manus-runtime-user-info', JSON.stringify({
        id: data.userId,
        role: data.role,
        token: data.token,
      }));
      if (data.role === 'courier') {
        setLocation('/courier');
      } else if (data.role === 'business') {
        setLocation('/business');
      } else {
        setLocation('/');
      }
    },
    onError: (error) => {
      toast.error(t('registrationFailed', language));
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
      toast.error(t('registrationFailed', language));
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

  const handleOAuthRegister = (provider: string) => {
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
      toast.info(t('creatingAccount', language));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error(t('fullName', language) + ' ' + t('required', language));
      return;
    }

    if (!validateEmail(formData.email)) {
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t('passwordTooShort', language));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('passwordsDoNotMatch', language));
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error(t('mustAgreeToTerms', language));
      return;
    }

    setIsLoading(true);
    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
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
      {/* Left Side - Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col justify-center p-16 text-white">
          <div className="space-y-8 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              {t('createAccount', language)}
              <span className="block mt-2 text-white/90">{t('createAccountDesc', language)}</span>
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

      {/* Right Side - Form */}
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
        <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-md space-y-6">
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
              <div className="lg:hidden">
                <h1 className="text-2xl font-bold text-foreground">{t('createAccount', language)}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{t('createAccountDesc', language)}</p>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="card-modern p-6 space-y-5">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-semibold text-sm">
                    {t('fullName', language)}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('enterYourName', language)}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-modern pl-12 h-11"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-semibold text-sm">
                    {t('email', language)}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        validateEmail(e.target.value);
                      }}
                      className="input-modern pl-12 h-11"
                      disabled={isLoading}
                    />
                  </div>
                  {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-semibold text-sm">
                    {t('password', language)}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="input-modern pl-12 pr-12 h-11"
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
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? getPasswordStrengthColor() : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{getPasswordStrengthText()}</p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-semibold text-sm">
                    {t('confirmPassword', language)}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input-modern pl-12 pr-12 h-11"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                    disabled={isLoading}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                    {t('iAgreeToThe', language)}{' '}
                    <Link href="/terms">
                      <span className="text-orange-600 hover:text-orange-700 font-medium">
                        {t('termsOfService', language)}
                      </span>
                    </Link>
                    {' '}{t('and', language)}{' '}
                    <Link href="/privacy">
                      <span className="text-orange-600 hover:text-orange-700 font-medium">
                        {t('privacyPolicy', language)}
                      </span>
                    </Link>
                  </label>
                </div>

                {/* Register Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 btn-primary font-semibold rounded-xl text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('creatingAccount', language)}
                    </>
                  ) : (
                    t('createAccount', language)
                  )}
                </Button>
              </div>

              {/* Login Link */}
              <p className="text-center text-muted-foreground">
                {t('alreadyHaveAccount', language)}{' '}
                <Link href="/login">
                  <Button variant="link" className="text-orange-600 hover:text-orange-700 p-0 h-auto font-semibold">
                    {t('signIn', language)}
                  </Button>
                </Link>
              </p>
            </form>
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
