import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Video, Mic, BarChart3, FileText, ArrowRight, CheckCircle, Briefcase,
  Mail, Heart, Users, Info, Phone, Globe, Github, Twitter, Linkedin
} from 'lucide-react';

const features = [
  {
    icon: Briefcase,
    title: 'Role-Based Interviews',
    desc: 'Choose from Frontend, Backend, Full Stack, Data Analyst, DevOps, and HR interview tracks.',
  },
  {
    icon: FileText,
    title: 'Resume-Driven Questions',
    desc: 'Upload your resume and get personalized questions based on your experience and skills.',
  },
  {
    icon: Video,
    title: 'Live Recording',
    desc: 'Record your answers with webcam and microphone for realistic interview simulation.',
  },
  {
    icon: Mic,
    title: 'Speech Transcription',
    desc: 'Automatic speech-to-text captures your answers for review and AI analysis.',
  },
  {
    icon: BarChart3,
    title: 'AI Feedback',
    desc: 'Get instant AI-powered feedback on content quality, clarity, and improvement areas.',
  },
  {
    icon: CheckCircle,
    title: 'Review & Improve',
    desc: 'Revisit recordings, read transcripts, and track your interview progress over time.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/3" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider px-3 py-1">
                AI-Powered Interview Coach
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-heading leading-[1.1]">
                Ace Your Next
                <span className="text-primary block mt-1">Interview</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                Practice mock interviews with AI-generated questions, record your answers,
                and get instant feedback to improve your performance.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 h-12 px-6 text-sm font-semibold" data-testid="hero-get-started">
                    Start Practicing <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold" data-testid="hero-login">
                    Log In
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Free to use</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> AI powered</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Instant feedback</span>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="relative rounded-md overflow-hidden shadow-2xl border">
                <img
                  src="https://images.unsplash.com/photo-1698047681452-08eba22d0c64?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="Professional interview preparation"
                  className="w-full h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="glass rounded-md p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-recording-pulse" />
                      <span className="text-white text-sm font-medium">Recording in progress...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left max-w-2xl mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Everything you need
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight font-heading">
              Built for Interview Success
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-md border bg-card hover:shadow-md transition-all duration-200 animate-fade-in-up"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 font-heading">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-md bg-primary p-12 md:p-16 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-heading tracking-tight mb-4">
                Ready to practice?
              </h2>
              <p className="text-white/80 text-base mb-8 leading-relaxed">
                Join thousands of candidates who improved their interview skills with AI-powered mock interviews.
              </p>
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="h-12 px-8 font-semibold gap-2" data-testid="cta-signup">
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Top */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <Video className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold font-heading">InterviewMaster</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered interview practice platform helping candidates land their dream jobs.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" data-testid="footer-twitter" aria-label="Twitter">
                  <Twitter className="w-4 h-4 text-muted-foreground" />
                </a>
                <a href="#" className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" data-testid="footer-linkedin" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4 text-muted-foreground" />
                </a>
                <a href="#" className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" data-testid="footer-github" aria-label="GitHub">
                  <Github className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold font-heading">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-about">About Us</Link></li>
                <li><Link to="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-careers">Careers</Link></li>
                <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-blog">Blog</Link></li>
                <li><Link to="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-press">Press</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold font-heading">Support</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-contact">Contact Us</Link></li>
                <li><Link to="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-help">Help Center</Link></li>
                <li><Link to="/donate" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-donate">Donate Us</Link></li>
                <li><Link to="/feedback" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-feedback">Feedback</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold font-heading">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-privacy">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-terms">Terms of Service</Link></li>
                <li><Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-cookies">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Footer Bottom */}
          <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} InterviewMaster. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="mailto:support@interviewmaster.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors" data-testid="footer-email">
                <Mail className="w-3 h-3" /> support@interviewmaster.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
