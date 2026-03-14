'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/contexts/subscription-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function ForceChangePassword() {
  const { refreshSubscription } = useSubscription();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Yeni sifre en az 6 karakter olmalidir');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Yeni sifre ve tekrar eslesmiyor');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        toast.error(updateError.message || 'Sifre guncellenemedi');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('/api/profile/clear-must-change-password', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          console.warn('clear-must-change-password failed');
        }
      }

      await refreshSubscription();
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Sifreniz guncellendi. Artik uygulamayi kullanabilirsiniz.');
    } catch (err: any) {
      toast.error(err.message || 'Bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540]/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-[#0A2540]">
            <KeyRound className="h-6 w-6" />
            <CardTitle>Sifrenizi Degistirin</CardTitle>
          </div>
          <CardDescription>
            Sifreniz sifirlandi. Devam edebilmek icin yeni bir sifre belirleyin (en az 6 karakter).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new">Yeni sifre</Label>
              <Input
                id="new"
                type="password"
                placeholder="En az 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm">Yeni sifre (tekrar)</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Ayni sifreyi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sifreyi Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
