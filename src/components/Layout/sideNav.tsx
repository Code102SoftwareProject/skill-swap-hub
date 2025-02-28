import type React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  Users,
  Calendar,
  Timer,
  Shield,
  MessageSquarePlus,
  Settings,
  LogOut,
} from "lucide-react"

export function SideNav() {
  return (
    <nav className="w-60 border-r bg-background flex flex-col">
      <div className="flex-1 py-4">
        <div className="px-4 space-y-1">
          <NavItem icon={<LayoutDashboard className="h-4 w-4" />} href="/dashboard">
            Dashboard
          </NavItem>
          <NavItem icon={<ListChecks className="h-4 w-4" />} href="/my-skills">
            My skills
          </NavItem>
          <NavItem icon={<ClipboardList className="h-4 w-4" />} href="/listings">
            Listings
          </NavItem>
          <NavItem icon={<Users className="h-4 w-4" />} href="/matches">
            Matches
          </NavItem>
          <NavItem icon={<Calendar className="h-4 w-4" />} href="/meetings">
            Meetings
          </NavItem>
          <NavItem icon={<Timer className="h-4 w-4" />} href="/sessions">
            Sessions
          </NavItem>
          <NavItem icon={<Shield className="h-4 w-4" />} href="/skill-verify">
            Skill Verify
          </NavItem>
          <NavItem icon={<MessageSquarePlus className="h-4 w-4" />} href="/suggestions" active>
            Suggestions
          </NavItem>
          <NavItem icon={<Settings className="h-4 w-4" />} href="/settings">
            Settings
          </NavItem>
        </div>
      </div>
      <div className="p-4 border-t">
        <NavItem icon={<LogOut className="h-4 w-4" />} href="/sign-out">
          Sign Out
        </NavItem>
      </div>
    </nav>
  )
}

function NavItem({
  icon,
  children,
  href,
  active,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  href: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
        active ? "bg-blue-600 text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}

