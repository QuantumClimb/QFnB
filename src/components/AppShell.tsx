import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Grid, 
  ListOrdered,
  UtensilsCrossed,
  Users, 
  Tag, 
  BarChart3, 
  UserCheck,
  Settings, 
  Building2, 
  Store, 
  ChevronDown, 
  Menu, 
  X, 
  LogOut, 
  Bell, 
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../features/staff/permissions";
import type { Permission } from "../features/staff/permissions";

type AppShellProps = Readonly<{
  children: React.ReactNode;
}>;

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 
   * Required permission to show this nav item.
   * If undefined, item is always shown.
   * NOTE: This is UX filtering only. Backend enforces real authorization via RLS.
   */
  requiredPermission?: Permission;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isDevPreview } = useAuth();
  const { 
    organizations, 
    currentOrg, 
    setCurrentOrg, 
    outlets, 
    currentOutlet, 
    setCurrentOutlet, 
    role 
  } = useOrg();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);

  /**
   * Role-aware navigation definition.
   *
   * Each nav item may declare a requiredPermission.
   * Items without a permission are always shown (e.g., TODAY for all roles).
   * DEV PREVIEW always shows the full nav (treated as owner role).
   *
   * SECURITY: This filtering is UX only. Backend RLS enforces real authorization.
   * Role-aware examples:
   *   HOST        → Today, Reservations, Floor, Queue, Guests
   *   WAITER      → Today, Floor, Orders, Guests
   *   KITCHEN     → Orders (kitchen view)
   *   BAR         → Orders (bar view)
   *   MANAGER     → All operational + Insights + Staff read + Settings read
   *   OWNER/ADMIN → Full access
   */
  const allNavSections: NavSection[] = [
    {
      items: [
        { label: "TODAY", path: "/app/overview", icon: LayoutDashboard, requiredPermission: "today.read" },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { label: "Reservations",  path: "/app/reservations", icon: CalendarCheck,   requiredPermission: "reservations.read" },
        { label: "Floor",         path: "/app/floor",        icon: Grid,            requiredPermission: "floor.read" },
        { label: "Queue",         path: "/app/queue",        icon: ListOrdered,     requiredPermission: "queue.read" },
        { label: "Orders",        path: "/app/orders",       icon: UtensilsCrossed, requiredPermission: "orders.read" },
      ],
    },
    {
      title: "GUESTS",
      items: [
        { label: "Guest Profiles", path: "/app/guests", icon: Users, requiredPermission: "guests.read" },
      ],
    },
    {
      title: "GROW",
      items: [
        { label: "Offers & Experiences", path: "/app/offers", icon: Tag, requiredPermission: "offers.read" },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { label: "Insights", path: "/app/insights",  icon: BarChart3,  requiredPermission: "insights.read" },
        { label: "Staff",    path: "/app/staff",     icon: UserCheck,  requiredPermission: "staff.read" },
        { label: "Settings", path: "/app/settings",  icon: Settings,   requiredPermission: "settings.read" },
      ],
    },
  ];

  /**
   * Filter nav items by current role using centralized hasPermission() utility.
   * DEV PREVIEW (isDevPreview) uses full nav — treated as owner in DEV mode.
   */
  const filteredNavSections: NavSection[] = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.requiredPermission) return true;
        if (isDevPreview) return true; // DEV PREVIEW shows all
        return hasPermission(role, item.requiredPermission);
      }),
    }))
    .filter((section) => section.items.length > 0);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-200">
      
      {/* TOP CONTEXT BAR */}
      <header className="h-16 bg-zinc-900 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
        
        {/* Left: Brand Identity & Org/Outlet Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden p-2 text-zinc-400 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/app/overview" className="flex items-center gap-2 font-mono font-black text-lg tracking-wider text-white">
            <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs">Q</span>
            <span>F&B OS</span>
          </Link>

          {/* Development Mode Badge */}
          {isDevPreview && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px] uppercase font-bold rounded">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>DEV PREVIEW</span>
            </span>
          )}

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

          {/* Org & Outlet Selectors */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-xs">
            
            {/* Org Switcher */}
            <div className="relative">
              <button 
                onClick={() => { setOrgDropdownOpen(!orgDropdownOpen); setOutletDropdownOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-white/10 hover:border-purple-500/40 text-zinc-300 rounded transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-bold text-white max-w-[140px] truncate">{currentOrg?.name || "Select Org"}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {orgDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-white/10 rounded shadow-xl py-1 z-50">
                  <div className="px-3 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    ORGANIZATIONS
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => { setCurrentOrg(org); setOrgDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-zinc-300 hover:text-white flex items-center justify-between"
                    >
                      <span>{org.name}</span>
                      {org.id === currentOrg?.id && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Outlet Switcher */}
            <div className="relative">
              <button 
                onClick={() => { setOutletDropdownOpen(!outletDropdownOpen); setOrgDropdownOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-white/10 hover:border-amber-500/40 text-zinc-300 rounded transition-colors"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-white max-w-[140px] truncate">{currentOutlet?.name || "Select Outlet"}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {outletDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-white/10 rounded shadow-xl py-1 z-50">
                  <div className="px-3 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    OUTLETS
                  </div>
                  {outlets.map((out) => (
                    <button
                      key={out.id}
                      onClick={() => { setCurrentOutlet(out); setOutletDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-zinc-300 hover:text-white flex items-center justify-between"
                    >
                      <span>{out.name}</span>
                      {out.id === currentOutlet?.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] uppercase font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>ROLE: {role.toUpperCase()}</span>
          </div>

          <button className="p-2 text-zinc-400 hover:text-white relative" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </button>

          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </header>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-64 bg-zinc-900 border-r border-white/10 hidden lg:flex flex-col justify-between p-4 flex-shrink-0 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Active Outlet Banner */}
            <div className="p-3 bg-zinc-950 border border-white/10 rounded font-mono text-xs">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">ACTIVE LOCATION</div>
              <div className="font-bold text-white truncate mt-0.5">
                {currentOutlet?.name || "DEMO OUTLET"}
              </div>
              <div className="text-[10px] text-purple-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>{isDevPreview ? "DEV PREVIEW MODE" : "TENANT SESSION"}</span>
              </div>
            </div>

            {/* Role-Aware Navigation */}
            <nav className="space-y-5 font-mono text-xs">
              {filteredNavSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {section.title && (
                    <div className="px-3 py-1 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? "bg-purple-600/20 text-white border border-purple-500/40 font-bold" 
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-zinc-400"}`} />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-white/10 font-mono text-[10px] text-zinc-500 space-y-1">
            <div className="text-zinc-400 font-bold">Q F&B OS</div>
            <div className="text-zinc-500 text-[9px]">The live operating system for hospitality.</div>
            <div className="pt-2 text-[9px] text-zinc-600 tracking-wider">Powered by Quantum Climb</div>
          </div>
        </aside>

        {/* MOBILE DRAWER MENU */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative bg-zinc-900 w-72 max-w-full p-6 flex flex-col justify-between z-50 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="font-mono font-black text-white text-lg">Q F&B OS</div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-5 font-mono text-xs">
                  {filteredNavSections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                      {section.title && (
                        <div className="px-3 py-1 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                          {section.title}
                        </div>
                      )}
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                              isActive ? "bg-purple-600/20 text-white font-bold border border-purple-500/40" : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            <Icon className="w-4 h-4 text-purple-400" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-mono text-zinc-500">
                {currentOutlet?.name || "DEMO OUTLET"}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col">
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </div>
          {/* Global Footer Credit */}
          <footer className="border-t border-white/5 py-3 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-sans text-zinc-600 tracking-wider select-none">
              Powered by{" "}
              <span className="text-zinc-500 font-semibold">Quantum Climb</span>
            </p>
          </footer>
        </main>

      </div>

    </div>
  );
}
