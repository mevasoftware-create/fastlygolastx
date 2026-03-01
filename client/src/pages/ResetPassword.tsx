import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

// Translations for Reset Password page
const translations = {
  en: {
    title: 'Reset Password',
    description: 'Enter your new password',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'At least 8 characters',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter your password again',
    resetButton: 'Reset Password',
    resetting: 'Resetting...',
    goToLogin: 'Go to Login',
    passwordResetting: 'Resetting your password...',
    success: 'Success!',
    successMessage: 'Your password has been reset successfully! Redirecting to login page...',
    error: 'Error!',
    tryAgain: 'Try Again',
    invalidLink: 'Invalid password reset link. Email and token parameters are required.',
    enterPasswords: 'Please enter password and confirmation',
    passwordMinLength: 'Password must be at least 8 characters',
    passwordsNotMatch: 'Passwords do not match',
    invalidRequest: 'Invalid request',
    resetSuccess: 'Password reset!',
    resetFailed: 'Password reset failed',
    resetFailedMessage: 'Password reset failed. Token may be invalid or expired.',
  },
  tr: {
    title: 'Şifre Sıfırlama',
    description: 'Yeni şifrenizi girin',
    newPassword: 'Yeni Şifre',
    newPasswordPlaceholder: 'En az 8 karakter',
    confirmPassword: 'Şifre Onayı',
    confirmPasswordPlaceholder: 'Şifrenizi tekrar girin',
    resetButton: 'Şifremi Sıfırla',
    resetting: 'Sıfırlanıyor...',
    goToLogin: 'Giriş Sayfasına Git',
    passwordResetting: 'Şifreniz sıfırlanıyor...',
    success: 'Başarılı!',
    successMessage: 'Şifreniz başarıyla sıfırlandı! Giriş sayfasına yönlendiriliyorsunuz...',
    error: 'Hata!',
    tryAgain: 'Tekrar Dene',
    invalidLink: 'Geçersiz şifre sıfırlama linki. Email ve token parametreleri gereklidir.',
    enterPasswords: 'Lütfen şifreyi ve onayını girin',
    passwordMinLength: 'Şifre en az 8 karakter olmalıdır',
    passwordsNotMatch: 'Şifreler eşleşmiyor',
    invalidRequest: 'Geçersiz istek',
    resetSuccess: 'Şifre sıfırlandı!',
    resetFailed: 'Şifre sıfırlama başarısız',
    resetFailedMessage: 'Şifre sıfırlama başarısız oldu. Token geçersiz veya süresi dolmuş olabilir.',
  },
  mk: {
    title: 'Ресетирање на лозинка',
    description: 'Внесете ја вашата нова лозинка',
    newPassword: 'Нова лозинка',
    newPasswordPlaceholder: 'Најмалку 8 карактери',
    confirmPassword: 'Потврди лозинка',
    confirmPasswordPlaceholder: 'Внесете ја лозинката повторно',
    resetButton: 'Ресетирај лозинка',
    resetting: 'Се ресетира...',
    goToLogin: 'Оди на најава',
    passwordResetting: 'Вашата лозинка се ресетира...',
    success: 'Успешно!',
    successMessage: 'Вашата лозинка е успешно ресетирана! Се пренасочувате на страницата за најава...',
    error: 'Грешка!',
    tryAgain: 'Обиди се повторно',
    invalidLink: 'Невалиден линк за ресетирање. Потребни се параметри за е-пошта и токен.',
    enterPasswords: 'Ве молиме внесете лозинка и потврда',
    passwordMinLength: 'Лозинката мора да има најмалку 8 карактери',
    passwordsNotMatch: 'Лозинките не се совпаѓаат',
    invalidRequest: 'Невалидно барање',
    resetSuccess: 'Лозинката е ресетирана!',
    resetFailed: 'Ресетирањето на лозинката не успеа',
    resetFailedMessage: 'Ресетирањето на лозинката не успеа. Токенот може да е невалиден или истечен.',
  },
  sq: {
    title: 'Rivendos fjalëkalimin',
    description: 'Shkruani fjalëkalimin tuaj të ri',
    newPassword: 'Fjalëkalimi i ri',
    newPasswordPlaceholder: 'Të paktën 8 karaktere',
    confirmPassword: 'Konfirmo fjalëkalimin',
    confirmPasswordPlaceholder: 'Shkruani fjalëkalimin përsëri',
    resetButton: 'Rivendos fjalëkalimin',
    resetting: 'Duke rivendosur...',
    goToLogin: 'Shko te hyrja',
    passwordResetting: 'Fjalëkalimi juaj po rivendoset...',
    success: 'Sukses!',
    successMessage: 'Fjalëkalimi juaj u rivendos me sukses! Po ridrejtoheni te faqja e hyrjes...',
    error: 'Gabim!',
    tryAgain: 'Provo përsëri',
    invalidLink: 'Link i pavlefshëm për rivendosjen. Kërkohen parametrat e emailit dhe tokenit.',
    enterPasswords: 'Ju lutem shkruani fjalëkalimin dhe konfirmimin',
    passwordMinLength: 'Fjalëkalimi duhet të ketë të paktën 8 karaktere',
    passwordsNotMatch: 'Fjalëkalimet nuk përputhen',
    invalidRequest: 'Kërkesë e pavlefshme',
    resetSuccess: 'Fjalëkalimi u rivendos!',
    resetFailed: 'Rivendosja e fjalëkalimit dështoi',
    resetFailedMessage: 'Rivendosja e fjalëkalimit dështoi. Tokeni mund të jetë i pavlefshëm ose i skaduar.',
  },
};

export default function ResetPassword() {
  const { language } = useTranslation();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get URL parameters from window.location
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setStatus('success');
      setMessage(t.successMessage);
      toast.success(t.resetSuccess);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: (error: any) => {
      setStatus('error');
      setMessage(error.message || t.resetFailedMessage);
      toast.error(t.resetFailed);
    },
  });

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage(t.invalidLink);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error(t.enterPasswords);
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t.passwordsNotMatch);
      return;
    }

    if (!email || !token) {
      toast.error(t.invalidRequest);
      return;
    }

    setStatus('loading');
    resetMutation.mutate({
      email,
      token,
      newPassword,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.newPassword}
                </label>
                <Input
                  type="password"
                  placeholder={t.newPasswordPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.confirmPassword}
                </label>
                <Input
                  type="password"
                  placeholder={t.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.resetting}
                  </>
                ) : (
                  t.resetButton
                )}
              </Button>

              <Button
                type="button"
                onClick={() => window.location.href = '/login'}
                variant="outline"
                className="w-full"
              >
                {t.goToLogin}
              </Button>
            </form>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
              <p className="text-center text-gray-600">{t.passwordResetting}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-green-600 mb-2">{t.success}</p>
                <p className="text-gray-600">{message}</p>
              </div>
              <Button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {t.goToLogin}
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <div className="text-center">
                <p className="font-semibold text-red-600 mb-2">{t.error}</p>
                <p className="text-gray-600 text-sm">{message}</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  className="flex-1"
                >
                  {t.goToLogin}
                </Button>
                <Button
                  onClick={() => window.location.href = '/forgot-password'}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {t.tryAgain}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
