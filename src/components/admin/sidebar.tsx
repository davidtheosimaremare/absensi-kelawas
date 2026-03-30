"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Calendar, BarChart3, Settings,
  LogOut, ShieldCheck, Menu, X
} from "lucide-react";
import { signOut } from "next-auth/react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dasbor", href: "/admin" },
  { icon: Users, label: "Karyawan", href: "/admin/employees" },
  { icon: Calendar, label: "Pemantauan", href: "/admin/monitoring" },
  { icon: BarChart3, label: "Laporan", href: "/admin/reports" },
  { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
];

function NavItem({ item, pathname, onClick }: { item: typeof menuItems[0]; pathname: string; onClick?: () => void }) {
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium ${
        active
          ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
          : "text-gray-500 hover:bg-accent/10 hover:text-accent"
      }`}
    >
      <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-accent"}`} />
      {item.label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-64 h-screen glass border-r border-border flex-col fixed left-0 top-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/20">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Smart-Check</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Panel Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-sm font-medium group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/20">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <span className="font-bold text-base">Smart-Check</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl hover:bg-accent/10 transition-colors"
        >
          <Menu className="w-6 h-6 text-accent" />
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="w-72 h-full glass border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/20">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h1 className="font-bold text-base leading-tight">Smart-Check</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Panel Admin</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-sm font-medium group"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border flex items-center justify-around px-2 py-2">
        {menuItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                active ? "text-accent" : "text-gray-400 hover:text-accent"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "text-accent" : ""}`} />
              <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
