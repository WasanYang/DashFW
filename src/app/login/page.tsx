// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import { login, register } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <form
        onSubmit={handleSubmit}
        className='bg-white p-8 rounded shadow-md w-80 space-y-4'
      >
        <h2 className='text-2xl font-bold mb-4'>
          {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </h2>
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full border p-2 rounded'
          required
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full border p-2 rounded'
          required
        />
        {error && <div className='text-red-500 text-sm'>{error}</div>}
        <button
          type='submit'
          className='w-full bg-blue-600 text-white py-2 rounded'
        >
          {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>
        <button
          type='button'
          className='w-full text-blue-600 underline text-sm'
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'
            : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
        </button>
      </form>
    </div>
  );
}
