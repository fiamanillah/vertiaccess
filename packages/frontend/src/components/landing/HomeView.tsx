import { useState, useEffect } from "react";
import { fetchPublicPlans, type BillingPlan } from "../../lib/billing";
import {
  Search,
  FileText,
  CheckCircle,
  Globe,
  Shield,
  BarChart3,
} from "lucide-react";
import type { PricingTier } from "../LandingPage";
import { Step } from "./Step";
import { PricingCard } from "./PricingCard";
import { AccordionItem } from "./AccordionItem";

interface HomeViewProps {
  onGetStarted: () => void;
  onRequestDemo: () => void;
  onSelectTier: (tier: PricingTier) => void;
  howItWorksRole: "operator" | "landowner";
  setHowItWorksRole: (role: "operator" | "landowner") => void;
}

export function HomeView({
  onGetStarted,
  onRequestDemo,
  onSelectTier,
  howItWorksRole,
  setHowItWorksRole,
}: HomeViewProps) {
  const [pricingMode, setPricingMode] = useState<"subscription" | "payg">(
    "subscription",
  );
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchPublicPlans()
      .then((apiPlans) => {
        if (isMounted) setPlans(apiPlans.filter(p => p.isActive));
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoadingPlans(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const planStaticData: Record<string, any> = {
    "Professional": {
      features: [
        "Full access to the VertiAccess platform",
        "Unlimited search and viewing of all TOAL and emergency and recovery sites",
        "Downloadable GeoJSON files for TOAL & Emergency and Recovery sites",
        "Digitally issues land consent certificates for regulatory applications",
        { text: "8 land Access Consents per month", bold: true },
        "Each consent applies to either a TOAL or Emergency and recovery sites",
      ],
      additionalUsage: "£50 per additional consent"
    },
    "Growth": {
      features: [
        "Everything in Professional plus",
        {
          text: "15 Land Access Consents per month (Land Access Consent resets each billing cycle)",
          bold: true,
        },
      ],
      additionalUsage: "£40 per additional consent",
      recommended: true
    },
    "Enterprise": {
      features: [
        "Everything in Growth",
        {
          text: "Unlimited land access consents per month",
          bold: true,
        },
      ],
      additionalUsage: "None – unlimited included"
    },
    "PAYG — Standard": {
      features: [
        "Platform access",
        "Unlimited search and viewing of all TOAL and emergency and recovery sites",
        "Downloadable GeoJSON files for TOAL & Emergency and Recovery sites",
        {
          text: "Digitally issued land access consent certificate",
          disabled: true,
        },
      ]
    },
    "PAYG — Advanced": {
      features: [
        "Everything in Standard Plus",
        "1 Digitally issued Land Access Consent Certificate",
      ],
      recommended: true,
      badgeText: "Recommended for BVLOS"
    }
  };

  return (
    <div className="space-y-0">
      {/* 4.1 Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(79,70,229,0.05)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h1 className="max-w-5xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-4xl md:text-[5rem] leading-[1.05] tracking-tight font-bold">
            Digital Land Access Infrastructure for Scalable BVLOS Operations
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            A central registry connecting drone operators to landowner-approved
            take-off, landing, and emergency recovery sites, with clear,
            permission-based access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <button
              onClick={onGetStarted}
              className="btn-primary h-14 px-10 text-lg w-full sm:w-auto"
            >
              Get Started
            </button>
            <button
              onClick={onRequestDemo}
              className="btn-secondary h-14 px-10 text-lg w-full sm:w-auto"
            >
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Capability Cards */}
      <section className="py-24 bg-white border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-center mb-16">Why VertiAccess?</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
            <div className="flex gap-6 items-start p-6 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/10 transition-colors group">
              <div className="size-1.5 rounded-full bg-primary mt-3 shrink-0 group-hover:scale-150 transition-transform" />
              <div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Pre-Consented TOAL & Emergency and Recovery Site Access
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Access landowner-approved take-off, landing, and contingency
                  sites through a single registry, reducing reliance on ad-hoc
                  land negotiations.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start p-6 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/10 transition-colors group">
              <div className="size-1.5 rounded-full bg-primary mt-3 shrink-0 group-hover:scale-150 transition-transform" />
              <div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Real-Time Consent & Availability Control
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Landowners manage availability, conditions, and approvals
                  dynamically, ensuring permissions reflect live operational
                  context.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start p-6 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/10 transition-colors group">
              <div className="size-1.5 rounded-full bg-primary mt-3 shrink-0 group-hover:scale-150 transition-transform" />
              <div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Designed for Contingency & Recovery
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Operators can reference pre-approved contingency landing zones
                  during non-nominal events, supporting safer and more
                  predictable operations.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start p-6 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/10 transition-colors group">
              <div className="size-1.5 rounded-full bg-primary mt-3 shrink-0 group-hover:scale-150 transition-transform" />
              <div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  Clear Records for Operational Assurance
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Permission and approval records are generated per operation to
                  support insurance, regulatory submissions, and post-operation
                  review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.4 How it Works (Homepage version) */}
      <section id="how-it-works" className="bg-blue-600 py-24 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-white">How it Works</h2>
            <p className="text-white/80 mb-8">
              A structured workflow for securing land access permissions.
            </p>

            <div className="inline-flex bg-white/10 p-1 rounded-xl backdrop-blur-sm">
              <button
                onClick={() => setHowItWorksRole("operator")}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${howItWorksRole === "operator" ? "bg-white text-blue-600 shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Operator
              </button>
              <button
                onClick={() => setHowItWorksRole("landowner")}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${howItWorksRole === "landowner" ? "bg-white text-blue-600 shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                Landowner
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -z-10 hidden md:block" />
            {howItWorksRole === "operator" ? (
              <>
                <Step
                  icon={Search}
                  number="1"
                  title="Discover sites"
                  text="Search our registry for Take-off and landing and emergency and recovery sites that meet your mission requirements."
                  darkBackground
                />
                <Step
                  icon={FileText}
                  number="2"
                  title="Request access"
                  text="Submit your documents and booking requests directly to landowners."
                  darkBackground
                />
                <Step
                  icon={CheckCircle}
                  number="3"
                  title="Receive permission"
                  text="Get auditable landowner consent to evidence in your operational safety case and manage your site bookings."
                  darkBackground
                />
              </>
            ) : (
              <>
                <Step
                  icon={Globe}
                  number="1"
                  title="Publish sites"
                  text="Register your land and set availability and access policies."
                  darkBackground
                />
                <Step
                  icon={Shield}
                  number="2"
                  title="Review requests"
                  text="Approve or deny access requests based on your site's specific rules."
                  darkBackground
                />
                <Step
                  icon={BarChart3}
                  number="3"
                  title="Track access"
                  text="Monitor site usage, retain full control over your land and get paid"
                  darkBackground
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4.5 Choose your Plan Preview */}
      <section id="pricing" className="py-24 bg-muted/30 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="mb-4">Choose your Plan</h2>
            <div className="inline-flex bg-white p-1 rounded-xl border border-border shadow-sm">
              <button
                onClick={() => setPricingMode("subscription")}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${pricingMode === "subscription" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                Subscription
              </button>
              <button
                onClick={() => setPricingMode("payg")}
                className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${pricingMode === "payg" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                Pay As You Go
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loadingPlans ? (
              <div className="md:col-span-3 text-center py-12 text-muted-foreground">
                Loading plans...
              </div>
            ) : pricingMode === "subscription" ? (
              plans.filter(p => p.billingType === "subscription").map(plan => {
                const staticData = planStaticData[plan.name] || { features: [] };
                return (
                  <PricingCard
                    key={plan.id}
                    title={plan.name}
                    price={`£${plan.monthlyPrice}`}
                    unit={plan.unitLabel || "/mo"}
                    description={plan.description || plan.name}
                    features={staticData.features}
                    recommended={staticData.recommended}
                    badgeText={staticData.badgeText}
                    additionalUsage={staticData.additionalUsage}
                    recommendationNote={staticData.recommendationNote}
                    onSelect={() =>
                      onSelectTier({
                        name: plan.name,
                        price: `£${plan.monthlyPrice}`,
                        unit: plan.unitLabel || "/mo",
                        type: "subscription",
                        description: plan.description || plan.name,
                      })
                    }
                  />
                );
              })
            ) : (
              <div className="md:col-span-3 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                {plans.filter(p => p.billingType === "payg").map(plan => {
                  const staticData = planStaticData[plan.name] || { features: [] };
                  return (
                    <PricingCard
                      key={plan.id}
                      title={plan.name}
                      price={`£${plan.monthlyPrice}`}
                      unit={plan.unitLabel || "/request"}
                      description={plan.description || plan.name}
                      features={staticData.features}
                      recommended={staticData.recommended}
                      badgeText={staticData.badgeText}
                      additionalUsage={staticData.additionalUsage}
                      recommendationNote={staticData.recommendationNote}
                      onSelect={() =>
                        onSelectTier({
                          name: plan.name,
                          price: `£${plan.monthlyPrice}`,
                          unit: plan.unitLabel || "/request",
                          type: "payg",
                          description: plan.description || plan.name,
                        })
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-center mt-12 text-sm text-muted-foreground">
            Landowner access fees apply separately.
          </p>
        </div>
      </section>

      {/* 4.6 FAQ Preview */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-6 scroll-mt-20">
        <div className="text-center mb-16">
          <h2 className="mb-4">FAQ's</h2>
        </div>
        <div className="space-y-4">
          <AccordionItem
            title="What is a TOAL?"
            content="A TOAL (Take-Off and Landing site) is a landowner-approved location where a drone operator is permitted to safely launch and land an unmanned aircraft as part of a specific operation."
          />
          <AccordionItem
            title="What is an Emergency and Recovery Site?"
            content="An Emergency and Recovery Site is a pre-identified site used for emergency or non-nominal landings during uncrewed flights."
          />
          <AccordionItem
            title="Can I book multiple sites at once?"
            content="Yes. You can submit requests for multiple TOAL and/or Emergency and Recovery sites as part of your operational planning. Each site request is treated as an individual permission event and tracked separately for approval and records."
          />
          <AccordionItem
            title="How long does approval take?"
            content="Approval times are set by the landowner. Some sites offer near-instant approval, while others may require manual review. You will see each site's expected response time and approval status in real time."
          />
          <AccordionItem
            title="Can I export consent records?"
            content="Yes. All approved permissions and consent records can be exported for regulatory, insurance, or internal assurance purposes, including timestamps and site details."
          />
          <AccordionItem
            title="Do unused Land Access Consents roll over?"
            content="No, Land Access Consents are allocated per billing cycle and reset monthly. Subscriptions provide access to a defined monthly capacity of compliant land access infrastructure."
          />
          <AccordionItem
            title="Can I switch between Pay-As-You-Go and Subscription plans?"
            content="Yes. You can move between PAYG and subscription plans at any time, depending on your operational needs. This allows flexibility for one-off missions or regular operations."
          />
          <AccordionItem
            title="Can I disable my TOAL or Emergency and Recovery site whenever I want?"
            content="Yes. Landowners have full control and can enable or disable access to their TOAL or Emergency and Recovery site at any time. Changes take effect immediately and are reflected in availability and booking rules."
          />
          <AccordionItem
            title="How do landowners get paid?"
            content="Landowners set their own access fees, which are collected through the platform and transferred directly to their account."
          />
          <AccordionItem
            title="Is the consent certificate legally binding?"
            content="The certificate provides a verifiable audit trail of permission granted by the landowner for specific operations at specific times."
          />
        </div>
      </section>

      {/* 4.7 Final CTA */}
      <section className="py-24 bg-primary text-white">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-white mb-6">
            Ready to secure ground access for your operation?
          </h2>
          <p className="text-white/80 mb-10 max-w-xl mx-auto">
            Join professional drone operators and landowners using VertiAccess
            to coordinate compliant take-off, landing, and contingency access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="h-14 px-10 rounded-xl bg-white text-primary font-semibold hover:bg-white/95 transition-all w-full sm:w-auto"
            >
              Get Started
            </button>
            <button
              onClick={onRequestDemo}
              className="h-14 px-10 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-all w-full sm:w-auto"
            >
              Request a Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
