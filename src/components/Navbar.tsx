import Link from "next/link";

const AdminNavbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-md">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between relative">
        
        {/* Left Logo */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Center Title */}
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">
          Admin Dashboard
        </h1>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {/* Messages */}
          <Link href="/">
            <div className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-200 transition">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/ios-filled/24/000000/speech-bubble--v1.png"
                alt="Messages"
              />
            </div>
          </Link>

          {/* Notifications */}
          <Link href="/">
            <div className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-200 transition">
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/ios-filled/24/000000/appointment-reminders--v1.png"
                alt="Notifications"
              />
            </div>
          </Link>

          {/* Admin Profile */}
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm hover:bg-gray-100 cursor-pointer">
          <img width="30" height="30" src="https://img.icons8.com/ios-filled/30/1A1A1A/gender-neutral-user.png" alt="gender-neutral-user"/>
            <span className="text-sm font-medium text-black">Admin 0121</span>
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
