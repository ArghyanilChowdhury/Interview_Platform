import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Cookie, Shield, Settings } from 'lucide-react';

export default function Cookies() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8" data-testid="cookies-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: March 10, 2026</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">What Are Cookies?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Cookies are small text files stored on your device when you visit a website. They help us provide a better experience by remembering your preferences and keeping you signed in.</p>
        </section>
        <Separator />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold font-heading">Cookies We Use</h2>
          <div className="space-y-4">
            {[
              { icon: Shield, title: 'Essential Cookies', desc: 'Required for the platform to function. These include session tokens for authentication and security tokens to protect against cross-site request forgery.', required: true },
              { icon: Settings, title: 'Preference Cookies', desc: 'Store your preferences such as dark/light theme mode and language settings. These improve your experience but are not strictly necessary.', required: false },
              { icon: Cookie, title: 'Analytics Cookies', desc: 'Help us understand how users interact with the platform so we can improve features and fix issues. Data is collected anonymously.', required: false },
            ].map((cookie, i) => (
              <Card key={i} className="border">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <cookie.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{cookie.title}</h3>
                      {cookie.required && <span className="text-xs text-primary font-medium">Required</span>}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{cookie.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <Separator />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">Managing Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">You can manage cookies through your browser settings. Please note that disabling essential cookies may prevent you from using certain features of InterviewMaster, such as staying signed in.</p>
        </section>
        <Separator />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">If you have questions about our cookie practices, contact us at <span className="text-primary">arghyanilryzen@gmail.com</span>.</p>
        </section>
      </div>
    </div>
  );
}
