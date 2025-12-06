"use client";
import React from "react";
import InhubDashboard from "@/components/custom/InhubDashboard";

export default function Page({ params }) {
  const { id } = React.use(params);
  console.log("InhubDashboard Page params:", id);  
  return <InhubDashboard userId={id} />;
}
