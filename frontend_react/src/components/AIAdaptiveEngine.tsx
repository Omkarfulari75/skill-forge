import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Target, Zap, ChevronRight, CheckCircle2, AlertCircle, BrainCircuit, Trophy } from 'lucide-react';

interface AdaptiveData {
  next_lesson: string;
  next_lesson_links: {
    youtube: string;
    reference: string;
  };
  recommended_level: string;
  progress: {
    percentage: number;
    color: 'red' | 'yellow' | 'green';
  };
  quiz: {
    mcqs: Array<{ question: string; options: string[]; answer: string }>;
  };
  performance_analysis: {
    strong_topics: string[];
    weak_topics: string[];
    suggestions: string;
  };
}

interface Props {
  studentId: number;
  courseId: number;
  courseTitle?: string;
  onClose?: () => void;
}

const AIAdaptiveEngine: React.FC<Props> = ({ studentId, courseId, courseTitle, onClose }) => {
  const [data, setData] = useState<AdaptiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => {
    fetchAdaptiveData();
  }, [studentId, courseId]);

  const fetchAdaptiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('http://localhost:5000/api/adaptive-learning', {
        student_id: studentId,
        course_id: courseId,
        topic: courseTitle || 'Overall Course Assessment' 
      });
      setData(response.data);
    } catch (error: any) {
      console.error('Error fetching adaptive data:', error);
      setError(error.response?.data?.error || 'AI Adaptive Engine is taking a short break. Please try again in 30 seconds.');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelUpdate = async (score: number) => {
      try {
          await axios.post('http://localhost:5000/api/update-course-progress', {
              student_id: studentId,
              course_id: courseId,
              topic_id: 1, // Mock topic ID for now, should be passed from data
              score: score,
              status: 'COMPLETED'
          });
      } catch (err) {
          console.error("Progress update failed", err);
      }
  };

  const handleQuizSubmit = async () => {
    let score = 0;
    data?.quiz.mcqs.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) score++;
    });
    setQuizScore(score);
    
    // Explicitly update global level based on score
    try {
        await axios.post('http://localhost:5000/api/update-level', {
            student_id: studentId,
            score: score
        });
        await handleLevelUpdate(score);
    } catch (err) {
        console.error("Level update failed", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold animate-pulse">SkillForge AI is analyzing your performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-center bg-red-50/50 rounded-[3rem] border-2 border-dashed border-red-100">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Engine Sync Issue</h3>
        <p className="text-gray-500 font-medium max-w-xs mx-auto mb-8">{error}</p>
        <button 
          onClick={fetchAdaptiveData}
          className="px-8 py-3 bg-red-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <BrainCircuit size={18} />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">AI Adaptive Engine</h2>
        </div>
        {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 font-bold text-sm">Close</button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Suggestion */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
              <Sparkles size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Next Suggested Lesson</p>
            <h3 className="text-2xl font-black text-gray-900 mb-4">{data.next_lesson}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg">
                  Level: {data.recommended_level}
                </span>
                <button className="flex items-center text-blue-600 font-bold text-sm gap-1 hover:gap-2 transition-all">
                  Start Now <ChevronRight size={16} />
                </button>
              </div>
              
              {data.next_lesson_links && (
                <div className="flex gap-2 mt-2">
                  {data.next_lesson_links.youtube && (
                    <a href={data.next_lesson_links.youtube} target="_blank" rel="noreferrer" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="YouTube Video">
                      <Sparkles size={16} />
                    </a>
                  )}
                  {data.next_lesson_links.reference && (
                    <a href={data.next_lesson_links.reference} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Reference Link">
                      <BrainCircuit size={16} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="relative">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-200">
                <Target size={24} />
              </div>
              <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                data.progress.color === 'green' ? 'bg-emerald-50 text-emerald-600' : 
                data.progress.color === 'yellow' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
              }`}>
                {data.progress.percentage}% Complete
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Overall Mastery</p>
            <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 mb-4">
              <div 
                className={`h-full transition-all duration-1000 ${
                  data.progress.color === 'green' ? 'bg-emerald-500' : 
                  data.progress.color === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${data.progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 font-medium italic">"{data.performance_analysis.suggestions}"</p>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <AlertCircle size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-900 italic tracking-tight underline decoration-purple-200 underline-offset-8">AI Analytics Report</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500" /> Strong Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.performance_analysis.strong_topics.map(topic => (
                <span key={topic} className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-2xl border border-emerald-100">
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle size={12} className="text-amber-500" /> Improvement Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.performance_analysis.weak_topics.map(topic => (
                <span key={topic} className="px-4 py-2 bg-amber-50 text-amber-700 font-bold text-xs rounded-2xl border border-amber-100" title="AI identified lower accuracy in these areas">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Trigger Section */}
      {!showQuiz ? (
        <div className="bg-gradient-to-br from-indigo-700 to-blue-800 p-12 rounded-[3.5rem] text-white shadow-2xl shadow-blue-300 flex flex-col items-center text-center">
          <Zap className="text-yellow-400 mb-6 animate-pulse" size={48} />
          <h2 className="text-3xl font-black mb-4">Adaptive Assessment</h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-10 font-medium text-lg leading-relaxed">
            Our AI has crafted a personalized evaluation based on your recent activity. Complete this to upgrade your learning level.
          </p>
          <button 
            onClick={() => setShowQuiz(true)}
            className="px-10 py-5 bg-white text-blue-700 font-black rounded-[2rem] text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-transform active:scale-95"
          >
            Start AI Evaluation
          </button>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[4rem] border-2 border-blue-50 shadow-2xl animate-in zoom-in-95 duration-500">
          {quizScore === null ? (
            <div className="max-w-3xl mx-auto">
              {/* Quiz Header */}
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">Knowledge Check</h3>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Question {currentQuizStep + 1} of 5</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                  {Math.round(((currentQuizStep + 1) / 5) * 100)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-50 h-2 rounded-full mb-12 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${((currentQuizStep + 1) / 5) * 100}%` }}
                />
              </div>

              {/* Question Area */}
              <div className="mb-12">
                <h4 className="text-2xl font-black text-gray-900 mb-10 leading-snug">
                  {data.quiz.mcqs[currentQuizStep].question}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {data.quiz.mcqs[currentQuizStep].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const newAnswers = [...userAnswers];
                        newAnswers[currentQuizStep] = ['a', 'b', 'c', 'd'][idx];
                        setUserAnswers(newAnswers);
                      }}
                      className={`p-6 rounded-3xl text-left font-bold transition-all border-2 ${
                        userAnswers[currentQuizStep] === ['a', 'b', 'c', 'd'][idx]
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200'
                          : 'bg-white text-gray-700 border-gray-50 hover:border-blue-100 hover:bg-blue-50/30'
                      }`}
                    >
                      <span className="inline-block w-8 h-8 rounded-xl bg-gray-50 text-gray-900 text-center leading-8 mr-4 group-hover:bg-blue-100 uppercase text-xs font-black">
                        {['a', 'b', 'c', 'd'][idx]}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Answer Questions (Optional display after MCQs or as part of assessment) */}
              {/* For now we focus on MCQs for immediate scoring as per prompt rules */}

              {/* Navigation */}
              <div className="flex justify-between gap-4">
                <button 
                  disabled={currentQuizStep === 0}
                  onClick={() => setCurrentQuizStep(prev => prev - 1)}
                  className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100"
                >
                  Previous
                </button>
                {currentQuizStep < 4 ? (
                  <button 
                    disabled={!userAnswers[currentQuizStep]}
                    onClick={() => setCurrentQuizStep(prev => prev + 1)}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-30"
                  >
                    Next Question
                  </button>
                ) : (
                  <button 
                    disabled={!userAnswers[currentQuizStep]}
                    onClick={handleQuizSubmit}
                    className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                  >
                    Finish Assessment
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Trophy size={48} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Assessment Complete!</h2>
              <p className="text-gray-400 font-bold mb-10 text-lg uppercase tracking-widest">Your Score: {quizScore} / 5</p>
              
              <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-[2.5rem] mb-12 text-left">
                <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                   <Zap size={16} className="text-yellow-500" /> AI Feedback & Insight
                </h4>
                <div className={`mb-6 p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center ${
                    quizScore! <= 2 ? 'bg-red-50 text-red-600' :
                    quizScore! <= 4 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                    Level: {quizScore! <= 2 ? 'BEGINNER' : quizScore! <= 4 ? 'INTERMEDIATE' : 'ADVANCED'}
                </div>
                <p className="text-gray-500 text-sm font-medium leading-relaxed italic">
                  "Based on your performance, I've adjusted your curriculum difficulty. We'll focus on your weak areas: {data.performance_analysis.weak_topics.join(', ') || 'N/A'} while maintaining your streak in {data.performance_analysis.strong_topics[0] || 'core subjects'}."
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={() => { setShowQuiz(false); setQuizScore(null); setCurrentQuizStep(0); setUserAnswers([]); fetchAdaptiveData(); }}
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                >
                    Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAdaptiveEngine;
