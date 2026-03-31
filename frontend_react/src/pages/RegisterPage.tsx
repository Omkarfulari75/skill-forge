import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { AxiosError } from 'axios';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'admin') {
      setError('Admin registration restricted.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await registerUser(name, email, password, role);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-outfit">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mx-auto mb-6">
          <span className="text-white font-black text-2xl italic">SF</span>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create your account</h2>
        <p className="mt-2 text-sm text-gray-500">Join our community of lifelong learners.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] sm:rounded-[2.5rem] border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-shake">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-xs font-bold animate-fade-in">
                {success}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Join as</label>
              <div className="flex bg-gray-50 rounded-2xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'student' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'instructor' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
                >
                  Instructor
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Get Started'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors">
              Already have an account? Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
