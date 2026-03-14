import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Mail, MapPin, Clock, Send, MessageSquare, Phone } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setName(''); setEmail(''); setSubject(''); setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="contact-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Contact Us</h1>
          <p className="text-sm text-muted-foreground">We'd love to hear from you</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'support@interviewmaster.com', sub: 'We reply within 24 hours' },
            { icon: Clock, label: 'Hours', value: 'Mon - Fri, 9AM - 6PM', sub: 'IST (UTC+5:30)' },
            { icon: MapPin, label: 'Location', value: 'Remote-first team', sub: 'Operating globally' },
          ].map((item, i) => (
            <Card key={i} className="border">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card className="border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Name *</Label>
                    <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} data-testid="contact-name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Email *</Label>
                    <Input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} data-testid="contact-email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Subject</Label>
                  <Input placeholder="What's this about?" value={subject} onChange={e => setSubject(e.target.value)} data-testid="contact-subject" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Message *</Label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px] resize-y"
                    placeholder="Tell us how we can help..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    data-testid="contact-message"
                  />
                </div>
                <Button type="submit" className="gap-2" data-testid="contact-submit">
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
