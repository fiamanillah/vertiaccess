import { useState } from "react";
import type { PricingTier } from "../LandingPage";
import { SignupForm } from "./SignupForm";
import { RoleSelection } from "./RoleSelection";

interface SignupViewProps {
  onSignupComplete: (email: string) => void;
  onBack: () => void;
  onLogin: () => void;
  selectedTier?: PricingTier | null;
}

export function SignupView({
  onSignupComplete,
  onBack,
  onLogin,
  selectedTier,
}: SignupViewProps) {
  const [selectedRole, setSelectedRole] = useState<
    "operator" | "landowner" | "admin" | null
  >(null);

  const activeRole = selectedRole || (selectedTier ? "operator" : null);
  const isFormView = !!activeRole && activeRole !== "admin";

  const handleRoleSelect = (role: "operator" | "landowner" | "admin") => {
    if (role === "admin") {
      // Admin access is not self-service with Cognito
      // Admins are created through the AWS Console or by another admin
      onLogin();
    } else {
      setSelectedRole(role);
    }
  };

  const handleFormBack = () => {
    if (selectedTier) onBack();
    else setSelectedRole(null);
  };

  if (isFormView) {
    return (
      <SignupForm
        activeRole={activeRole}
        selectedTier={selectedTier}
        onBack={handleFormBack}
        onSignupComplete={onSignupComplete}
      />
    );
  }

  return (
    <RoleSelection
      onBack={onBack}
      onSelectRole={handleRoleSelect}
      onLogin={onLogin}
    />
  );
}
