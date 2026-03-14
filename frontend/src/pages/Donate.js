import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Heart, Coffee, Rocket, Star, Globe } from 'lucide-react';

const tiers = [
  { icon: Coffee, name: 'Supporter', amount: '$5', period: 'one-time', desc: 'Buy us a coffee and help keep the lights on.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Star, name: 'Champion', amount: '$25', period: 'one-time', desc: 'Help us add new features and improve the AI models.', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Rocket, name: 'Patron', amount: '$100', period: 'one-time', desc: 'Make a significant impact. Your name on our contributors page.', color: 'text-violet-500', bg: 'bg-violet-500/10' },
];

export default function Donate() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10" data-testid="donate-page">
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon" data-testid="back-btn"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Support Us</h1>
          <p className="text-sm text-muted-foreground">Help us keep InterviewMaster free and accessible</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-5 rounded-md bg-primary/5 border">
          <Heart className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold font-heading mb-1">Why donate?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              InterviewMaster is free to use. Your donations help us cover server costs, improve AI models,
              add new features, and keep the platform accessible to job seekers who need it most.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {tiers.map((tier, i) => (
          <Card key={i} className="border hover:shadow-md transition-all duration-200" data-testid={`donate-tier-${i}`}>
            <CardContent className="p-6 space-y-4 text-center">
              <div className={`w-14 h-14 rounded-md ${tier.bg} flex items-center justify-center mx-auto`}>
                <tier.icon className={`w-7 h-7 ${tier.color}`} />
              </div>
              <div>
                <h3 className="font-semibold font-heading">{tier.name}</h3>
                <p className="text-2xl font-bold mt-1">{tier.amount}</p>
                <p className="text-xs text-muted-foreground">{tier.period}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tier.desc}</p>
              <Button className="w-full gap-1.5" variant={i === 1 ? 'default' : 'outline'}>
                <Heart className="w-3.5 h-3.5" /> Donate {tier.amount}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="text-center space-y-3">
        <Globe className="w-6 h-6 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Every contribution, no matter the size, makes a difference. Thank you for helping us empower job seekers around the world.
        </p>
      </div>
    </div>
  );
}
