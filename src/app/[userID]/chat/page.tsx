"use client"; // Mark this as a client component

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/messageSystem/Sidebar";

export default function ChatPage() {
  const params = useParams();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (params?.userId) {
      setUserId(params.userId as string);
    }
  }, [params]);

  if (!userId) {
    return <p className="text-center mt-10 text-gray-600">Loading...</p>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar component with userId */}
      <Sidebar userId={userId} />
    </div>
  );
}
