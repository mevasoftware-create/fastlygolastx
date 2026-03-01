import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'wouter';
import { useTranslation } from '@/lib/i18n';

// Translations for Forgot Password page
const translations = {
  en: {
    title: 'Forgot Password',
    description: 'Enter your email address and we will send you a password reset link',
    emailLabel: 'Email Address',
    emailPlaceholder: 'example@email.com',
    sendButton: 'Send Password Reset Link',
    sending: 'Sending...',
    backToLogin: 'Back to Login',
    emailSending: 'Sending email...',
    emailSent: 'Email Sent!',
    successMessage: 'A password reset link has been sent to your email address. Please check your inbox.',
    checkSpam: "Didn't receive the email? Check your spam folder.",
    error: 'Error!',
    tryAgain: 'Try Again',
    goBack: 'Go Back',
    enterEmail: 'Please enter your email address',
    invalidEmail: 'Please enter a valid email address',
    emailSentToast: 'Email sent!',
    emailFailedToast: 'Failed to send email',
    genericError: 'An error occurred. Please try again later.',
  },
  tr: {
    title: 'Şifremi Unuttum',
    description: 'Email adresinizi girin, size şifre sıfırlama linki gönderelim',
    emailLabel: 'Email Adresi',
    emailPlaceholder: 'ornek@email.com',
    sendButton: 'Şifre Sıfırlama Linki Gönder',
    sending: 'Gönderiliyor...',
    backToLogin: 'Giriş Sayfasına Dön',
    emailSending: 'Email gönderiliyor...',
    emailSent: 'Email Gönderildi!',
    successMessage: 'Şifre sıfırlama linki email adresinize gönderildi. Lütfen email kutunuzu kontrol edin.',
    checkSpam: 'Email gelmedi mi? Spam klasörünü kontrol edin.',
    error: 'Hata!',
    tryAgain: 'Tekrar Dene',
    goBack: 'Geri Dön',
    enterEmail: 'Lütfen email adresinizi girin',
    invalidEmail: 'Geçerli bir email adresi girin',
    emailSentToast: 'Email gönderildi!',
    emailFailedToast: 'Email gönderilemedi',
    genericError: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
  },
  mk: {
    title: 'Ја заборавив лозинката',
    description: 'Внесете ја вашата е-пошта и ќе ви испратиме линк за ресетирање на лозинката',
    emailLabel: 'Е-пошта',
    emailPlaceholder: 'primer@email.com',
    sendButton: 'Испрати линк за ресетирање',
    sending: 'Се испраќа...',
    backToLogin: 'Назад кон најава',
    emailSending: 'Се испраќа е-пошта...',
    emailSent: 'Е-поштата е испратена!',
    successMessage: 'Линк за ресетирање на лозинката е испратен на вашата е-пошта. Проверете го вашето сандаче.',
    checkSpam: 'Не ја добивте е-поштата? Проверете го спам фолдерот.',
    error: 'Грешка!',
    tryAgain: 'Обиди се повторно',
    goBack: 'Назад',
    enterEmail: 'Ве молиме внесете ја вашата е-пошта',
    invalidEmail: 'Внесете валидна е-пошта',
    emailSentToast: 'Е-поштата е испратена!',
    emailFailedToast: 'Неуспешно испраќање на е-пошта',
    genericError: 'Настана грешка. Обидете се повторно подоцна.',
  },
  sq: {
    title: 'Kam harruar fjalëkalimin',
    description: 'Shkruani adresën tuaj të emailit dhe do t\'ju dërgojmë një link për rivendosjen e fjalëkalimit',
    emailLabel: 'Adresa e emailit',
    emailPlaceholder: 'shembull@email.com',
    sendButton: 'Dërgo linkun e rivendosjes',
    sending: 'Duke dërguar...',
    backToLogin: 'Kthehu te hyrja',
    emailSending: 'Duke dërguar email...',
    emailSent: 'Emaili u dërgua!',
    successMessage: 'Linku për rivendosjen e fjalëkalimit u dërgua në adresën tuaj të emailit. Kontrolloni kutinë tuaj postare.',
    checkSpam: 'Nuk e morët emailin? Kontrolloni dosjen e spam.',
    error: 'Gabim!',
    tryAgain: 'Provo përsëri',
    goBack: 'Kthehu',
    enterEmail: 'Ju lutem shkruani adresën tuaj të emailit',
    invalidEmail: 'Shkruani një adresë emaili të vlefshme',
    emailSentToast: 'Emaili u dërgua!',
    emailFailedToast: 'Dështoi dërgimi i emailit',
    genericError: 'Ndodhi një gabim. Ju lutem provoni përsëri më vonë.',
  },
};

export default function ForgotPassword() {
  const { language } = useTranslation();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setStatus('success');
      setMessage(t.successMessage);
      toast.success(t.emailSentToast);
    },
    onError: (error: any) => {
      setStatus('error');
      setMessage(error.message || t.genericError);
      toast.error(t.emailFailedToast);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t.enterEmail);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t.invalidEmail);
      return;
    }

    setStatus('loading');
    forgotMutation.mutate({ email: email.toLowerCase(), language: language as 'en' | 'tr' | 'mk' | 'sq' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <CardDescription>
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.emailLabel}
                </label>
                <Input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={forgotMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {forgotMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  t.sendButton
                )}
              </Button>

              <Link href="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.backToLogin}
                </Button>
              </Link>
            </form>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
              <p className="text-center text-gray-600">{t.emailSending}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-green-600 mb-2">{t.emailSent}</p>
                <p className="text-gray-600 text-sm">{message}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {t.checkSpam}
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  {t.backToLogin}
                </Button>
              </Link>
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
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t.goBack}
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setStatus('form');
                    setMessage('');
                  }}
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
