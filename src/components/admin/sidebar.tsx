"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  ShieldCheck
} from "lucide-react";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";

const menuItems = [
  { icon: LayoutDashboard, label: "Dasbor", href: "/admin" },
  { icon: Users, label: "Karyawan", href: "/admin/employees" },
  { icon: Calendar, label: "Pemantauan", href: "/admin/monitoring" },
  { icon: BarChart3, label: "Laporan", href: "/admin/reports" },
  { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen glass border-r border-border flex flex-col fixed left-0 top-0 z-50">
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
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
              pathname === item.href 
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" 
                : "text-gray-500 hover:bg-accent/10 hover:text-accent"
            )}
          >
            <item.icon className={clsx("w-5 h-5", pathname === item.href ? "text-white" : "text-gray-400 group-hover:text-accent")} />
            {item.label}
          </Link>
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
  );
}
