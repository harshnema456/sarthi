"use client";

import dynamic from "next/dynamic";

const InhubDashboard = dynamic(
  () => import('@/components/custom/InhubDashboard'),
  { ssr: false }
);

export default function Home() {
  return <InhubDashboard />;
}
