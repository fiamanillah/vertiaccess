import { ImageWithFallback } from "../figma/ImageWithFallback";

import missionHeroImg from "figma:asset/66ef4ee0237a9798bb524039fa6b2a03e86f0ecc.png";
import droneDeliveryImg from "figma:asset/83abb85e9d42f79ef2256fe99eef6dd488a698ba.png";

export function AboutView() {
  return (
    <div className="py-24 max-w-[1200px] mx-auto px-6 space-y-32">
      {/* Our Mission */}
      <section className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl mb-8">Our Mission</h1>
          <p className="text-xl font-semibold text-primary mb-6">
            Enabling fast, reliable, and scalable access to ground infrastructure for drone operations.
          </p>
          <p className="text-lg leading-relaxed mb-6 text-muted-foreground">
            VertiAccess exists to solve one of the most persistent barriers to scaling drone operations: secure, policy-governed access to take-off, landing, and contingency sites. We enable this by connecting operators with a network of verified take-off, landing, and emergency recovery sites across private land, estates and parks, drone ports, and aviation facilities.
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            By providing coordination at an operational layer between landowners and drone operators, VertiAccess replaces fragmented permissions with structured workflows that enable safe and scalable drone operations across the UK.
          </p>
        </div>
        <div className="aspect-video rounded-3xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden relative shadow-2xl">
          <ImageWithFallback
            src={missionHeroImg}
            alt="Drone operation volume visualization over landscape"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* What We Enable */}
      <section className="bg-muted/30 rounded-[2.5rem] p-12 md:p-16">
        <h2 className="text-center mb-12">What We Enable</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card-standard p-8 bg-white">
            <h3 className="text-xl mb-4">Access Policies</h3>
            <p className="text-muted-foreground text-sm">
              Landowner-defined access policies to maintain full control over
              site usage and availability.
            </p>
          </div>
          <div className="card-standard p-8 bg-white">
            <h3 className="text-xl mb-4">Verified Sites</h3>
            <p className="text-muted-foreground text-sm">
              Access to a network of verified take-off and landing (TOAL) and emergency recovery sites across trusted landowners and infrastructure providers.
            </p>
          </div>
          <div className="card-standard p-8 bg-white">
            <h3 className="text-xl mb-4">Digital Operational Permission</h3>
            <p className="text-muted-foreground text-sm">
              Structured approvals that provide auditable evidence of land access for operational and regulatory use.
            </p>
          </div>
        </div>
      </section>

      {/* Why Now? */}
      <section className="grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 relative group">
          <div className="aspect-[4/3] rounded-3xl bg-white border border-border overflow-hidden shadow-2xl relative z-10">
            <ImageWithFallback
              src={droneDeliveryImg}
              alt="Medical delivery drones operating in urban environment"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="absolute -top-6 -left-6 size-24 bg-primary/5 rounded-full blur-2xl -z-10" />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="mb-8">Why Now?</h2>
          <p className="text-lg leading-relaxed mb-8 text-muted-foreground">
            As BVLOS trials transition into routine commercial services, expectations are changing. Regulators, insurers, and enterprise clients increasingly require operators to demonstrate:
          </p>
          <ul className="space-y-4 mb-8">
            {[
              "Fast and Formal landowner permission",
              "Defined Emergency and Recovery landing options",
              "Evidence of controlled ground access",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary" />
                <span className="font-semibold text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-lg leading-relaxed text-muted-foreground mb-6">
            Manual land negotiations and one-off agreements do not scale.
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            VertiAccess provides an operational framework that supports the next phase of operational and regulatory maturity, enabling scalable and coordinated access to ground infrastructure across the ecosystem.
          </p>
        </div>
      </section>
    </div>
  );
}
