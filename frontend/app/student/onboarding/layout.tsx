"use client";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // ใช้ layout นี้เพื่อไม่ให้ wrap ด้วย sidebar/topbar ของ student
  return children;
}
