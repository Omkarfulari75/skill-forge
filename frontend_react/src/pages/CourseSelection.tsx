import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAvailableCourses } from '../api/student';
import type { Course } from '../api/instructor';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, LogOut } from 'lucide-react';

const CourseSelection = () => {
  const { user, selectCourse, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await fetchAvailableCourses();
      setCourses(data);
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (courseId: number) => {
    selectCourse(courseId);
    navigate('/dashboard');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-black text-lg italic">SF</span>
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tight">SkillForge</span>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4 italic">Choose Your Path</h1>
          <p className="text-gray-500 font-medium text-lg">Select a course to begin your personalized learning journey.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-400">
                <BookOpen size={64} className="mx-auto mb-4 opacity-10" />
                <p className="text-xl font-bold">No courses available at the moment.</p>
              </div>
            ) : (
              courses.map(course => (
                <div 
                  key={course.id} 
                  onClick={() => handleSelectCourse(course.id)}
                  className="bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group overflow-hidden flex flex-col"
                >
                  <div className="h-56 bg-gray-100 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <BookOpen size={64} className="text-blue-100" />
                      </div>
                    )}
                    <div className="absolute top-6 left-6">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase rounded-full text-blue-600 shadow-sm">
                        {course.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-gray-500 font-medium text-sm line-clamp-3 mb-8 flex-1">{course.description || 'Embark on a comprehensive learning journey designed to master this subject from scratch.'}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Learning</span>
                      <div className="w-12 h-12 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseSelection;
