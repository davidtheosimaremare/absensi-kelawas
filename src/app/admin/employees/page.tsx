"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, MoreVertical, Trash2, Mail, CreditCard, ShieldCheck, Loader2 } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  ktp: string | null;
  faceData: string | null;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", password: "", ktp: "" });
  const [addingEmployee, setAddingEmployee] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data);
    setLoading(false);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEmployee(true);
    const res = await fetch("/api/employees", {
      method: "POST",
      body: JSON.stringify(newEmployee),
    });
    if (res.ok) {
      setShowAddModal(false);
      setNewEmployee({ name: "", email: "", password: "", ktp: "" });
      fetchEmployees();
    }
    setAddingEmployee(false);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) fetchEmployees();
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Direktori Karyawan</h2>
          <p className="text-gray-500">Kelola tenaga kerja, pendaftaran, dan kredensial Anda.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-accent/20"
        >
          <UserPlus className="w-5 h-5" />
          Tambah Karyawan
        </button>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama atau email..."
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm glass"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="glass h-48 rounded-3xl animate-pulse" />
          ))
        ) : (
          filteredEmployees.map((employee) => (
            <div key={employee.id} className="glass p-6 rounded-3xl border border-border group hover:border-accent/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent font-bold text-lg">
                  {employee.name[0]}
                </div>
                <button 
                  onClick={() => handleDeleteEmployee(employee.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg">{employee.name}</h3>
                <div className="space-y-1.5 underline-offset-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-4 h-4" />
                    {employee.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CreditCard className="w-4 h-4" />
                    KTP: {employee.ktp || "Belum Diatur"}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${employee.faceData ? 'text-green-500' : 'text-orange-500'}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {employee.faceData ? 'Wajah Terdaftar' : 'Wajah Tertunda'}
                </span>
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full font-bold">
                  KARYAWAN
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6">Daftar Karyawan Baru</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <input 
                type="text" 
                placeholder="Nama Lengkap" 
                required
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              />
              <input 
                type="email" 
                placeholder="Alamat Email" 
                required
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
              <input 
                type="password" 
                placeholder="Kata Sandi" 
                required
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              />
              <input 
                type="text" 
                placeholder="Nomor KTP (Opsional)" 
                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-accent outline-hidden transition-all text-sm"
                value={newEmployee.ktp}
                onChange={(e) => setNewEmployee({ ...newEmployee, ktp: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={addingEmployee}
                  className="flex-3 py-3 bg-accent text-accent-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 transition-all"
                >
                  {addingEmployee ? <Loader2 className="w-5 h-5 animate-spin" /> : "Daftar Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
