'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@workspace/ui/components/button'
import { Rocket, Shield, Map } from 'lucide-react'
import { Card } from '@workspace/ui/components/card'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl text-center space-y-12 relative z-10">
        
        {/* Header Section */}
        <div className="space-y-6 flex flex-col items-center">
          <div className="mb-4">
            <Image src="/logo.png" alt="VertiAccess Logo" width={380} height={100} className="object-contain" priority />
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl font-medium">
            The next generation of drone flight operations and landing site management. We are currently building something amazing.
          </p>
          <div className="inline-block mt-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Platform Under Construction
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-16">
          <Card className="p-6 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <Rocket className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-bold text-lg tracking-tight mb-2">Operator Missions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Seamlessly book and manage your drone flight operations across certified sites.</p>
          </Card>
          
          <Card className="p-6 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <Map className="h-8 w-8 text-indigo-500 mb-4" />
            <h3 className="font-bold text-lg tracking-tight mb-2">Site Management</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">List your properties and monetize your land with automated access control.</p>
          </Card>

          <Card className="p-6 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <Shield className="h-8 w-8 text-emerald-500 mb-4" />
            <h3 className="font-bold text-lg tracking-tight mb-2">Verified Security</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">End-to-end identity verification and strict compliance standards for all users.</p>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="pt-10 mt-10 border-t border-border/40">
          <h2 className="text-xl font-bold mb-6 tracking-tight">Early Access Portal</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto font-black tracking-widest uppercase h-14 px-10 shadow-lg shadow-primary/20" asChild>
              <Link href="/login">
                Sign In
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-black tracking-widest uppercase h-14 px-10 border-primary/20 hover:bg-primary/5" asChild>
              <Link href="/signup">
                Create Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center w-full">
        <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
          © {new Date().getFullYear()} VertiAccess Limited. All rights reserved.
        </p>
      </div>
    </div>
  )
}
