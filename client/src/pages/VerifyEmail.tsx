import { useEffect, useState } from 'react';
import { useSearchParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus('success');
      setMessage('Email başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsunuz...');
      toast.success('Email doğrulandı!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: (error: any) => {
      setStatus('error');
      setMessage(error.message || 'Email doğrulama başarısız oldu. Token geçersiz veya süresi dolmuş olabilir.');
      toast.error('Email doğrulama başarısız');
    },
  });

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('Geçersiz doğrulama linki. Email ve token parametreleri gereklidir.');
      return;
    }

    // Auto-verify on mount
    setStatus('loading');
    verifyMutation.mutate({ email, token });
  }, [email, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Doğrulama</CardTitle>
          <CardDescription>Lütfen bekleyiniz...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
              <p className="text-center text-gray-600">Email adresiniz doğrulanıyor...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-green-600 mb-2">Başarılı!</p>
                <p className="text-gray-600">{message}</p>
              </div>
              <Button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Giriş Sayfasına Git
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <div className="text-center">
                <p className="font-semibold text-red-600 mb-2">Hata!</p>
                <p className="text-gray-600 text-sm">{message}</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  className="flex-1"
                >
                  Giriş Sayfasına Git
                </Button>
                <Button
                  onClick={() => window.location.href = '/register'}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Tekrar Kayıt Ol
                </Button>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
              <p className="text-center text-gray-600">Geçersiz doğrulama linki</p>
              <Button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Giriş Sayfasına Git
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
