// page.tsx (home page)
'use client';
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard/Dashboard";

export default function Home() {
  return (
    <>
      <div>
        <Navbar />
      </div>
      <Dashboard />
    </>
  );
}