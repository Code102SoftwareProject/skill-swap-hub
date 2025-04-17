// page.tsx (home page)
'use client';
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/chatassistant/chatbot";
export default function Home() {
  return (
    <>
      <div>
        <Navbar />
        <Chatbot/>
      </div>
    
    </>
  );
}