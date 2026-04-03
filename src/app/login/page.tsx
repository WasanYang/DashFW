'use client';
import { useState } from 'react';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      const firebaseError = err as { code?: string; message: string };
      if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(firebaseError.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4'>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type='email'
                placeholder='email@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder='รหัสผ่าน'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            {error && <p className='text-sm font-medium text-destructive'>{error}</p>}
            
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 animate-spin" />}
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
