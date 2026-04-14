import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { Video, Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Forgot password state
  const [forgotMode, setForgotMode] = useState(0); // 0=login, 1=enter email, 2=enter OTP, 3=new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sending, setSending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const sendForgotOtp = async () => {
    if (!forgotEmail) { toast.error('Please enter your email'); return; }
    setSending(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
      toast.success('Reset OTP sent to your email!');
      setForgotMode(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally { setSending(false); }
  };

  const resetPassword = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSending(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { email: forgotEmail, otp: forgotOtp, new_password: newPassword });
      toast.success('Password reset successfully! Please log in.');
      setForgotMode(0);
      setEmail(forgotEmail);
      setPassword('');
      setForgotOtp('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center">
        <Button variant="ghost" size="icon" className="absolute top-6 left-6 text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate('/')} data-testid="login-back-btn">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/20 rounded-full" />
        </div>
        <div className="relative text-center text-white px-12">
          <Video className="w-12 h-12 mb-6 mx-auto opacity-90" />
          <h2 className="text-3xl font-bold font-heading tracking-tight mb-3">Welcome Back</h2>
          <p className="text-white/70 leading-relaxed">Continue your interview preparation journey with AI-powered mock interviews.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/')} data-testid="login-back-btn-mobile">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">InterviewMaster</span>
          </div>

          <Card className="border-0 shadow-none" data-testid="login-card">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-heading">
                {forgotMode === 0 ? 'Log in' : forgotMode === 1 ? 'Forgot Password' : forgotMode === 2 ? 'Reset Password' : 'Log in'}
              </CardTitle>
              <CardDescription>
                {forgotMode === 0 ? 'Enter your credentials to access your account' : forgotMode === 1 ? 'Enter your email to receive a reset OTP' : 'Enter the OTP and your new password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {/* Normal Login */}
              {forgotMode === 0 && (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email-input" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm">Password</Label>
                        <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setForgotMode(1); setForgotEmail(email); }} data-testid="forgot-password-link">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="password" type="password" placeholder="Enter password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password-input" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-10" disabled={loading} data-testid="login-submit-btn">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log in'}
                    </Button>
                  </form>
                  <Separator />
                  <p className="text-sm text-center text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary font-medium hover:underline" data-testid="signup-link">Sign up</Link>
                  </p>
                </>
              )}

              {/* Forgot: Enter email */}
              {forgotMode === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="you@example.com" className="pl-9" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendForgotOtp()} data-testid="forgot-email-input" />
                    </div>
                  </div>
                  <Button className="w-full h-10" onClick={sendForgotOtp} disabled={sending} data-testid="send-reset-otp-btn">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset OTP'}
                  </Button>
                  <button className="text-sm text-primary hover:underline w-full text-center" onClick={() => setForgotMode(0)} data-testid="back-to-login-btn">
                    Back to login
                  </button>
                </div>
              )}

              {/* Forgot: Enter OTP + New Password */}
              {forgotMode === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border mb-1">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">OTP sent to <strong>{forgotEmail}</strong></span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Enter OTP</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="text" placeholder="6-digit OTP" className="pl-9 text-center tracking-[0.3em] text-lg font-mono" maxLength={6} value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))} data-testid="reset-otp-input" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="password" placeholder="Min 6 characters" className="pl-9" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} data-testid="new-password-input" />
                    </div>
                  </div>
                  <Button className="w-full h-10" onClick={resetPassword} disabled={sending} data-testid="reset-password-btn">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                  </Button>
                  <button className="text-sm text-primary hover:underline w-full text-center" onClick={() => setForgotMode(0)} data-testid="back-to-login-btn-2">
                    Back to login
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
