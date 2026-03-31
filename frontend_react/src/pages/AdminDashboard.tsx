import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getAdminUsers, deleteUser } from '../api/admin';
import type { AdminStats, AdminUser } from '../api/admin';
import { LogOut, GraduationCap, BookOpen, Trash2, Shield, Search, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<{ students: AdminUser[], instructors: AdminUser[] }>({ students: [], instructors: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'instructors'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        getAdminStats(),
        getAdminUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (role: string, id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${role} "${name}"? This action cannot be undone.`)) {
      try {
        await deleteUser(role, id);
        loadData();
      } catch (err) {
        console.error("Failed to delete user", err);
      }
    }
  };

  if (!user) return null;

  const filteredUsers = activeTab === 'students' 
    ? users.students.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    : users.instructors.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Shield className="text-white" size={20} />
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tight">SkillForge <span className="text-indigo-600 text-xs uppercase ml-1 tracking-widest">Admin</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900">{user.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Super Admin Access</p>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 italic">Dashboard Overview</h1>
          <p className="text-gray-500 font-medium">Global platform metrics and user management.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <GraduationCap size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Students</p>
              <p className="text-3xl font-black text-gray-900">{stats?.totalStudents || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <UserCheck size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Instructors</p>
              <p className="text-3xl font-black text-gray-900">{stats?.totalInstructors || 0}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <BookOpen size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Courses</p>
              <p className="text-3xl font-black text-gray-900">{stats?.totalCourses || 0}</p>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-gray-50 p-1.5 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('students')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Students
              </button>
              <button 
                onClick={() => setActiveTab('instructors')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'instructors' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Instructors
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-gray-700 w-full md:w-64 shadow-inner"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                  {activeTab === 'students' && (
                    <>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</th>
                    </>
                  )}
                  <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold">
                      No {activeTab} found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${activeTab === 'students' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-gray-500 italic">{u.email}</td>
                      {activeTab === 'students' && (
                        <>
                          <td className="px-8 py-5">
                            <span className={`px-2 py-1 text-[8px] font-black uppercase rounded-lg ${
                              u.level === 'ADVANCED' ? 'bg-emerald-50 text-emerald-600' :
                              u.level === 'INTERMEDIATE' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {u.level || 'BEGINNER'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-sm font-black text-gray-900">{u.points || 0} pts</span>
                          </td>
                        </>
                      )}
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.role, u.id, u.name)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
