import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  User, Mail, Calendar, BarChart3, Camera, Edit2, Loader2,
  ShieldCheck, CheckCircle, Save
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function Profile() {
  const { user, getAuthHeaders, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Change email state
  const [changeEmailMode, setChangeEmailMode] = useState(0); // 0=off, 1=enter email, 2=enter OTP
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  // Profile picture
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/profile`, { headers: getAuthHeaders(), withCredentials: true });
        setProfile(res.data);
        setName(res.data.name || '');
      } catch {}
      setLoading(false);
    })();
  }, [getAuthHeaders]);

  const saveName = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile`, { name: name.trim() }, { headers: getAuthHeaders(), withCredentials: true });
      setProfile(prev => ({ ...prev, name: res.data.name }));
      if (refreshUser) refreshUser();
      toast.success('Name updated!');
    } catch { toast.error('Failed to update name'); }
    finally { setSaving(false); }
  };

  const uploadPicture = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) { toast.error('Only JPG, PNG, WEBP images'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/profile/upload-picture`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setProfile(prev => ({ ...prev, picture: res.data.picture }));
      if (refreshUser) refreshUser();
      toast.success('Profile picture updated!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to upload picture'); }
    finally { setUploadingPic(false); }
  };

  const sendChangeEmailOtp = async () => {
    if (!newEmail) { toast.error('Please enter the new email'); return; }
    setSendingOtp(true);
    try {
      await axios.post(`${API}/profile/change-email/send-otp`, { new_email: newEmail }, { headers: getAuthHeaders(), withCredentials: true });
      toast.success(`OTP sent to ${newEmail}`);
      setChangeEmailMode(2);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to send OTP'); }
    finally { setSendingOtp(false); }
  };

  const verifyChangeEmail = async () => {
    if (!emailOtp || emailOtp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setSendingOtp(true);
    try {
      const res = await axios.post(`${API}/profile/change-email/verify`, { new_email: newEmail, otp: emailOtp }, { headers: getAuthHeaders(), withCredentials: true });
      setProfile(prev => ({ ...prev, email: res.data.email }));
      if (refreshUser) refreshUser();
      toast.success('Email updated!');
      setChangeEmailMode(0);
      setNewEmail('');
      setEmailOtp('');
    } catch (err) { toast.error(err.response?.data?.detail || 'Invalid OTP'); }
    finally { setSendingOtp(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const picUrl = profile?.picture ? (profile.picture.startsWith('http') ? profile.picture : `${BACKEND}${profile.picture}`) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="profile-page">
      <h1 className="text-2xl font-bold tracking-tight font-heading">Profile</h1>

      {/* Avatar + Name */}
      <Card className="border">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Profile picture */}
            <div className="relative group" data-testid="profile-picture-container">
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => e.target.files[0] && uploadPicture(e.target.files[0])} />
              <div
                className="w-20 h-20 rounded-full bg-muted border-2 border-background shadow-md overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => fileRef.current?.click()}
              >
                {uploadingPic ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : picUrl ? (
                  <img src={picUrl} alt="Profile" className="w-full h-full object-cover" data-testid="profile-avatar-img" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow" onClick={() => fileRef.current?.click()} data-testid="change-picture-btn">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Name edit */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Full Name</Label>
                <div className="flex items-center gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} className="max-w-xs" data-testid="profile-name-input" />
                  <Button size="sm" className="gap-1.5" onClick={saveName} disabled={saving || name === profile?.name} data-testid="save-name-btn">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="border" data-testid="email-section">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Email Address
          </CardTitle>
          <CardDescription className="text-xs">Your email is used for login and receiving interview feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" data-testid="current-email">{profile?.email}</span>
            <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle className="w-2.5 h-2.5" /> Verified</Badge>
          </div>

          {changeEmailMode === 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setChangeEmailMode(1)} data-testid="change-email-btn">
              <Edit2 className="w-3 h-3" /> Change Email
            </Button>
          )}

          {changeEmailMode === 1 && (
            <div className="space-y-3 p-4 rounded-md border bg-muted/30">
              <Label className="text-sm">New Email Address</Label>
              <div className="flex items-center gap-2">
                <Input type="email" placeholder="new@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="max-w-xs" data-testid="new-email-input" />
                <Button size="sm" onClick={sendChangeEmailOtp} disabled={sendingOtp} data-testid="send-email-otp-btn">
                  {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send OTP'}
                </Button>
              </div>
              <button className="text-xs text-muted-foreground hover:underline" onClick={() => setChangeEmailMode(0)}>Cancel</button>
            </div>
          )}

          {changeEmailMode === 2 && (
            <div className="space-y-3 p-4 rounded-md border bg-muted/30">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> OTP sent to {newEmail}
              </div>
              <Label className="text-sm">Enter OTP</Label>
              <div className="flex items-center gap-2">
                <Input type="text" placeholder="6-digit OTP" maxLength={6} className="max-w-[180px] text-center tracking-[0.3em] font-mono" value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))} data-testid="email-otp-input" />
                <Button size="sm" onClick={verifyChangeEmail} disabled={sendingOtp} data-testid="verify-email-otp-btn">
                  {sendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify & Update'}
                </Button>
              </div>
              <button className="text-xs text-muted-foreground hover:underline" onClick={() => setChangeEmailMode(0)}>Cancel</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-md bg-muted/30">
              <p className="text-2xl font-bold">{profile?.total_interviews || 0}</p>
              <p className="text-xs text-muted-foreground">Total Interviews</p>
            </div>
            <div className="text-center p-4 rounded-md bg-muted/30">
              <p className="text-2xl font-bold">{profile?.completed_interviews || 0}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-4 rounded-md bg-muted/30">
              <p className="text-2xl font-bold">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'}</p>
              <p className="text-xs text-muted-foreground">Member Since</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Account created {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
        </p>
      </div>
    </div>
  );
}
