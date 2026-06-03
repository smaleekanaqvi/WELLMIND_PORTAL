import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import { db } from "../firebase"; 
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { Calendar, Clock, Users, Briefcase, CheckCircle, AlertCircle, Edit2, Trash2, Plus, Search, Filter, X, Check, AlertTriangle, FolderKanban, TrendingUp, Award } from 'lucide-react';

// ─── Refined Professional Palette ──────────────────
const COLORS = {
  primary: "#623068",
  primaryDark: "#331B3F",
  primaryMid: "#47234F",
  primaryLight: "#F3F0F5",
  secondaryRed: "#8A1C37",
  actionTeal: "#0D7289",
  accentGold: "#C0854A",
  mainBg: "#F8FAFC",
  cardBg: "#FFFFFF",
  darkBg: "#1A1228",
  textMain: "#1E293B",
  textLight: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅', color: COLORS.accentGold };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', color: COLORS.actionTeal };
  if (hour < 20) return { text: 'Good Evening', emoji: '🌆', color: COLORS.primary };
  return { text: 'Good Night', emoji: '🌙', color: COLORS.primaryDark };
};

const formatDateDisplay = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const Projects = ({ onNavigate }) => {
    // State
    const [allProjects, setAllProjects] = useState([]);
    const [dbPeople, setDbPeople] = useState([]);
    const [activeTab, setActiveTab] = useState('employees');
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // ← startDate added to form state
    const [form, setForm] = useState({ projectName: '', startDate: '', deadline: '', description: '' });
    const [selectedPeople, setSelectedPeople] = useState([]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchPeople = async () => {
            try {
                const snap = await getDocs(collection(db, activeTab));
                setDbPeople(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
            } catch (e) { console.error(e); }
        };
        fetchPeople();
    }, [activeTab, modalOpen, editModalOpen]);

    const removePersonFromList = (id) => {
        setSelectedPeople(selectedPeople.filter(p => p !== id));
    };

    const handleToggleComplete = async (project) => {
        const isNowCompleted = project.status !== 'completed';
        try {
            await updateDoc(doc(db, "projects", project.id), {
                status: isNowCompleted ? 'completed' : 'in-progress',
                completedAt: isNowCompleted ? new Date().toISOString() : null 
            });
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this assignment?")) return;
        try {
            await deleteDoc(doc(db, "projects", id));
            setAllProjects(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete assignment");
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setForm({
            projectName: project.projectName || '',
            startDate: project.startDate || '',   // ← startDate loaded
            deadline: project.deadline || '',
            description: project.description || ''
        });
        setSelectedPeople(project.selectedPeople || []);
        setEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (selectedPeople.length === 0 || !form.projectName || !form.deadline) {
            alert("Add at least one member and fill all fields");
            return;
        }
        setSubmitting(true);
        const assignedNames = selectedPeople.map(id => dbPeople.find(p => p.id === id)?.name).join(", ");
        try {
            await updateDoc(doc(db, "projects", editingProject.id), {
                selectedPeople: selectedPeople,
                projectName: form.projectName,
                description: form.description,
                startDate: form.startDate,        // ← startDate saved
                deadline: form.deadline,
                personName: assignedNames,
                personType: activeTab,
                updatedAt: new Date().toISOString()
            });
            setEditModalOpen(false);
            setEditingProject(null);
            setForm({ projectName: '', startDate: '', deadline: '', description: '' });
            setSelectedPeople([]);
        } catch (e) { 
            console.error(e);
            alert("Failed to update project");
        }
        setSubmitting(false);
    };

    const getStatusInfo = (project) => {
        if (project.status === 'completed') {
            return { label: 'Completed', color: COLORS.success, bg: '#DCFCE7', icon: <CheckCircle size={14} /> };
        }
        const now = new Date();
        const due = new Date(project.deadline);
        if (now > due) {
            return { label: 'Overdue', color: COLORS.danger, bg: '#FEE2E2', icon: <AlertCircle size={14} /> };
        }
        return { label: 'In Progress', color: COLORS.actionTeal, bg: '#E0F2FE', icon: <Clock size={14} /> };
    };

    const handleSubmit = async () => {
        if (selectedPeople.length === 0 || !form.projectName || !form.deadline) {
            alert("Add at least one member and fill all fields");
            return;
        }
        setSubmitting(true);
        const assignedNames = selectedPeople.map(id => dbPeople.find(p => p.id === id)?.name).join(", ");
        try {
            await addDoc(collection(db, "projects"), {
                selectedPeople: selectedPeople,
                projectName: form.projectName,
                description: form.description,
                startDate: form.startDate,        // ← startDate saved
                deadline: form.deadline,
                personName: assignedNames,
                personType: activeTab, 
                status: 'in-progress', 
                createdAt: new Date().toISOString()
            });
            setModalOpen(false);
            setForm({ projectName: '', startDate: '', deadline: '', description: '' });
            setSelectedPeople([]);
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const filteredProjects = allProjects.filter(p => p.personType === activeTab).filter(p => 
        p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.personName?.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(p => filterStatus === 'All' ? true : p.status === filterStatus);

    const greeting = getGreeting();
    const currentDate = formatCurrentDate();

    const totalProjects = filteredProjects.length;
    const completedCount = filteredProjects.filter(p => p.status === 'completed').length;
    const inProgressCount = filteredProjects.filter(p => p.status === 'in-progress').length;
    const overdueCount = filteredProjects.filter(p => {
        if (p.status === 'completed') return false;
        return new Date() > new Date(p.deadline);
    }).length;
    const completionRate = totalProjects ? Math.round((completedCount / totalProjects) * 100) : 0;

    const STYLES = {
        card: {
            background: COLORS.cardBg,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
        },
        input: {
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s",
            background: "#fff",
            color: COLORS.textMain,
            boxSizing: "border-box"
        },
        btnPrimary: {
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 2px 4px rgba(98, 48, 104, 0.2)",
            transition: "all 0.2s"
        },
        btnSecondary: {
            background: "#fff",
            color: COLORS.textMain,
            border: `1px solid ${COLORS.border}`,
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s"
        }
    };

    if (loading) {
        return (
            <div style={{display:"flex", minHeight:"100vh", background:COLORS.mainBg}}>
                <div style={{width: isMobile ? "0px" : "260px", flexShrink:0}}>{!isMobile && <Sidebar onNavigate={onNavigate} />}</div>
                <div style={{flex:1, padding: isMobile ? "16px" : "32px"}}>
                    <div style={{height:40, width:"60%", background:COLORS.border, borderRadius:8, marginBottom:24}}></div>
                    <div style={{display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap:20, marginBottom:32}}>
                        {[1,2,3,4].map(i => <div key={i} style={{height:120, background:COLORS.border, borderRadius:12}}></div>)}
                    </div>
                    <div style={{height:400, background:COLORS.border, borderRadius:12}}></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{display:"flex", minHeight:"100vh", background:COLORS.mainBg, fontFamily:"'Inter', sans-serif", margin:0, padding:0}}>
            
            {/* Sidebar */}
            <div style={{width: isMobile ? "0px" : "260px", flexShrink:0, height:"100vh", overflow:"hidden"}}>
                <Sidebar onNavigate={onNavigate} />
            </div>

            {/* Main Content */}
            <div style={{flex:1, padding: isMobile ? "16px" : "32px", overflowX:"hidden", display:"flex", flexDirection:"column"}}>
                
                {/* Header */}
                <div style={{marginBottom: isMobile ? 24 : 32, display:"flex", flexDirection: isMobile ? "column" : "row", justifyContent:"space-between", alignItems: isMobile ? "flex-start" : "center", gap: 16}}>
                    <div>
                        <h1 style={{fontSize: isMobile ? "24px" : "28px", fontWeight:800, color:COLORS.textMain, margin:0, lineHeight:"1.2"}}>
                            {greeting.emoji} {greeting.text}, <span style={{color:COLORS.primary}}>Admin</span>
                        </h1>
                        <p style={{fontSize:"14px", color:COLORS.textLight, marginTop:4, fontWeight:500}}>Manage project assignments and track progress</p>
                        <div style={{display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", background:COLORS.cardBg, border:`1px solid ${COLORS.border}`, borderRadius:20, fontSize:"12px", fontWeight:600, color:COLORS.primary, marginTop:12, boxShadow:"0 1px 2px rgba(0,0,0,0.05)"}}>
                            <Calendar size={14} /> {currentDate}
                        </div>
                    </div>
                    {!isMobile && (
                        <button onClick={() => setModalOpen(true)} style={{...STYLES.btnPrimary, padding: "12px 24px"}}>
                            <Plus size={18} /> New Assignment
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                <div style={{display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap:16, marginBottom:32}}>
                    <div style={{...STYLES.card, padding:"20px", display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
                        <div style={{width:40, height:40, borderRadius:10, background:"#EDE9FE", display:"flex", alignItems:"center", justifyContent:"center", color:COLORS.primary}}>
                            <FolderKanban size={20} />
                        </div>
                        <div>
                            <div style={{fontSize:"28px", fontWeight:800, color:COLORS.textMain, marginTop:12}}>{totalProjects}</div>
                            <div style={{fontSize:"13px", fontWeight:600, color:COLORS.textLight, marginTop:4}}>Total Projects</div>
                        </div>
                    </div>

                    <div style={{...STYLES.card, padding:"20px", display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
                        <div style={{width:40, height:40, borderRadius:10, background:"#DCFCE7", display:"flex", alignItems:"center", justifyContent:"center", color:COLORS.success}}>
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <div style={{fontSize:"28px", fontWeight:800, color:COLORS.textMain, marginTop:12}}>{completedCount}</div>
                            <div style={{fontSize:"13px", fontWeight:600, color:COLORS.textLight, marginTop:4}}>Completed</div>
                        </div>
                    </div>

                    <div style={{...STYLES.card, padding:"20px", display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
                        <div style={{width:40, height:40, borderRadius:10, background:"#E0F2FE", display:"flex", alignItems:"center", justifyContent:"center", color:COLORS.actionTeal}}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <div style={{fontSize:"28px", fontWeight:800, color:COLORS.textMain, marginTop:12}}>{inProgressCount}</div>
                            <div style={{fontSize:"13px", fontWeight:600, color:COLORS.textLight, marginTop:4}}>In Progress</div>
                        </div>
                    </div>

                    <div style={{...STYLES.card, padding:"20px", display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                            <div style={{width:40, height:40, borderRadius:10, background:"#FEF3C7", display:"flex", alignItems:"center", justifyContent:"center", color:COLORS.accentGold}}>
                                <TrendingUp size={20} />
                            </div>
                            <span style={{fontSize:"12px", color:COLORS.textLight, fontWeight:600}}>Rate</span>
                        </div>
                        <div>
                            <div style={{fontSize:"28px", fontWeight:800, color:COLORS.textMain, marginTop:12}}>{completionRate}%</div>
                            <div style={{fontSize:"13px", fontWeight:600, color:COLORS.textLight, marginTop:4}}>Completion Rate</div>
                        </div>
                    </div>
                </div>

                {/* Mobile Action Button */}
                {isMobile && (
                    <button onClick={() => setModalOpen(true)} style={{...STYLES.btnPrimary, width: "100%", marginBottom: 24, padding: "14px"}}>
                        <Plus size={18} /> Create New Assignment
                    </button>
                )}

                {/* Controls Bar */}
                <div style={{background:COLORS.cardBg, padding:16, borderRadius:"12px 12px 0 0", border:`1px solid ${COLORS.border}`, borderBottom:"none", display:"flex", flexDirection: isMobile ? "column" : "row", justifyContent:"space-between", alignItems:"center", gap:16}}>
                    <div style={{display:"flex", background:COLORS.mainBg, padding:4, borderRadius:8}}>
                        {['employees', 'interns'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)} 
                                style={{padding:"6px 16px", fontSize:"13px", fontWeight:600, borderRadius:6, border:"none", cursor:"pointer", background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? COLORS.primary : COLORS.textLight, boxShadow: activeTab === tab ? "0 1px 2px rgba(0,0,0,0.05)" : "none", transition:"all 0.2s"}}
                            >
                                {tab === 'employees' ? 'Team Members' : 'Interns'}
                            </button>
                        ))}
                    </div>

                    <div style={{display:"flex", gap:8, width: isMobile ? "100%" : "auto"}}>
                        <div style={{position:"relative", flex:1}}>
                            <Search size={16} style={{position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:COLORS.textLight}} />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                style={{...STYLES.input, paddingLeft:"36px"}} 
                            />
                        </div>
                        <div style={{display:"flex", background:COLORS.mainBg, padding:4, borderRadius:8}}>
                            {['All', 'in-progress', 'completed'].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => setFilterStatus(status)} 
                                    style={{padding:"6px 12px", fontSize:"12px", fontWeight:600, borderRadius:6, border:"none", cursor:"pointer", background: filterStatus === status ? COLORS.primary : "transparent", color: filterStatus === status ? "#fff" : COLORS.textLight, whiteSpace:"nowrap"}}
                                >
                                    {status === 'in-progress' ? 'Active' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{...STYLES.card, borderTopLeftRadius:0, borderTopRightRadius:0, overflow:"hidden", padding:0, flex:1, display:"flex", flexDirection:"column"}}>
                    <div style={{overflowX:"auto", flex:1}}>
                        <table style={{width:"100%", borderCollapse:"collapse", minWidth:860}}>
                            <thead style={{background:COLORS.mainBg, position:"sticky", top:0, zIndex:10}}>
                                <tr>
                                    {['Project', 'Assigned To', 'Start Date', 'Deadline', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{padding:"14px 16px", fontSize:"12px", fontWeight:700, color:COLORS.textLight, textAlign:h === 'Actions' ? 'right' : 'left', textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:`1px solid ${COLORS.border}`}}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map(p => {
                                    const statusInfo = getStatusInfo(p);
                                    return (
                                        <tr key={p.id} style={{borderBottom:`1px solid ${COLORS.border}`, transition:"background 0.2s", background:"#fff"}}>
                                            
                                            {/* Project Name + Description */}
                                            <td style={{padding:"16px"}}>
                                                <div style={{fontWeight:600, color:COLORS.textMain, marginBottom:2}}>{p.projectName}</div>
                                                <div style={{fontSize:"12px", color:COLORS.textLight, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{p.description || 'No description'}</div>
                                            </td>

                                            {/* Assigned To */}
                                            <td style={{padding:"16px"}}>
                                                <div style={{display:"flex", alignItems:"center", gap:8}}>
                                                    <div style={{width:28, height:28, borderRadius:"50%", background:COLORS.primaryLight, color:COLORS.primary, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, flexShrink:0}}>{p.personName?.charAt(0) || '?'}</div>
                                                    <span style={{fontSize:"13px", fontWeight:500, color:COLORS.textMain}}>{p.personName}</span>
                                                </div>
                                            </td>

                                            {/* ← Start Date column */}
                                            <td style={{padding:"16px"}}>
                                                {p.startDate ? (
                                                    <div style={{display:"inline-flex", alignItems:"center", gap:5, fontSize:"13px", color:COLORS.actionTeal, fontWeight:500, background:"#E0F2FE", padding:"4px 10px", borderRadius:6}}>
                                                        <Calendar size={12} />
                                                        {formatDateDisplay(p.startDate)}
                                                    </div>
                                                ) : (
                                                    <span style={{color:COLORS.textLight, fontSize:"13px"}}>—</span>
                                                )}
                                            </td>

                                            {/* Deadline */}
                                            <td style={{padding:"16px"}}>
                                                <div style={{display:"inline-flex", alignItems:"center", gap:5, fontSize:"13px", color:COLORS.textMain, fontWeight:500, background:COLORS.mainBg, padding:"4px 10px", borderRadius:6}}>
                                                    <Clock size={12} style={{color:COLORS.textLight}} />
                                                    {formatDateDisplay(p.deadline)}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{padding:"16px"}}>
                                                <span style={{display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:20, fontSize:"11px", fontWeight:700, textTransform:"uppercase", background:statusInfo.bg, color:statusInfo.color}}>
                                                    {statusInfo.icon} {statusInfo.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td style={{padding:"16px", textAlign:"right"}}>
                                                <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
                                                    <button onClick={() => handleToggleComplete(p)} style={{padding:"6px", borderRadius:6, border:"none", background:p.status === 'completed' ? COLORS.success + "20" : "#F1F5F9", color:p.status === 'completed' ? COLORS.success : COLORS.textLight, cursor:"pointer"}} title="Toggle Status">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => handleEdit(p)} style={{padding:"6px", borderRadius:6, border:"none", background:COLORS.info + "10", color:COLORS.info, cursor:"pointer"}}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} style={{padding:"6px", borderRadius:6, border:"none", background:COLORS.danger + "10", color:COLORS.danger, cursor:"pointer"}}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredProjects.length === 0 && (
                            <div style={{textAlign:"center", padding:"60px 20px", color:COLORS.textLight}}>
                                <FolderKanban size={48} strokeWidth={1} style={{marginBottom:16, opacity:0.3}} />
                                <h3 style={{fontSize:16, fontWeight:600, color:COLORS.textMain}}>No projects found</h3>
                                <p style={{fontSize:13}}>Try adjusting your filters or create a new assignment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal - Add / Edit */}
            {(modalOpen || editModalOpen) && (
                <div 
                    style={{position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, animation:"fadeIn 0.2s"}} 
                    onClick={() => { modalOpen ? setModalOpen(false) : setEditModalOpen(false); }}
                >
                    <div 
                        style={{background:"#fff", borderRadius:16, width: isMobile ? "100%" : "500px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", animation:"slideUp 0.3s"}} 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{padding:20, borderBottom:`1px solid ${COLORS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                            <h3 style={{margin:0, fontSize:"18px", fontWeight:700, color:COLORS.textMain}}>
                                {modalOpen ? 'New Assignment' : 'Edit Assignment'}
                            </h3>
                            <button onClick={() => { modalOpen ? setModalOpen(false) : setEditModalOpen(false); }} style={{background:"none", border:"none", cursor:"pointer", color:COLORS.textLight}}>
                                <X size={20}/>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{padding:20}}>

                            {/* Assign To */}
                            <div style={{marginBottom:16}}>
                                <label style={{fontSize:"13px", fontWeight:600, color:COLORS.textMain, marginBottom:6, display:"block"}}>Assign To</label>
                                <select 
                                    onChange={e => { const id = e.target.value; if(id && !selectedPeople.includes(id)) setSelectedPeople([...selectedPeople, id]); e.target.value = ""; }} 
                                    style={{...STYLES.input, cursor:"pointer"}}
                                >
                                    <option value="">Select a member...</option>
                                    {dbPeople.filter(p => !selectedPeople.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <div style={{display:"flex", flexWrap:"wrap", gap:8, marginTop:8}}>
                                    {selectedPeople.map(id => {
                                        const person = dbPeople.find(p => p.id === id);
                                        return (
                                            <span key={id} style={{background:COLORS.primaryLight, color:COLORS.primary, padding:"4px 10px", borderRadius:20, fontSize:"12px", fontWeight:600, display:"flex", alignItems:"center", gap:6}}>
                                                {person?.name}
                                                <button onClick={() => removePersonFromList(id)} style={{background:"none", border:"none", cursor:"pointer", color:COLORS.primary, display:"flex"}}>
                                                    <X size={12}/>
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Project Name */}
                            <div style={{marginBottom:16}}>
                                <label style={{fontSize:"13px", fontWeight:600, color:COLORS.textMain, marginBottom:6, display:"block"}}>Project Name</label>
                                <input type="text" value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} style={STYLES.input} placeholder="e.g. Website Redesign" />
                            </div>

                            {/* Description */}
                            <div style={{marginBottom:16}}>
                                <label style={{fontSize:"13px", fontWeight:600, color:COLORS.textMain, marginBottom:6, display:"block"}}>Description</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} style={{...STYLES.input, resize:"vertical"}} placeholder="Brief details..."></textarea>
                            </div>

                            {/* ← Starting Date (new field) */}
                            <div style={{marginBottom:16}}>
                                <label style={{fontSize:"13px", fontWeight:600, color:COLORS.textMain, marginBottom:6, display:"block"}}>
                                    Starting Date
                                </label>
                                <input 
                                    type="date" 
                                    value={form.startDate} 
                                    onChange={e => setForm({...form, startDate: e.target.value})} 
                                    style={STYLES.input} 
                                />
                            </div>

                            {/* Deadline */}
                            <div style={{marginBottom:24}}>
                                <label style={{fontSize:"13px", fontWeight:600, color:COLORS.textMain, marginBottom:6, display:"block"}}>Deadline</label>
                                <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} style={STYLES.input} />
                            </div>

                            {/* Buttons */}
                            <div style={{display:"flex", justifyContent:"flex-end", gap:12}}>
                                <button onClick={() => { modalOpen ? setModalOpen(false) : setEditModalOpen(false); }} style={STYLES.btnSecondary}>Cancel</button>
                                <button onClick={modalOpen ? handleSubmit : handleUpdate} disabled={submitting} style={STYLES.btnPrimary}>
                                    {submitting ? 'Saving...' : (modalOpen ? 'Assign Project' : 'Update Project')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                input:focus, textarea:focus, select:focus { border-color: ${COLORS.primary} !important; box-shadow: 0 0 0 3px ${COLORS.primaryLight} !important; }
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
            `}</style>
        </div>
    );
};

export default Projects;