// page.tsx
'use client';
import Navbar from "../components/Navbar";
import Dashboard from "@/components/Dashboard/Dashboard";


export default function Home() {
  return (
      <>
        <div className="p-8">
         <Navbar userName={"Nethmal"} userImage={""} />
        </div>
        <Dashboard/>
      </>
  );
}


     