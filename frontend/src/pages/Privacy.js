import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8" data-testid="privacy-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: March 10, 2026</p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Account Information:</strong> When you create an account, we collect your name, email address, and profile picture (if using Google sign-in).</p>
          <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Interview Data:</strong> We store interview questions, your transcribed answers, AI-generated feedback, and metadata about your interview sessions.</p>
          <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Recordings:</strong> Video and audio recordings made during mock interviews are stored on our servers and are accessible only to you.</p>
          <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Resume Data:</strong> If you upload a resume, we parse its content to generate personalized questions. Resume files are stored securely.</p>
        </section>
        <Separator />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">2. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We use your information to provide, maintain, and improve the InterviewMaster platform, including generating personalized interview questions, providing AI feedback, and enabling you to review your past sessions.</p>
        </section>
        <Separator />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">3. Data Sharing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We do not sell, rent, or trade your personal information. We may share data with AI service providers (for question generation and feedback) in anonymized form. We will never share your recordings or personal data with third parties without your explicit consent.</p>
        </section>
        <Separator />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">4. Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We implement industry-standard security measures including encrypted data transmission (HTTPS), secure password hashing, and access controls to protect your information.</p>
        </section>
        <Separator />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">5. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">You have the right to access, update, or delete your personal data at any time. You can edit your profile information or contact us at <span className="text-primary">arghyanilryzen@gmail.com</span> to request data deletion.</p>
        </section>
        <Separator />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold font-heading">6. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">If you have questions about this Privacy Policy, please contact us at <span className="text-primary">arghyanilryzen@gmail.com</span>.</p>
        </section>
      </div>
    </div>
  );
}
