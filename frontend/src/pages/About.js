import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Target, Heart, Users, Lightbulb, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12" data-testid="about-page">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight font-heading">About Us</h1>
      </div>

      <div className="space-y-6">
        <p className="text-lg text-muted-foreground leading-relaxed">
          InterviewMaster is an AI-powered interview preparation platform built to help job seekers
          practice, improve, and gain confidence before their real interviews.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 pt-4">
          {[
            { icon: Target, title: 'Our Mission', text: 'To democratize interview preparation by making high-quality, AI-driven practice accessible to everyone, regardless of background or budget.' },
            { icon: Lightbulb, title: 'Our Vision', text: 'A world where every candidate walks into an interview feeling prepared, confident, and ready to showcase their true potential.' },
            { icon: Users, title: 'Who We Serve', text: 'From fresh graduates to experienced professionals, career changers to those re-entering the workforce — we serve anyone preparing for their next opportunity.' },
            { icon: Heart, title: 'Our Values', text: 'We believe in accessibility, continuous improvement, honest feedback, and empowering individuals to reach their career goals.' },
          ].map((item, i) => (
            <Card key={i} className="border">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold font-heading">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold font-heading">How It Works</h2>
          <div className="space-y-3">
            {[
              'Choose your target role or upload your resume for personalized questions.',
              'Practice with AI-generated interview questions tailored to your level and skills.',
              'Record your answers with webcam and microphone for realistic simulation.',
              'Get instant AI feedback on content quality, clarity, and areas for improvement.',
              'Review your recordings, track progress, and improve over time.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-3 p-5 rounded-md bg-primary/5 border">
          <Globe className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            InterviewMaster is free to use and open to candidates worldwide. We're committed to keeping core features accessible to everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
