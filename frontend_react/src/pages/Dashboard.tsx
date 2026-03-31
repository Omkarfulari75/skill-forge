import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, Trophy, Clock, ChevronRight } from 'lucide-react';
import AIAdaptiveEngine from '../components/AIAdaptiveEngine';
import { useState, useEffect } from 'react';
import { fetchCourseDashboard } from '../api/student';
import type { Course, Topic } from '../api/instructor';

const Dashboard = () => {
  const { user, selectedCourseId, logout } = useAuth();
  const navigate = useNavigate();
  const [showAIEngine, setShowAIEngine] = useState(false);
  const [courseData, setCourseData] = useState<{ course: Course, topics: Topic[], stats: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !selectedCourseId) {
      navigate('/select-course');
    } else if (user && selectedCourseId) {
      loadDashboard();
    }
  }, [user, selectedCourseId]);

  const loadDashboard = async () => {
    try {
      const data = await fetchCourseDashboard(user!.id, selectedCourseId!);
      setCourseData(data);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Sidebar/Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-black text-lg italic">SF</span>
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tight">SkillForge</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/select-course')}
            className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            Change Course
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900">{user.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role || 'Student'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 italic">
            {courseData?.course.title || 'Learning Path'}
          </h1>
          <p className="text-gray-500 font-medium">Welcome back, {user?.name?.split(' ')[0]}! You've completed {courseData?.stats.progressPercent || 0}% of this course.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <BookOpen size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Topics Remaining</p>
            <p className="text-3xl font-black text-gray-900">
              {(courseData?.stats.totalTopics || 0) - (courseData?.stats.completedTopics || 0)}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <Trophy size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Points Earned</p>
            <p className="text-3xl font-black text-gray-900">{user.points || 1250}</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
              <Clock size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Learning Hours</p>
            <p className="text-3xl font-black text-gray-900">24.5</p>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : showAIEngine ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <AIAdaptiveEngine 
              studentId={user.id} 
              courseId={selectedCourseId!} 
              courseTitle={courseData?.course.title} 
              onClose={() => setShowAIEngine(false)} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Curriculum</h2>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{courseData?.topics.length || 0} Topics Total</span>
              </div>
              
              {courseData?.topics.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center text-gray-400">
                  <p className="font-bold">No topics added to this course yet.</p>
                </div>
              ) : (
                courseData?.topics.map((topic: any) => (
                  <div key={topic.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-6 group">
                    <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center ${topic.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      <BookOpen size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {topic.status === 'COMPLETED' ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg">Completed</span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg">Pending</span>
                        )}
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Score: {topic.last_score || 0}%</span>
                      </div>
                      <h3 className="font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{topic.name}</h3>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Course Assessment</h2>
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
                <Trophy className="mb-4 text-blue-200" size={32} />
                <h3 className="font-black text-xl mb-2">Mastery Quiz</h3>
                <p className="text-sm text-blue-100 font-medium mb-6 leading-relaxed">
                  Generate a personalized quiz based on this course's curriculum to evaluate your proficiency and get enhancement tips.
                </p>
                <button 
                  onClick={() => setShowAIEngine(true)}
                  className="w-full py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform active:scale-95"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
