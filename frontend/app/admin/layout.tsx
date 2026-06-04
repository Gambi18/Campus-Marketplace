import AdminSidebar from '../components/admin/AdminSidebar';

export const metadata = {
  title: 'Admin | Campus Marketplace',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center">
          <h1 className="text-sm font-semibold text-brand-neutral">CampusMarket Admin</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
