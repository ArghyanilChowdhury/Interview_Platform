import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Heart, Coffee, Rocket, Star, Globe, X, IndianRupee } from 'lucide-react';

const UPI_ID = 'sudeshnachowdhury1071974@oksbi';
const UPI_NAME = 'InterviewMaster';

const tiers = [
  { icon: Coffee, name: 'Supporter', amount: 29, desc: 'Buy us a chai and help keep the lights on.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Star, name: 'Champion', amount: 49, desc: 'Help us add new features and improve the AI models.', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Heart, name: 'Hero', amount: 79, desc: 'Make a meaningful impact on thousands of job seekers.', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { icon: Rocket, name: 'Patron', amount: 99, desc: 'Our biggest supporters. Your name on our contributors page.', color: 'text-violet-500', bg: 'bg-violet-500/10' },
];

function getUpiUrl(amount) {
  return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Donation to InterviewMaster - ${amount} INR`)}`;
}

export default function Donate() {
  const [selectedTier, setSelectedTier] = useState(null);

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tiers.map((tier, i) => (
          <Card key={i} className="border hover:shadow-md transition-all duration-200" data-testid={`donate-tier-${i}`}>
            <CardContent className="p-5 space-y-4 text-center">
              <div className={`w-12 h-12 rounded-md ${tier.bg} flex items-center justify-center mx-auto`}>
                <tier.icon className={`w-6 h-6 ${tier.color}`} />
              </div>
              <div>
                <h3 className="font-semibold font-heading text-sm">{tier.name}</h3>
                <p className="text-2xl font-bold mt-1 flex items-center justify-center gap-0.5">
                  <IndianRupee className="w-5 h-5" />{tier.amount}
                </p>
                <p className="text-xs text-muted-foreground">one-time</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tier.desc}</p>
              <Button
                className="w-full gap-1.5 text-sm"
                variant={i === 1 ? 'default' : 'outline'}
                onClick={() => setSelectedTier(tier)}
                data-testid={`donate-btn-${i}`}
              >
                <Heart className="w-3.5 h-3.5" /> Donate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Modal */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedTier(null)} data-testid="qr-modal-overlay">
          <Card className="w-full max-w-sm border shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()} data-testid="qr-modal">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold font-heading text-lg">Scan to Pay</h3>
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setSelectedTier(null)} data-testid="close-qr-modal">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg inline-block mx-auto" data-testid="qr-code">
                <QRCodeSVG
                  value={getUpiUrl(selectedTier.amount)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold flex items-center justify-center gap-0.5">
                  <IndianRupee className="w-5 h-5" />{selectedTier.amount}
                </p>
                <p className="text-xs text-muted-foreground">{selectedTier.name} Donation</p>
                <p className="text-xs text-muted-foreground mt-2">Scan this QR code with any UPI app<br />(Google Pay, PhonePe, Paytm, etc.)</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">UPI ID: {UPI_ID}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
