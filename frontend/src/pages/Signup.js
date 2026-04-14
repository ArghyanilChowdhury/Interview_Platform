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
import { Video, Mail, Lock, User, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Signup() {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!email) { toast.error('Please enter your email'); return; }
    setSendingOtp(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally { setSendingOtp(false); }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/verify-otp`, { email, otp });
      toast.success('Email verified!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, { email, otp, password, name }, { withCredentials: true });
      if (res.data.token) {
        localStorage.setItem('auth_token', res.data.token);
      }
      toast.success('Account created successfully!');
      // Re-login to set auth state
      await authLogin(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" data-testid="signup-page">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center">
        <Button variant="ghost" size="icon" className="absolute top-6 left-6 text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate('/')} data-testid="signup-back-btn">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/20 rounded-full" />
        </div>
        <div className="relative text-center text-white px-12">
          <Video className="w-12 h-12 mb-6 mx-auto opacity-90" />
          <h2 className="text-3xl font-bold font-heading tracking-tight mb-3">Practice Makes Perfect</h2>
          <p className="text-white/70 leading-relaxed">Join InterviewMaster and start preparing for your dream job with AI-powered mock interviews.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/')} data-testid="signup-back-btn-mobile">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">InterviewMaster</span>
          </div>

          <Card className="border-0 shadow-none" data-testid="signup-card">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-heading">
                {step === 1 ? 'Create an account' : step === 2 ? 'Verify your email' : 'Complete your profile'}
              </CardTitle>
              <CardDescription>
                {step === 1 ? 'Enter your email to get started' : step === 2 ? `We sent a 6-digit OTP to ${email}` : 'Set your name and password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {/* Step 1: Email */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                        data-testid="signup-email-input"
                      />
                    </div>
                  </div>
                  <Button className="w-full h-10" onClick={sendOtp} disabled={sendingOtp} data-testid="send-otp-btn">
                    {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                  </Button>
                </div>
              )}

              {/* Step 2: OTP */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Enter OTP</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="6-digit OTP"
                        className="pl-9 text-center tracking-[0.3em] text-lg font-mono"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                        data-testid="signup-otp-input"
                      />
                    </div>
                  </div>
                  <Button className="w-full h-10" onClick={verifyOtp} disabled={loading} data-testid="verify-otp-btn">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify OTP'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Didn't receive it?{' '}
                    <button className="text-primary font-medium hover:underline" onClick={sendOtp} disabled={sendingOtp} data-testid="resend-otp-btn">
                      Resend OTP
                    </button>
                  </p>
                </div>
              )}

              {/* Step 3: Name + Password */}
              {step === 3 && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">{email} verified</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="John Doe" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} data-testid="signup-name-input" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="password" placeholder="Min 6 characters" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="signup-password-input" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10" disabled={loading} data-testid="signup-submit-btn">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
                  </Button>
                </form>
              )}

              <Separator />
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">Log in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
