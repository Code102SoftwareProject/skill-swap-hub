import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Suspended - SkillSwap Hub",
  description: "Your account has been suspended. Contact support for assistance.",
};

export default function AccountSuspendedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
