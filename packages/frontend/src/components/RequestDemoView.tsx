import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { ArrowLeft, Send } from 'lucide-react';
import { VertiAccessLogo } from './VertiAccessLogo';

export function RequestDemoView({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    organisation: '',
    email: '',
    role: 'Operator',
    message: '',
    agreed: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreed) {
      toast.error('Please agree to be contacted');
      return;
    }
    // Mock success
    toast.success('Demo request sent! We will contact you soon.');
    onSuccess();
  };

  return (
    <div className="py-20 lg:py-32 bg-muted/10 min-h-[calc(100vh-80px)]">
      <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-start">
        {/* Content Side */}
        <div className="space-y-8">
          <button 
            onClick={onSuccess}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-12"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </button>
          
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            See VertiAccess in action.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
            Schedule a personalised walkthrough of the VertiAccess platform.
          </p>
          
          <div className="pt-8 space-y-10">
            <div className="flex gap-5 items-start">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">Tailored to your role</h4>
                <p className="text-muted-foreground leading-relaxed">Whether you are a drone operator, landowner, estate manager, or public authority, we will focus on the features most relevant to your use case.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">Practical operational insight</h4>
                <p className="text-muted-foreground leading-relaxed">Discuss real-world operational workflows, land access coordination, and evidence generation for insurance or regulatory submissions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-border shadow-xl shadow-primary/5">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-3">Request a Demo</h2>
            <p className="text-muted-foreground leading-relaxed">Complete the form below and our team will be in touch to arrange your demo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Name</label>
              <input
                required
                type="text"
                className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5"
                placeholder="Your full name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Organisation</label>
              <input
                required
                type="text"
                className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5"
                placeholder="Company, estate, or authority name"
                value={formData.organisation}
                onChange={e => setFormData({ ...formData, organisation: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Email</label>
              <input
                required
                type="email"
                className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5"
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Role</label>
              <select
                className="w-full h-12 px-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5 appearance-none cursor-pointer"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option disabled value="">Select your role</option>
                <option>Operator</option>
                <option>Landowner</option>
                <option>Estate Manager</option>
                <option>Authority</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1 px-1">Operator / Landowner / Estate Manager / Authority</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Message (Optional)</label>
              <textarea
                className="w-full p-4 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-muted/5 min-h-[120px] resize-none"
                placeholder="Tell us about your operations or what you would like to see"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="agreed-page"
                className="mt-1 size-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                checked={formData.agreed}
                onChange={e => setFormData({ ...formData, agreed: e.target.checked })}
              />
              <label htmlFor="agreed-page" className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none">
                I agree to be contacted by VertiAccess regarding my demo request.
              </label>
            </div>
            
            <button type="submit" className="btn-primary w-full h-14 text-lg font-bold flex items-center justify-center gap-2 group shadow-lg shadow-primary/20">
              Send Request
              <Send className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
