"use client";
import InhubDashboard from "@/components/custom/InhubDashboard";


export default function Page({ params }) {
  const { id } = params;

  return <InhubDashboard userId={id} />;
}
