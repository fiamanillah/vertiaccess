import { Globe } from "lucide-react";
import { VertiAccessLogo } from "../VertiAccessLogo";

type View = "home" | "about" | "request-demo" | "login" | "signup";

interface FooterProps {
  onNavigate: (view: View) => void;
  onScrollToSection: (id: string) => void;
  onRequestDemo: () => void;
  onSolutionClick: (role: "operator" | "landowner") => void;
}

export function Footer({
  onNavigate,
  onScrollToSection,
  onRequestDemo,
  onSolutionClick,
}: FooterProps) {
  return (
    <footer className="bg-white border-t border-border pt-20 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2">
            <VertiAccessLogo className="h-10 mb-6" />
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
              Connecting drone operators to landowners at scale.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Platform</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection("how-it-works")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  How it works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection("pricing")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Choose your Plan
                </button>
              </li>
              <li>
                <button
                  onClick={onRequestDemo}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Request a Demo
                </button>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Solutions</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSolutionClick("operator")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  For Operators
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSolutionClick("landowner")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  For Landowners
                </button>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onScrollToSection("faq")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={onRequestDemo}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground">
            © 2026 VertiAccess. Professional ground access coordination for
            drone operations.
          </p>
          <div className="flex items-center gap-6">
            <Globe className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              United Kingdom (Operational Conventions)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
