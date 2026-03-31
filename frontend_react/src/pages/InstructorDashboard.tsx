import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchInstructorCourses, createCourse, deleteCourse, updateCourse } from '../api/instructor';
import type { Course } from '../api/instructor';
import { LogOut, Plus, BookOpen, Trash2, ChevronRight, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InstructorDashboard = () => {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', difficulty: 'BEGINNER', course_link: '' });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      const data = await fetchInstructorCourses(user!.id);
      setCourses(data);
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('instructor_id', user!.id.toString());
    formData.append('title', newCourse.title);
    formData.append('description', newCourse.description);
    formData.append('difficulty', newCourse.difficulty);
    formData.append('course_link', newCourse.course_link);
    if (thumbnail) formData.append('thumbnail', thumbnail);

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
      } else {
        await createCourse(formData);
      }
      setIsModalOpen(false);
      setEditingCourse(null);
      setNewCourse({ title: '', description: '', difficulty: 'BEGINNER', course_link: '' });
      setThumbnail(null);
      loadCourses();
    } catch (err) {
      console.error("Failed to save course", err);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      course_link: course.course_link || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteCourse = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteCourse(id);
        loadCourses();
      } catch (err) {
        console.error("Failed to delete course", err);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <span className="text-white font-black text-lg italic">SF</span>
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tight">SkillForge <span className="text-emerald-500 text-xs uppercase ml-1">Instructor</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900">{user.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Instructor Portal</p>
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
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">My Courses</h1>
            <p className="text-gray-500 font-medium">Manage your curriculum and student materials.</p>
          </div>
          <button 
            onClick={() => { setEditingCourse(null); setNewCourse({ title: '', description: '', difficulty: 'BEGINNER', course_link: '' }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95"
          >
            <Plus size={16} />
            Create Course
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
              <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-gray-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No courses yet. Start by creating one!</p>
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                        <BookOpen size={48} className="text-emerald-200" />
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg">{course.difficulty}</span>
                    </div>
                    <h3 onClick={() => handleEditCourse(course)} className="text-xl font-black text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors cursor-pointer">{course.title}</h3>
                    <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2">{course.description || 'No description provided.'}</p>
                    <button 
                      onClick={() => navigate(`/instructor/course/${course.id}`)}
                      className="mt-auto w-full py-4 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      Manage Content
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-fade-in">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900 italic">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g. Mastering React 19"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="What will students learn?"
                  rows={3}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Difficulty</label>
                  <select
                    value={newCourse.difficulty}
                    onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Thumbnail</label>
                  <label className="w-full flex items-center gap-2 px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold text-gray-500 cursor-pointer hover:bg-emerald-50 transition-all shadow-inner">
                    <Upload size={18} />
                    <span className="truncate">{thumbnail ? thumbnail.name : 'Choose File'}</span>
                    <input type="file" hidden accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all active:scale-95"
              >
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
