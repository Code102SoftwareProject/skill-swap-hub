import Link from "next/link";
import { MessageSquare, Bell, ChevronDown, User, MessageCircle } from "lucide-react";

const AdminNavbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-md">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between relative">
        
        {/* Left Logo */}
        <div className="flex items-center gap-2">
          <div className="cursor-default">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
        </div>

        {/* Center Title */}
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">
          Admin 
        </h1>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {/* Messages */}
          <Link href="/">
            <div className="p-2  rounded-md shadow-sm hover:bg-blue-900 transition">
              <MessageSquare 
                size={24} 
                className="text-white " 
                fill="white" 
              />
            </div>
          </Link>



          {/* Admin Profile */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full shadow-sm hover:bg-blue-900 hover:text-black cursor-pointer">
            <User size={24} className="text-white" fill="white"/>
            <span className="text-l font-semibold text-white">Admin 0121</span>
            <ChevronDown size={16} className="text-gray-600" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
