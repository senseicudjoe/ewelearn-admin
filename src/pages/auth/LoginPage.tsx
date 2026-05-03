// src/pages/auth/LoginPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import logoUrl from '../../assets/images/logo.png';

export const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.15),transparent)] pointer-events-none" />
      <Card className="w-full max-w-md relative shadow-xl border-slate-200/80 rounded-2xl overflow-hidden">
        <CardHeader className="space-y-3 text-center pb-2">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white-500 to-white-600 text-white shadow-lg shadow-purple-200/50">
              <img src={logoUrl} alt="EweLearn" className="h-10 w-10 object-contain" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">EweLearn Admin</CardTitle>
            <CardDescription className="mt-1 text-slate-500">Sign in to manage courses and lessons</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ewelearn.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-slate-200 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-slate-200 focus-visible:ring-purple-500"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-11 font-medium bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-600">Demo accounts</p>
            <p className="mt-1">Admin: admin@test.com / admin123</p>
            <p>Teacher: teacher@test.com / teacher123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};