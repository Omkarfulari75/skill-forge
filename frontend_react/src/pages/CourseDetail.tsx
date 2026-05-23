import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchSubjects, createSubject, deleteSubject, updateSubject,
  fetchTopics, createTopic, deleteTopic, updateTopic,
  fetchMaterials, createMaterial, deleteMaterial, updateMaterial
} from '../api/instructor';
import type { Subject, Topic, Material } from '../api/instructor';
import { ChevronLeft, Plus, Trash2, FileText, Link as LinkIcon, Video, Upload, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [topics, setTopics] = useState<Record<number, Topic[]>>({});
  const [materials, setMaterials] = useState<Record<number, Material[]>>({});
  
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [newTopic, setNewTopic] = useState({ name: '', description: '', subject_id: 0, youtube_link: '', generic_link: '' });
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', type: 'PDF', difficulty_level: 'Basic', topic_id: 0, external_url: '' });
  const [materialFile, setMaterialFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) loadSubjects();
  }, [id]);

  const loadSubjects = async () => {
    try {
      const data = await fetchSubjects(Number(id));
      setSubjects(data);
    } catch (err) {
      console.error("Error loading subjects", err);
    }
  };

  const toggleSubject = async (subjectId: number) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      if (!topics[subjectId]) {
        try {
          const data = await fetchTopics(subjectId);
          setTopics(prev => ({ ...prev, [subjectId]: data }));
        } catch (err) {
          console.error("Error loading topics", err);
        }
      }
    }
  };

  const toggleTopic = async (topicId: number) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
      if (!materials[topicId]) {
        try {
          const data = await fetchMaterials(topicId);
          setMaterials(prev => ({ ...prev, [topicId]: data }));
        } catch (err) {
          console.error("Error loading materials", err);
        }
      }
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, newSubject);
      } else {
        await createSubject({ ...newSubject, course_id: Number(id) });
      }
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
      setNewSubject({ name: '', description: '' });
      loadSubjects();
    } catch (err) {
      console.error("Error saving subject", err);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubject({ name: subject.name, description: subject.description });
    setIsSubjectModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, { 
          name: newTopic.name, 
          description: newTopic.description,
          youtube_link: newTopic.youtube_link,
          generic_link: newTopic.generic_link 
        });
        const data = await fetchTopics(editingTopic.subject_id);
        setTopics(prev => ({ ...prev, [editingTopic.subject_id]: data }));
      } else {
        await createTopic({ ...newTopic, course_id: Number(id) });
        const data = await fetchTopics(newTopic.subject_id);
        setTopics(prev => ({ ...prev, [newTopic.subject_id]: data }));
      }
      setIsTopicModalOpen(false);
      setEditingTopic(null);
      setNewTopic({ name: '', description: '', subject_id: 0, youtube_link: '', generic_link: '' });
    } catch (err) {
      console.error("Error saving topic", err);
    }
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setNewTopic({ 
      name: topic.name, 
      description: topic.description, 
      subject_id: topic.subject_id,
      youtube_link: topic.youtube_link || '',
      generic_link: topic.generic_link || ''
    });
    setIsTopicModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('topic_id', newMaterial.topic_id.toString());
    formData.append('title', newMaterial.title);
    formData.append('description', newMaterial.description);
    formData.append('type', newMaterial.type);
    formData.append('difficulty_level', newMaterial.difficulty_level);
    formData.append('course_id', id!.toString());
    if (materialFile) formData.append('file', materialFile);
    else if (newMaterial.external_url) formData.append('external_url', newMaterial.external_url);

    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, formData);
      } else {
        await createMaterial(formData);
      }
      setIsMaterialModalOpen(false);
      setEditingMaterial(null);
      setNewMaterial({ title: '', description: '', type: 'PDF', difficulty_level: 'Basic', topic_id: 0, external_url: '' });
      setMaterialFile(null);
      const data = await fetchMaterials(newMaterial.topic_id);
      setMaterials(prev => ({ ...prev, [newMaterial.topic_id]: data }));
    } catch (err) {
      console.error("Error saving material", err);
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setNewMaterial({
      title: material.title,
      description: material.description,
      type: material.type,
      difficulty_level: material.difficulty_level,
      topic_id: material.topic_id,
      external_url: material.type === 'LINK' ? material.url : ''
    });
    setIsMaterialModalOpen(true);
  };

  const handleDeleteTopic = async (tid: number, sid: number) => {
    if (window.confirm("Delete topic and all its contents?")) {
      await deleteTopic(tid);
      const data = await fetchTopics(sid);
      setTopics(prev => ({ ...prev, [sid]: data }));
    }
  };

  const handleDeleteSubject = async (sid: number) => {
    if (window.confirm("Delete subject and all its contents?")) {
      await deleteSubject(sid);
      loadSubjects();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-20">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => navigate('/instructor-panel')} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black text-xl text-gray-900 tracking-tight italic">Course Management</h1>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Curriculum</h2>
            <p className="text-gray-500 font-medium">Structure your course with subjects, topics and materials.</p>
          </div>
          <button 
            onClick={() => { setEditingSubject(null); setNewSubject({ name: '', description: '' }); setIsSubjectModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
          >
            <Plus size={16} />
            Add Subject
          </button>
        </div>

        <div className="space-y-4">
          {subjects.map(subject => (
            <div key={subject.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div 
                className={`group p-6 flex items-center justify-between cursor-pointer transition-colors ${expandedSubject === subject.id ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                onClick={() => toggleSubject(subject.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${expandedSubject === subject.id ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {expandedSubject === subject.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900">{subject.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{(topics[subject.id]?.length || 0)} Topics</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditSubject(subject); }}
                    className="p-2 text-gray-300 hover:text-emerald-500 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {expandedSubject === subject.id && (
                <div className="px-6 pb-6 pt-2 bg-gray-50/50 border-t border-gray-100 space-y-3 animate-fade-in">
                  {topics[subject.id]?.map(topic => (
                    <div key={topic.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div 
                        className="group p-4 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleTopic(topic.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 font-black text-xs">Topic:</span>
                          <span className="font-bold text-gray-900">{topic.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditTopic(topic); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-emerald-500 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id, subject.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{(materials[topic.id]?.length || 0)} Files</span>
                            {expandedTopic === topic.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                          </div>
                        </div>
                      </div>

                      {expandedTopic === topic.id && (
                        <div className="p-4 pt-0 border-t border-gray-50 space-y-2">
                          {materials[topic.id]?.map(material => (
                            <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                              <div className="flex items-center gap-3">
                                <div className="text-gray-400 group-hover:text-emerald-500 transition-colors">
                                  {material.type === 'PDF' && <FileText size={18} />}
                                  {material.type === 'VIDEO' && <Video size={18} />}
                                  {material.type === 'LINK' && <LinkIcon size={18} />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{material.title}</p>
                                  <span className="text-[8px] font-black text-gray-400 uppercase">{material.difficulty_level}</span>
                                </div>
                              </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEditMaterial(material)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-emerald-500 transition-all">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => deleteMaterial(material.id).then(() => toggleTopic(topic.id))} className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 transition-all">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            </div>
                          ))}
                          <button 
                            onClick={() => { setEditingMaterial(null); setNewMaterial(prev => ({ ...prev, topic_id: topic.id, title: '', description: '', type: 'PDF', difficulty_level: 'Basic', external_url: '' })); setIsMaterialModalOpen(true); }}
                            className="w-full py-3 mt-2 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          >
                            + Add Material
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => { setEditingTopic(null); setNewTopic(prev => ({ ...prev, subject_id: subject.id, name: '', description: '', youtube_link: '', generic_link: '' })); setIsTopicModalOpen(true); }}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                  >
                    + Add New Topic
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Modals - Simplified for brevity but logic remains same */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsSubjectModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 animate-fade-in text-center">
            <h3 className="text-2xl font-black text-gray-900 mb-6 italic">{editingSubject ? 'Edit Subject' : 'New Subject'}</h3>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <input 
                type="text" required value={newSubject.name} 
                onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                placeholder="Subject Name" 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
              />
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                {editingSubject ? 'Save Changes' : 'Create Subject'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isTopicModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsTopicModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 animate-fade-in text-center">
            <h3 className="text-2xl font-black text-gray-900 mb-6 italic">{editingTopic ? 'Edit Topic' : 'New Topic'}</h3>
            <form onSubmit={handleSaveTopic} className="space-y-4">
              <input 
                type="text" required value={newTopic.name} 
                onChange={e => setNewTopic({...newTopic, name: e.target.value})}
                placeholder="Topic Name" 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
              />
              <input 
                type="url" value={newTopic.youtube_link} 
                onChange={e => setNewTopic({...newTopic, youtube_link: e.target.value})}
                placeholder="YouTube Link (Optional)" 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
              />
              <input 
                type="url" value={newTopic.generic_link} 
                onChange={e => setNewTopic({...newTopic, generic_link: e.target.value})}
                placeholder="Reference Link (Optional)" 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-gray-700 shadow-inner"
              />
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                {editingTopic ? 'Save Changes' : 'Add Topic'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMaterialModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 animate-fade-in">
            <h3 className="text-2xl font-black text-gray-900 mb-6 text-center italic">{editingMaterial ? 'Edit Material' : 'Add Material'}</h3>
            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <input 
                type="text" required value={newMaterial.title} 
                onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                placeholder="Material Title" 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none shadow-inner"
              />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  value={newMaterial.type} 
                  onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="VIDEO">Video Playback</option>
                  <option value="LINK">External Link</option>
                </select>
                <select 
                  value={newMaterial.difficulty_level} 
                  onChange={e => setNewMaterial({...newMaterial, difficulty_level: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                >
                  <option value="Basic">Basic</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              
              {newMaterial.type === 'LINK' ? (
                <input 
                  type="url" required value={newMaterial.external_url} 
                  onChange={e => setNewMaterial({...newMaterial, external_url: e.target.value})}
                  placeholder="https://..." 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                />
              ) : (
                <label className="w-full flex items-center gap-2 px-5 py-4 bg-gray-50 rounded-2xl text-sm font-bold text-gray-500 cursor-pointer hover:bg-emerald-50 transition-all shadow-inner">
                  <Upload size={18} />
                  <span className="truncate">{materialFile ? materialFile.name : (editingMaterial ? 'Change File (Optional)' : 'Upload File')}</span>
                  <input type="file" hidden onChange={e => setMaterialFile(e.target.files?.[0] || null)} />
                </label>
              )}
              
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100">
                {editingMaterial ? 'Save Changes' : 'Add Material'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
