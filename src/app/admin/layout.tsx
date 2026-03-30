import Sidebar from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      {/* Desktop: offset left for sidebar. Mobile: top padding for topbar, bottom padding for bottom nav */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 p-4 md:p-8 relative overflow-x-hidden">
        {/* Background blobs */}
        <div className="fixed top-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px] -z-10" />
        <div className="fixed bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
