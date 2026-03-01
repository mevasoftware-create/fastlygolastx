import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Mail, ArrowLeft, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { APP_LOGO, APP_TITLE } from '@/const';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [, navigate] = useLocation();

  // Set page title and noindex meta tag
  useEffect(() => {
    document.title = 'Admin Panel - FastlyGo Yönetim Girişi';
    
    // Add noindex meta tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    return () => {
      // Cleanup: remove noindex meta tag when component unmounts
      try {
        if (metaRobots.parentNode) {
          metaRobots.parentNode.removeChild(metaRobots);
        }
      } catch {
        // Ignore — node already removed
      }
    };
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      console.log('Login response:', data);
      if (data.role === 'admin') {
        // Token'ı localStorage'a kaydet (Authorization header için)
        if (data.token) {
          localStorage.setItem('manus-runtime-user-info', JSON.stringify({
            id: data.userId,
            email: email.trim(),
            role: data.role,
            token: data.token,
          }));
        }
        toast.success('Admin paneline hoş geldiniz!');
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 100);
      } else {
        setError('Bu hesap admin değildir. Lütfen admin hesabı kullanın.');
        toast.error('Admin hesabı gereklidir');
      }
    },
    onError: (error) => {
      const errorMsg = error.message || 'Giriş başarısız. Email ve şifreyi kontrol edin.';
      setError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleLogin called', { email: email.trim(), password });
    setError('');
    setLoading(true);

    try {
      console.log('Calling login mutation...');
      await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });
      console.log('Login mutation succeeded');
    } catch (err) {
      console.error('Login mutation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-orange-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative p-6 z-10 border-b border-orange-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-10 w-10 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 hover:bg-orange-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfa
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center px-4 z-10 py-12">
        <div className="w-full max-w-md">
          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-6">
              <Shield className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-gray-900">Yönetim Paneli</h2>
            </div>
            <p className="text-gray-600">Yönetici hesabınızla giriş yapın</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6 bg-white rounded-2xl shadow-lg p-8 border border-orange-100">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-gray-700 font-semibold">
                E-posta Adresi
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-orange-600" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@fastlygo.app"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="pl-10 h-12 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-gray-700 font-semibold">
                Şifre
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-orange-600" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-10 pr-10 h-12 bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Paneline Gir
                </>
              )}
            </Button>

            {/* Info Text */}
            <p className="text-center text-gray-500 text-sm">
              Yalnızca yetkili yöneticiler giriş yapabilir
            </p>
          </form>

          {/* Security Info */}
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-gray-900 font-semibold mb-1">Güvenli Giriş</h3>
                <p className="text-gray-600 text-sm">
                  Bu panel yalnızca yetkili yöneticilere açıktır. Tüm giriş işlemleri şifrelenmiş bağlantı üzerinden gerçekleştirilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
