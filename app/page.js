"use client";

import dynamic from "next/dynamic";

const Homepage = dynamic(
  () => import('@/components/custom/Homepage'),
  { ssr: false }
);
export default function Home() {
  return <Homepage />;
}




