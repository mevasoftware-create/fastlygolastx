import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { Loader2, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface QuickSignupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickSignup({ open, onOpenChange }: QuickSignupProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success('Kayıt başarılı! Email adresinizi doğrulayın.');
      setLocation('/verify-email');
    },
    onError: (error) => {
      toast.error(error.message || 'Kayıt başarısız');
      setIsLoading(false);
    },
  });

  const handleQuickSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setIsLoading(true);
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
    
    registerMutation.mutate({
      email,
      name,
      password: tempPassword,
    });
  };

  const handleGoogleSignup = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Hızlı Kayıt</DialogTitle>
          <DialogDescription className="text-center">
            Sadece 2 adımda hesap oluşturun ve siparişinizi verin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Sign Up */}
          <Button
            onClick={handleGoogleSignup}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2"
            disabled={isLoading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google ile Devam Et
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">veya email ile</span>
            </div>
          </div>

          {/* Quick Email Signup */}
          <form onSubmit={handleQuickSignup} className="space-y-3">
            <div>
              <Label htmlFor="quick-name" className="text-sm font-medium">
                <User className="inline h-4 w-4 mr-1" />
                Adınız
              </Label>
              <Input
                id="quick-name"
                type="text"
                placeholder="Adınızı girin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="quick-email" className="text-sm font-medium">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </Label>
              <Input
                id="quick-email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Hemen Başla'
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Kayıt olarak{' '}
            <a href="/terms" className="underline hover:text-primary">
              Kullanım Koşulları
            </a>
            'nı ve{' '}
            <a href="/privacy" className="underline hover:text-primary">
              Gizlilik Politikası
            </a>
            'nı kabul etmiş olursunuz.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
