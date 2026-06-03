import React, { useState, useEffect, useCallback } from 'react';
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

const auth = getAuth();

const C = {
  purple: '#7C3AED',
  dark:   '#1E1B2E',
  mid:    '#4C3B6E',
  red:    '#DC2626',
  teal:   '#0891B2',
  gold:   '#D97706',
  bg:     '#F7F5FF',
  text:   '#1A1530',
  light:  '#EDE9FE',
  green:  '#059669',
  amber:  '#D97706',
  danger: '#DC2626',
  card:   '#FFFFFF',
  border: 'rgba(124,58,237,0.1)',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=DM+Mono:wght@400;500&display=swap');
`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const getDatesInMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  return Array.from({ length: days }, (_, i) =>
    `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
  );
};

const isOnTime = (v) => v === true || v === 1 || (typeof v === 'string' && ['true', 'yes', '1'].includes(v.trim().toLowerCase()));
const isDelayed = (v) => v === false || v === 0 || (typeof v === 'string' && ['false', 'no', '0'].includes(v.trim().toLowerCase()));

const getDeadlineStatus = (project) => {
  if (!project.deadline && !project.dueDate) return { text: 'No deadline', color: '#94A3B8', icon: '⚪' };
  const deadlineStr = project.deadline || project.dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr + 'T00:00:00');
  if (isNaN(deadline)) return { text: 'Invalid date', color: '#94A3B8', icon: '⚠️' };
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isCompleted = (project.status || '').toLowerCase().replace(/[-_]/g, ' ') === 'completed';
  if (isCompleted) {
    return { text: 'Completed', color: '#059669', icon: '✅' };
  } else if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} days`, color: '#DC2626', icon: '🔴' };
  } else if (diffDays === 0) {
    return { text: 'Due today', color: '#D97706', icon: '⚠️' };
  } else {
    return { text: `${diffDays} days left`, color: '#059669', icon: '🟢' };
  }
};

const MiniBar = ({ value, max, color }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ background: '#EDE9FE', borderRadius: 4, height: 5, width: 64, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  );
};

const DonutChart = ({ segments, size = 84 }) => {
  const total = segments.reduce((a, b) => a + b.value, 0);
  if (total === 0) return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={(size - 10) / 2} fill="none" stroke="#EDE9FE" strokeWidth="10" />
    </svg>
  );
  const r = (size - 10) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashArray = `${circumference * pct} ${circumference * (1 - pct)}`;
        const offset = -(cumulative) * circumference;
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="10"
            strokeDasharray={dashArray} strokeDashoffset={offset}
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        );
      })}
    </svg>
  );
};

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: C.card,
    borderRadius: 20,
    padding: '24px 26px',
    boxShadow: '0 2px 16px rgba(124,58,237,0.07)',
    border: `1px solid ${C.border}`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    cursor: 'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,58,237,0.13)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(124,58,237,0.07)'; }}
  >
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 80, height: 80,
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      borderRadius: '0 20px 0 80px',
    }} />
    <div style={{
      position: 'absolute', top: 14, right: 14,
      width: 42, height: 42, borderRadius: 12,
      background: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20,
    }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1, fontFamily: "'DM Sans',sans-serif" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>{sub}</div>}
  </div>
);

const Badge = ({ status }) => {
  const map = {
    Present: { bg: '#DCFCE7', c: '#15803D', dot: '#22C55E' },
    Late: { bg: '#FEF3C7', c: '#B45309', dot: '#F59E0B' },
    Absent: { bg: '#FEE2E2', c: '#B91C1C', dot: '#EF4444' },
    Leave: { bg: '#EDE9FE', c: C.purple, dot: C.purple },
    Pending: { bg: '#F1F5F9', c: '#64748B', dot: '#94A3B8' },
    Completed: { bg: '#DCFCE7', c: '#15803D', dot: '#22C55E' },
    'In Progress': { bg: '#FEF3C7', c: '#B45309', dot: '#F59E0B' },
    'Not Started': { bg: '#F1F5F9', c: '#64748B', dot: '#94A3B8' },
    Employee: { bg: '#EDE9FE', c: C.purple, dot: C.purple },
    Intern: { bg: '#E0F2FE', c: C.teal, dot: C.teal },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{
      padding: '4px 11px', borderRadius: 20, fontSize: 11,
      fontWeight: 700, background: s.bg, color: s.c,
      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {status || 'Pending'}
    </span>
  );
};

const ProgressBar = ({ value, height = 8 }) => (
  <div style={{ background: '#EDE9FE', borderRadius: 99, height, overflow: 'hidden', flex: 1 }}>
    <div style={{
      width: `${Math.min(value, 100)}%`, height: '100%',
      background: value >= 75
        ? 'linear-gradient(90deg,#059669,#34D399)'
        : value >= 50
          ? 'linear-gradient(90deg,#D97706,#FBB840)'
          : 'linear-gradient(90deg,#DC2626,#F87171)',
      borderRadius: 99, transition: 'width 0.6s ease',
    }} />
  </div>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div style={{ position: 'relative', flex: 1 }}>
    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94A3B8', pointerEvents: 'none' }}>🔍</span>
    <input
      type="text"
      placeholder={placeholder || 'Search...'}
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '10px 14px 10px 38px',
        borderRadius: 14,
        border: `1.5px solid ${C.border}`,
        background: '#fff',
        fontSize: 13,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 500,
        color: C.text,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => e.target.style.borderColor = C.purple}
      onBlur={e => e.target.style.borderColor = C.border}
    />
  </div>
);

const DescriptionPopup = ({ project, onClose, getStatusBadge }) => {
  if (!project) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(30,27,46,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
    >
      <div style={{ background: '#fff', borderRadius: 24, padding: 36, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', animation: 'popIn 0.2s ease' }}>
        <style>{`@keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: '#F1F5F9', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
          onMouseOver={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
        >✕</button>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.teal, background: '#E0F2FE', padding: '3px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1.2, display: 'inline-block', marginBottom: 16 }}>
          📁 Project Details
        </span>
        <h3 style={{ color: C.dark, margin: '0 0 8px 0', fontSize: 22, fontWeight: 900, fontFamily: "'DM Sans',sans-serif" }}>
          {project.projectName || project.name || '—'}
        </h3>
        <p style={{ color: C.mid, fontSize: 13, margin: '0 0 20px 0', fontWeight: 500 }}>
          👤 Assigned to: <strong style={{ color: C.purple }}>{project.personName || project._assignedDisplay || '—'}</strong>
        </p>
        <div style={{ background: C.bg, borderRadius: 14, padding: 20, marginBottom: 20, fontSize: 14, color: C.text, lineHeight: 1.8, minHeight: 70, border: `1px solid ${C.border}` }}>
          {project.description
            ? project.description
            : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description available.</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#64748B', fontWeight: 500 }}>
            📅 Deadline: <strong style={{ color: C.text }}>{project.deadline || project.dueDate || '—'}</strong>
          </span>
          {getStatusBadge(project.status)}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HRDashboard Main Component
// ============================================================
const HRDashboard = ({ onNavigate }) => {
  const hrUser = JSON.parse(localStorage.getItem('hrUser') || '{}');

  const [tab, setTab] = useState('overview');
  const [employees, setEmployees] = useState([]);
  const [interns, setInterns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [attStats, setAttStats] = useState({});
  const [internStats, setInternStats] = useState({});
  const [dailyDetails, setDailyDetails] = useState({});
  const [internDetails, setInternDetails] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personType, setPersonType] = useState('employee');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [perfMode, setPerfMode] = useState('project');
  const [searchQuery, setSearchQuery] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todaySearch, setTodaySearch] = useState('');
  const [descPopup, setDescPopup] = useState(null);
  const [topPerformerLimit, setTopPerformerLimit] = useState(3);
  const [todayLimit, setTodayLimit] = useState(5);

  const monthLabel = new Date(reportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
  const isCurrent = reportMonth >= new Date().toISOString().slice(0, 7);

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredInterns = interns.filter(int =>
    int.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    int.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTodayAtt = todayAttendance.filter(r =>
    r.name?.toLowerCase().includes(todaySearch.toLowerCase()) ||
    r.role?.toLowerCase().includes(todaySearch.toLowerCase()) ||
    r.type?.toLowerCase().includes(todaySearch.toLowerCase())
  );

  // ========== REAL-TIME TODAY'S ATTENDANCE ==========
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    const unsubscribeEmployees = onSnapshot(
      collection(db, 'attendance', todayStr, 'records'),
      (snapshot) => {
        const employeeRecords = snapshot.docs.map(doc => {
          const userId = doc.id;
          const emp = employees.find(e => e.id === userId);
          return {
            id: userId,
            name: emp?.name || userId,
            role: emp?.role || '—',
            type: 'Employee',
            scheduledIn: emp?.checkInTime || '09:00 AM',
            scheduledOut: emp?.checkOutTime || '05:00 PM',
            status: doc.data().status || 'Pending',
          };
        });
        setTodayAttendance(prev => {
          const internRecords = prev.filter(r => r.type === 'Intern');
          return [...employeeRecords, ...internRecords];
        });
      },
      (error) => console.error('Employee attendance listener error:', error)
    );

    const unsubscribeInterns = onSnapshot(
      collection(db, 'intern_attendance', todayStr, 'records'),
      (snapshot) => {
        const internRecords = snapshot.docs.map(doc => {
          const userId = doc.id;
          const intern = interns.find(i => i.id === userId);
          return {
            id: userId,
            name: intern?.name || userId,
            role: intern?.role || '—',
            type: 'Intern',
            scheduledIn: intern?.checkInTime || '09:00 AM',
            scheduledOut: intern?.checkOutTime || '06:00 PM',
            status: doc.data().status || 'Pending',
          };
        });
        setTodayAttendance(prev => {
          const employeeRecords = prev.filter(r => r.type === 'Employee');
          return [...employeeRecords, ...internRecords];
        });
      },
      (error) => console.error('Intern attendance listener error:', error)
    );

    return () => {
      unsubscribeEmployees();
      unsubscribeInterns();
    };
  }, [employees, interns]);

  // ========== EMPLOYEES & INTERNS LISTENERS ==========
  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const empList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEmployees(empList);
    });
    const unsubInterns = onSnapshot(collection(db, 'interns'), (snapshot) => {
      const intList = snapshot.docs.map(d => ({
        id: d.id, ...d.data(),
        checkInTime: d.data().checkInTime || '09:00 AM',
        checkOutTime: d.data().checkOutTime || '06:00 PM'
      }));
      setInterns(intList);
    });
    return () => { unsubEmployees(); unsubInterns(); };
  }, []);

  // ========== LOAD PROJECTS ==========
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projSnap = await getDocs(collection(db, 'projects'));
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadProjects();
  }, []);

  // ========== MONTHLY ATTENDANCE FETCH ==========
  const fetchAttendance = useCallback(async (month) => {
    const dates = getDatesInMonth(month);
    const fetchColl = async (collName) => {
      const stats = {}, details = {};
      const results = await Promise.all(
        dates.map(d =>
          getDocs(collection(db, collName, d, 'records'))
            .then(s => ({ d, s })).catch(() => ({ d, s: { forEach: () => { } } }))
        )
      );
      results.forEach(({ d, s }) => {
        s.forEach(docSnap => {
          const data = docSnap.data(); const id = docSnap.id;
          if (!data.status || data.status === 'Pending') return;
          if (!stats[id]) stats[id] = { present: 0, late: 0, absent: 0, leave: 0 };
          if (!details[id]) details[id] = {};
          if (!details[id][d]) {
            details[id][d] = { status: data.status || '—', checkIn: data.checkIn || '—' };
            if (data.status === 'Present') stats[id].present++;
            else if (data.status === 'Late') stats[id].late++;
            else if (data.status === 'Absent') stats[id].absent++;
            else if (data.status === 'Leave') stats[id].leave++;
          }
        });
      });
      return { stats, details };
    };
    const [emp, int] = await Promise.all([
      fetchColl('attendance'),
      fetchColl('intern_attendance'),
    ]);
    setAttStats(emp.stats);
    setDailyDetails(emp.details);
    setInternStats(int.stats);
    setInternDetails(int.details);
  }, []);

  useEffect(() => {
    if (!loading) fetchAttendance(reportMonth);
  }, [loading, reportMonth, fetchAttendance]);

  const changeMonth = (dir) => {
    const d = new Date(reportMonth + '-01');
    d.setMonth(d.getMonth() + dir);
    setReportMonth(d.toISOString().slice(0, 7));
  };

  const getAttRate = (id, statsObj) => {
    const s = statsObj[id] || { present: 0, late: 0, absent: 0, leave: 0 };
    const t = s.present + s.late + s.absent + s.leave;
    return t > 0 ? Math.round(((s.present + s.late) / t) * 100) : 0;
  };

  const personMatchesProject = (person, p) => {
    if (Array.isArray(p.selectedPeople) && p.selectedPeople.includes(person.id)) return true;
    if (Array.isArray(p.members) && (p.members.includes(person.id) || p.members.includes(person.name))) return true;
    if (p.assignedTo === person.id || p.assignedTo === person.name) return true;
    if (p.personName) {
      const names = p.personName.split(',').map(n => n.trim().toLowerCase());
      if (names.includes((person.name || '').toLowerCase().trim())) return true;
    }
    return false;
  };

  const getPersonProjects = (person) => projects.filter(p => personMatchesProject(person, p));

  const avgRate = (list, statsObj) => {
    if (!list.length) return 0;
    return Math.round(list.reduce((a, p) => a + getAttRate(p.id, statsObj), 0) / list.length);
  };

  const normSt = (s) => {
    if (!s) return 'pending';
    return s.toLowerCase().replace(/[-_\s]+/g, ' ').trim();
  };

  const projectStats = (() => {
    const total = projects.length;
    const completed = projects.filter(p => normSt(p.status) === 'completed').length;
    const inProgress = projects.filter(p => normSt(p.status) === 'in progress').length;
    const notStarted = projects.filter(p => !p.status || ['not started', 'pending', ''].includes(normSt(p.status))).length;
    const onTime = projects.filter(p => isOnTime(p.onTime)).length;
    const delayed = projects.filter(p => isDelayed(p.onTime)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, notStarted, onTime, delayed, completionRate };
  })();

  const overallAttStats = (() => {
    let totalP = 0, totalL = 0, totalA = 0, totalLv = 0;
    employees.forEach(p => {
      const s = attStats[p.id] || {};
      totalP += s.present || 0; totalL += s.late || 0; totalA += s.absent || 0; totalLv += s.leave || 0;
    });
    interns.forEach(p => {
      const s = internStats[p.id] || {};
      totalP += s.present || 0; totalL += s.late || 0; totalA += s.absent || 0; totalLv += s.leave || 0;
    });
    return { present: totalP, late: totalL, absent: totalA, leave: totalLv };
  })();

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase().replace(/[-_]/g, ' ') || 'pending';
    if (s === 'completed') return <Badge status="Completed" />;
    if (s.includes('progress')) return <Badge status="In Progress" />;
    return <Badge status="Not Started" />;
  };

  const handleBack = () => { onNavigate('dashboard'); };

  const openPerson = (person, type) => {
    setSelectedPerson(person);
    setPersonType(type);
    setTab('person');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: C.bg, flexDirection: 'column', gap: 16, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{FONTS}</style>
      <div style={{ width: 52, height: 52, border: `4px solid ${C.purple}20`, borderTop: `4px solid ${C.purple}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: C.purple, fontWeight: 700, fontSize: 15 }}>Loading HR Dashboard…</div>
    </div>
  );

  // ========== PERSON DETAIL VIEW ==========
  if (tab === 'person' && selectedPerson) {
    const statsObj = personType === 'intern' ? internStats : attStats;
    const detailsObj = personType === 'intern' ? internDetails : dailyDetails;
    const s = statsObj[selectedPerson.id] || { present: 0, late: 0, absent: 0, leave: 0 };
    const days = detailsObj[selectedPerson.id] || {};
    const total = s.present + s.late + s.absent + s.leave;
    const rate = total > 0 ? Math.round(((s.present + s.late) / total) * 100) : 0;

    const myProjects = getPersonProjects(selectedPerson);
    const _ns = (st) => { if (!st) return ''; return st.toLowerCase().replace(/[-_]/g, ' '); };
    const projDone = myProjects.filter(p => _ns(p.status) === 'completed').length;
    const projActive = myProjects.filter(p => _ns(p.status).includes('progress')).length;
    const projOnTime = myProjects.filter(p => isOnTime(p.onTime)).length;
    const projDelayed = myProjects.filter(p => isDelayed(p.onTime)).length;
    const projCompRate = myProjects.length > 0 ? Math.round((projDone / myProjects.length) * 100) : 0;
    const onTimeRate = myProjects.length > 0 ? Math.round((projOnTime / myProjects.length) * 100) : 0;

    const dayList = Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([ds, data]) => {
      const d = new Date(ds);
      return { ds, day: d.toLocaleDateString('en-US', { weekday: 'short' }), date: formatDate(ds), ...data };
    });

    const attSegments = [
      { color: C.green, value: s.present },
      { color: C.amber, value: s.late },
      { color: C.danger, value: s.absent },
      { color: C.purple, value: s.leave },
    ].filter(x => x.value > 0);

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans',sans-serif" }}>
        <style>{FONTS}</style>
        <HRSidebar tab={tab} setTab={setTab} hrUser={hrUser} onBack={handleBack} open={sidebarOpen} setOpen={setSidebarOpen} />
        <div style={{
          flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0,
          marginLeft: sidebarOpen ? 230 : 68, transition: 'margin-left 0.22s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <button onClick={() => setTab(personType === 'intern' ? 'interns' : 'employees')} style={S.backBtn}>← Back</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg,${C.purple},${C.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 24, boxShadow: `0 4px 14px ${C.purple}40` }}>{(selectedPerson.name || '?')[0].toUpperCase()}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>{selectedPerson.name}</h2>
                <div style={{ color: C.teal, fontWeight: 600, fontSize: 13, marginTop: 3 }}>{selectedPerson.role} · {personType === 'intern' ? 'Intern' : 'Employee'} · {monthLabel}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22, marginBottom: 26 }}>
            <div style={{ ...S.card, marginBottom: 0 }}>
              <div style={S.cardHead}>📊 Attendance Summary</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '20px 22px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <DonutChart segments={attSegments} size={96} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', lineHeight: 1.1 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: rate >= 75 ? C.green : rate >= 50 ? C.amber : C.danger }}>{rate}%</div>
                    <div style={{ fontSize: 9, color: '#94A3B8' }}>rate</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[
                    { label: 'Present', val: s.present, color: C.green },
                    { label: 'Late', val: s.late, color: C.amber },
                    { label: 'Absent', val: s.absent, color: C.danger },
                    { label: 'Leave', val: s.leave, color: C.purple },
                  ].map(x => (
                    <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: x.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#64748B', flex: 1, fontWeight: 500 }}>{x.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: x.color }}>{x.val}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{total} days recorded</div>
                </div>
              </div>
            </div>

            <div style={{ ...S.card, marginBottom: 0 }}>
              <div style={S.cardHead}>📁 Project Performance</div>
              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                  {[
                    { label: 'Total', val: myProjects.length, color: C.purple },
                    { label: 'Done', val: projDone, color: C.green },
                    { label: 'Active', val: projActive, color: C.amber },
                    { label: 'Delayed', val: projDelayed, color: C.danger },
                  ].map(x => (
                    <div key={x.label} style={{ textAlign: 'center', background: `${x.color}10`, borderRadius: 12, padding: '10px 14px' }}>
                      <div style={{ fontSize: 30, fontWeight: 900, color: x.color }}>{x.val}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{x.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: C.mid, marginBottom: 7, fontWeight: 700 }}>Completion Rate</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ProgressBar value={projCompRate} height={10} />
                  <span style={{ fontSize: 14, fontWeight: 900, color: projCompRate >= 75 ? C.green : projCompRate >= 50 ? C.amber : C.danger, minWidth: 40 }}>{projCompRate}%</span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 10 }}>⏱ {projOnTime} on-time · {onTimeRate}% rate</div>
              </div>
            </div>

            <div style={{ ...S.card, marginBottom: 0 }}>
              <div style={S.cardHead}>🏆 Overall Score</div>
              <div style={{ padding: '20px 22px' }}>
                {[
                  { label: 'Attendance', val: rate, color: rate >= 75 ? C.green : rate >= 50 ? C.amber : C.danger },
                  { label: 'Project Completion', val: projCompRate, color: projCompRate >= 75 ? C.green : projCompRate >= 50 ? C.amber : C.danger },
                  { label: 'On-Time Delivery', val: onTimeRate, color: C.teal },
                ].map(metric => (
                  <div key={metric.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{metric.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: metric.color }}>{metric.val}%</span>
                    </div>
                    <ProgressBar value={metric.val} height={8} />
                  </div>
                ))}
                <div style={{ marginTop: 6, padding: '12px 16px', background: `linear-gradient(135deg,${C.purple}15,${C.teal}10)`, borderRadius: 14, textAlign: 'center', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: C.purple }}>{Math.round(rate * 0.4 + projCompRate * 0.4 + onTimeRate * 0.2)}%</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Combined Score</div>
                </div>
              </div>
            </div>
          </div>

          {myProjects.length > 0 && (
            <div style={{ ...S.card, marginBottom: 22 }}>
              <div style={S.cardHead}>
                <span>📋 Assigned Projects</span>
                <span style={{ fontSize: 12, color: C.teal, fontWeight: 700 }}>{projDone} Completed · {projActive} Active · {projDelayed} Delayed</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8F7FF' }}>
                      {['#', 'Project Name', 'Deadline', 'Status', 'Deadline Status'].map(h => (
                        <th key={h} style={h === 'Project Name' ? S.thL : S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myProjects.map((p, i) => {
                      const ds = getDeadlineStatus(p);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFF' }}>
                          <td style={{ ...S.td, color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                          <td style={{ ...S.tdL, fontWeight: 700, color: C.purple, cursor: 'pointer' }}
                            onClick={() => setDescPopup({ ...p, _assignedDisplay: p.personName || selectedPerson.name })}>
                            <span style={{ borderBottom: `1.5px dotted ${C.purple}` }}>{p.projectName || p.name || p.title || '—'}</span>
                          </td>
                          <td style={S.td}>{formatDate(p.deadline || p.dueDate)}</td>
                          <td style={S.td}>
                            <Badge status={
                              (() => {
                                const st = (p.status || '').toLowerCase().replace(/[-_]/g, ' ');
                                if (st === 'completed') return 'Completed';
                                if (st.includes('progress')) return 'In Progress';
                                return p.status || 'Pending';
                              })()
                            } />
                          </td>
                          <td style={S.td}>
                            <span style={{ color: ds.color, fontWeight: 600 }}>{ds.icon} {ds.text}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={S.card}>
            <div style={S.cardHead}>
              <span>📅 Day-by-Day Attendance</span>
              <span style={{ fontSize: 12, color: C.purple, fontWeight: 700 }}>{dayList.length} entries · {monthLabel}</span>
            </div>
            {dayList.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No records for this period.</div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#F8F7FF', position: 'sticky', top: 0 }}>
                    <tr>{['#', 'Date', 'Day', 'Check In', 'Status'].map(h => (
                      <th key={h} style={h === 'Date' ? S.thL : S.th}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {dayList.map((d, i) => (
                      <tr key={d.ds} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFF' }}>
                        <td style={{ ...S.td, color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ ...S.tdL, fontWeight: 700 }}>{d.date}</td>
                        <td style={{ ...S.td, color: '#64748B', fontWeight: 600 }}>{d.day}</td>
                        <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 500 }}>{d.checkIn}</td>
                        <td style={S.td}><Badge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <DescriptionPopup project={descPopup} onClose={() => setDescPopup(null)} getStatusBadge={getStatusBadge} />
      </div>
    );
  }

  // ========== MAIN OVERVIEW ==========
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{FONTS}</style>
      <HRSidebar tab={tab} setTab={setTab} hrUser={hrUser} onBack={handleBack} open={sidebarOpen} setOpen={setSidebarOpen} />

      <div style={{
        flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0,
        marginLeft: sidebarOpen ? 230 : 68, transition: 'margin-left 0.22s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
              {tab === 'overview' ? '📊 Overview Dashboard' : tab === 'employees' ? '👥 Employee Reports' : tab === 'interns' ? '🎓 Intern Reports' : '📁 Project Reports'}
            </h2>
            <div style={{ color: C.purple, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
              {new Date().toDateString()} · {monthLabel}
            </div>
          </div>
          <div style={S.monthNav}>
            <button onClick={() => changeMonth(-1)} style={S.monthBtn}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 130, textAlign: 'center' }}>{monthLabel}</span>
            <button onClick={() => changeMonth(1)} disabled={isCurrent}
              style={{ ...S.monthBtn, color: isCurrent ? '#ccc' : C.purple, cursor: isCurrent ? 'not-allowed' : 'pointer' }}>›</button>
          </div>
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 18, marginBottom: 28 }}>
              <StatCard label="Total Employees" value={employees.length} color={C.purple} icon="👥" sub={`${avgRate(employees, attStats)}% avg attendance`} />
              <StatCard label="Total Interns" value={interns.length} color={C.teal} icon="🎓" sub={`${avgRate(interns, internStats)}% avg attendance`} />
              <StatCard label="Total Projects" value={projectStats.total} color={C.gold} icon="📁" sub={`${projectStats.completionRate}% completion`} />
              <StatCard label="Active Projects" value={projectStats.inProgress} color={C.amber} icon="⚙️" sub={`${projectStats.delayed} delayed`} />
              <StatCard label="Completed" value={projectStats.completed} color={C.green} icon="✅" sub={`${projectStats.completionRate}% rate`} />
            </div>

            <div style={{ ...S.card, marginBottom: 28 }}>
              <div style={S.cardHead}>
                <span>🏆 Top Performers</span>
                <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
                  {[['project', '📁 Project'], ['attendance', '📅 Att']].map(([mode, lbl]) => (
                    <button key={mode} onClick={() => setPerfMode(mode)} style={{
                      padding: '4px 11px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 10, fontWeight: 700,
                      background: perfMode === mode ? C.purple : 'transparent',
                      color: perfMode === mode ? '#fff' : '#64748B',
                      transition: 'all 0.15s',
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                {(() => {
                  const allCandidates = [...employees.map(p => ({ ...p, _type: 'employee' })), ...interns.map(p => ({ ...p, _type: 'intern' }))]
                    .map(p => {
                      const isIntern = p._type === 'intern';
                      const attRate = getAttRate(p.id, isIntern ? internStats : attStats);
                      const pp = getPersonProjects(p);
                      const _sn = (st) => st ? st.toLowerCase().replace(/[-_]/g, ' ') : '';
                      const done = pp.filter(x => _sn(x.status) === 'completed').length;
                      const onTime = pp.filter(x => isOnTime(x.onTime)).length;
                      const compRate = pp.length ? Math.round((done / pp.length) * 100) : 0;
                      const otRate = pp.length ? Math.round((onTime / pp.length) * 100) : 0;
                      const projScore = Math.round(compRate * 0.6 + otRate * 0.4);
                      const score = perfMode === 'project' ? Math.round(attRate * 0.4 + projScore * 0.6) : attRate;
                      return { ...p, attRate, compRate, otRate, projScore, score, isIntern };
                    })
                    .sort((a, b) => b.score - a.score);
                  const visibleCandidates = allCandidates.slice(0, topPerformerLimit);
                  return (
                    <>
                      {visibleCandidates.map((p, i) => (
                        <div key={p.id} onClick={() => openPerson(p, p.isIntern ? 'intern' : 'employee')}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ fontSize: 12, color: '#94A3B8', minWidth: 18, textAlign: 'right', fontWeight: 700 }}>{i + 1}</div>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${p.isIntern ? C.teal : C.purple},${C.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {(p.name || '?')[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                              <MiniBar value={p.attRate} max={100} color={C.green} />
                              {perfMode === 'project' && <MiniBar value={p.compRate} max={100} color={C.teal} />}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: p.score >= 75 ? C.green : p.score >= 50 ? C.amber : C.danger }}>{p.score}%</div>
                            {perfMode === 'project' && <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600 }}>{p.compRate}% proj</div>}
                          </div>
                        </div>
                      ))}
                      {topPerformerLimit < allCandidates.length && (
                        <div style={{ padding: '12px 20px', textAlign: 'center', borderTop: '1px solid #F1F5F9', marginTop: 4 }}>
                          <button
                            onClick={() => setTopPerformerLimit(prev => Math.min(prev + 3, allCandidates.length))}
                            style={{ fontSize: 12, fontWeight: 700, color: C.purple, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                          >
                            View more ({allCandidates.length - topPerformerLimit} remaining)
                          </button>
                          {topPerformerLimit > 3 && (
                            <button
                              onClick={() => setTopPerformerLimit(3)}
                              style={{ fontSize: 12, fontWeight: 700, color: C.teal, background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 16, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 28 }}>
              <div style={{ ...S.card, marginBottom: 0 }}>
                <div style={S.cardHead}><span>📅 Attendance Overview</span><span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{monthLabel}</span></div>
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 18 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <DonutChart segments={[
                        { color: C.green, value: overallAttStats.present },
                        { color: C.amber, value: overallAttStats.late },
                        { color: C.danger, value: overallAttStats.absent },
                        { color: C.purple, value: overallAttStats.leave },
                      ].filter(x => x.value > 0)} size={84} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', lineHeight: 1.1 }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: C.purple }}>{overallAttStats.present + overallAttStats.late}</div>
                        <div style={{ fontSize: 9, color: '#94A3B8' }}>days in</div>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[
                        { l: 'Present', v: overallAttStats.present, c: C.green },
                        { l: 'Late', v: overallAttStats.late, c: C.amber },
                        { l: 'Absent', v: overallAttStats.absent, c: C.danger },
                        { l: 'Leave', v: overallAttStats.leave, c: C.purple },
                      ].map(x => (
                        <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: x.c, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#64748B', flex: 1, fontWeight: 500 }}>{x.l}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: x.c }}>{x.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: C.green }}>{avgRate(employees, attStats)}%</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Employees</div>
                    </div>
                    <div style={{ flex: 1, background: '#ECFEFF', border: '1px solid #CFFAFE', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: C.teal }}>{avgRate(interns, internStats)}%</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Interns</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ ...S.card, marginBottom: 0 }}>
                <div style={S.cardHead}><span>📁 Project Status</span></div>
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 18 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <DonutChart segments={[
                        { color: C.green, value: projectStats.completed },
                        { color: C.amber, value: projectStats.inProgress },
                        { color: '#94A3B8', value: projectStats.notStarted },
                      ].filter(x => x.value > 0)} size={84} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', lineHeight: 1.1 }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: C.purple }}>{projectStats.total}</div>
                        <div style={{ fontSize: 9, color: '#94A3B8' }}>total</div>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[
                        { l: 'Completed', v: projectStats.completed, c: C.green },
                        { l: 'In Progress', v: projectStats.inProgress, c: C.amber },
                        { l: 'Not Started', v: projectStats.notStarted, c: '#94A3B8' },
                        { l: 'On-Time', v: projectStats.onTime, c: C.teal },
                        { l: 'Delayed', v: projectStats.delayed, c: C.danger },
                      ].map(x => (
                        <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: x.c, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#64748B', flex: 1, fontWeight: 500 }}>{x.l}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: x.c }}>{x.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Completion Rate</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: projectStats.completionRate >= 75 ? C.green : C.amber }}>{projectStats.completionRate}%</span>
                  </div>
                  <ProgressBar value={projectStats.completionRate} height={9} />
                </div>
              </div>
            </div>

            <div style={{ ...S.card, marginBottom: 28 }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>🕐 Today's Attendance & Scheduled Timings</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: 500 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SearchBar
                    value={todaySearch}
                    onChange={e => setTodaySearch(e.target.value)}
                    placeholder="Search name, role, type..."
                  />
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {[
                      { label: `✅ ${filteredTodayAtt.filter(r => r.status === 'Present').length}`, bg: '#DCFCE7', c: '#15803D' },
                      { label: `⏰ ${filteredTodayAtt.filter(r => r.status === 'Late').length}`, bg: '#FEF3C7', c: '#B45309' },
                      { label: `❌ ${filteredTodayAtt.filter(r => r.status === 'Absent').length}`, bg: '#FEE2E2', c: '#B91C1C' },
                    ].map((x, i) => (
                      <span key={i} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: x.bg, color: x.c }}>{x.label}</span>
                    ))}
                  </div>
                </div>
              </div>
              {filteredTodayAtt.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                  {todaySearch ? 'No results found.' : 'No attendance records for today.'}
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                      <thead>
                        <tr style={{ background: '#F8F7FF' }}>
                          <th style={S.thL}>Name</th>
                          <th style={S.th}>Type</th>
                          <th style={S.th}>Role</th>
                          <th style={S.th}>Scheduled In</th>
                          <th style={S.th}>Scheduled Out</th>
                          <th style={S.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTodayAtt.slice(0, todayLimit).map((rec, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#fff' : '#FAFAFF' }}>
                            <td style={{ ...S.tdL, fontWeight: 700 }}>{rec.name}</td>
                            <td style={S.td}><Badge status={rec.type} /></td>
                            <td style={{ ...S.td, fontSize: 12, color: '#64748B' }}>{rec.role}</td>
                            <td style={{ ...S.td }}>
                              <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: C.green, background: '#F0FDF4', padding: '4px 10px', borderRadius: 8, fontSize: 12 }}>
                                🕐 {rec.scheduledIn}
                              </span>
                            </td>
                            <td style={{ ...S.td }}>
                              <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: C.amber, background: '#FEF3C7', padding: '4px 10px', borderRadius: 8, fontSize: 12 }}>
                                🕔 {rec.scheduledOut}
                              </span>
                            </td>
                            <td style={S.td}><Badge status={rec.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(todayLimit < filteredTodayAtt.length || todayLimit > 5) && (
                    <div style={{ padding: '12px 22px', borderTop: '1px solid #F1F5F9', textAlign: 'center', background: '#FAFAFF' }}>
                      {todayLimit < filteredTodayAtt.length && (
                        <button
                          onClick={() => setTodayLimit(prev => Math.min(prev + 5, filteredTodayAtt.length))}
                          style={{ fontSize: 12, fontWeight: 700, color: C.purple, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                        >
                          View more ({filteredTodayAtt.length - todayLimit} remaining)
                        </button>
                      )}
                      {todayLimit > 5 && (
                        <button
                          onClick={() => setTodayLimit(5)}
                          style={{ fontSize: 12, fontWeight: 700, color: C.teal, background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: todayLimit < filteredTodayAtt.length ? 16 : 0, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <SearchBar
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search employees or interns by name or role..."
              />
              <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {filteredEmployees.length + filteredInterns.length} results
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              <QuickTable
                title="Employees"
                data={filteredEmployees}
                stats={attStats}
                onView={p => openPerson(p, 'employee')}
                initialLimit={3}
              />
              <QuickTable
                title="Interns"
                data={filteredInterns}
                stats={internStats}
                onView={p => openPerson(p, 'intern')}
                initialLimit={3}
              />
            </div>
          </>
        )}

        {tab === 'employees' && (
          <FullTable data={filteredEmployees} stats={attStats} onView={p => openPerson(p, 'employee')} projects={projects} />
        )}

        {tab === 'interns' && (
          <FullTable data={filteredInterns} stats={internStats} onView={p => openPerson(p, 'intern')} projects={projects} />
        )}

        {tab === 'projects' && (
          <ProjectsTab
            projects={projects}
            employees={employees}
            interns={interns}
            onViewPerson={openPerson}
            getStatusBadge={getStatusBadge}
          />
        )}
      </div>

      <DescriptionPopup project={descPopup} onClose={() => setDescPopup(null)} getStatusBadge={getStatusBadge} />
    </div>
  );
};

// ============================================================
// HRSidebar Component
// ============================================================
const HRSidebar = ({ tab, setTab, hrUser, onBack, open, setOpen }) => {
  const items = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'employees', icon: '👥', label: 'Employees' },
    { id: 'interns', icon: '🎓', label: 'Interns' },
    { id: 'projects', icon: '📁', label: 'Projects' },
  ];
  return (
    <div style={{
      width: open ? 230 : 68, flexShrink: 0,
      background: `linear-gradient(180deg, ${C.dark} 0%, #2D1B4E 100%)`,
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans',sans-serif", transition: 'width 0.22s ease',
      overflow: 'hidden', boxShadow: '2px 0 20px rgba(0,0,0,0.15)',
      position: 'fixed', top: 0, left: 0, zIndex: 100,
    }}>
      <div style={{ padding: '22px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {open && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F0EAF8', letterSpacing: -0.3 }}>WellMind</div>
            <div style={{ fontSize: 9, color: 'rgba(240,234,248,0.35)', fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 1 }}>HR Portal</div>
          </div>
        )}
        <button onClick={() => setOpen(!open)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(240,234,248,0.5)', fontSize: 14, lineHeight: 1, padding: '7px 8px', borderRadius: 8, transition: 'background 0.15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          {open ? '◀' : '▶'}
        </button>
      </div>

      {open && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg,${C.purple},${C.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 15, flexShrink: 0, boxShadow: `0 3px 10px ${C.purple}50` }}>
            {(hrUser.name || 'H')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#F0EAF8', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hrUser.name || 'HR'}</div>
            <div style={{ color: 'rgba(240,234,248,0.35)', fontSize: 10, fontWeight: 600 }}>{hrUser.hrId || 'Read-Only'}</div>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '14px 0' }}>
        {items.map(it => (
          <button key={it.id} onClick={() => setTab(it.id)}
            style={{
              width: '100%', padding: open ? '13px 20px' : '15px 0',
              background: tab === it.id ? 'rgba(124,58,237,0.25)' : 'transparent',
              border: 'none',
              borderLeft: tab === it.id ? `3px solid #A78BFA` : '3px solid transparent',
              color: tab === it.id ? '#F0EAF8' : 'rgba(240,234,248,0.45)',
              fontWeight: tab === it.id ? 700 : 400, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: open ? 12 : 0, justifyContent: open ? 'flex-start' : 'center',
              textAlign: 'left', transition: 'all 0.15s',
              fontFamily: "'DM Sans',sans-serif",
            }}
            onMouseEnter={e => { if (tab !== it.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (tab !== it.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: open ? 16 : 19 }}>{it.icon}</span>
            {open && it.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: open ? '18px 18px' : '18px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onBack}
          style={{ width: '100%', padding: open ? '11px' : '11px 0', background: 'rgba(8,145,178,0.2)', color: '#67E8F9', border: '1px solid rgba(8,145,178,0.35)', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: open ? 12 : 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'DM Sans',sans-serif", transition: 'background 0.15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(8,145,178,0.35)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(8,145,178,0.2)'}
        >
          <span>←</span> {open && 'Back to Dashboard'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// QuickTable Component
// ============================================================
const QuickTable = ({ title, data, stats, onView, initialLimit = 3 }) => {
  const [visibleCount, setVisibleCount] = useState(Math.min(initialLimit, data.length));

  useEffect(() => {
    setVisibleCount(Math.min(initialLimit, data.length));
  }, [data, initialLimit]);

  const displayData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;
  const canShowLess = visibleCount > initialLimit;

  return (
    <div style={S.card}>
      <div style={{ ...S.cardHead, padding: '16px 22px' }}>
        <div>
          <span style={{ fontWeight: 800, color: C.text }}>{title === 'Employees' ? '👥' : '🎓'} {title}</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: '#94A3B8', fontWeight: 600, background: '#F1F5F9', padding: '2px 9px', borderRadius: 20 }}>{data.length} total</span>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8F7FF' }}>
            <th style={S.thL}>Name</th>
            <th style={S.th}>Att%</th>
            <th style={S.th}>P</th>
            <th style={S.th}>L</th>
            <th style={S.th}>A</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((p, idx) => {
            const s = stats[p.id] || { present: 0, late: 0, absent: 0, leave: 0 };
            const t = s.present + s.late + s.absent + s.leave;
            const r = t > 0 ? Math.round(((s.present + s.late) / t) * 100) : 0;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...S.tdL, fontSize: 13, fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg,${C.purple},${C.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {(p.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                      {p.role && <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{p.role}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ ...S.td, fontWeight: 800, color: r >= 75 ? C.green : r >= 50 ? C.amber : C.danger, fontSize: 13 }}>{r}%</td>
                <td style={{ ...S.td, color: C.green, fontWeight: 800, fontSize: 13 }}>{s.present}</td>
                <td style={{ ...S.td, color: C.amber, fontWeight: 800, fontSize: 13 }}>{s.late}</td>
                <td style={{ ...S.td, color: C.danger, fontWeight: 800, fontSize: 13 }}>{s.absent}</td>
                <td style={S.td}><button onClick={() => onView(p)} style={S.viewBtn}>View</button></td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No data available.</td>
            </tr>
          )}
        </tbody>
      </table>
      {(hasMore || canShowLess) && (
        <div style={{ padding: '12px 22px', borderTop: '1px solid #F1F5F9', textAlign: 'center', background: '#FAFAFF' }}>
          {hasMore && (
            <button
              onClick={() => setVisibleCount(prev => Math.min(prev + 3, data.length))}
              style={{ fontSize: 12, fontWeight: 700, color: C.purple, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
            >
              View more ({data.length - visibleCount} remaining)
            </button>
          )}
          {canShowLess && (
            <button
              onClick={() => setVisibleCount(initialLimit)}
              style={{ fontSize: 12, fontWeight: 700, color: C.teal, background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: hasMore ? 16 : 0, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// FullTable Component
// ============================================================
const FullTable = ({ data, stats, onView, projects }) => (
  <div style={S.card}>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F8F7FF' }}>
            <th style={S.thL}>Name / Role</th>
            <th style={{ ...S.th, color: C.green }}>Present</th>
            <th style={{ ...S.th, color: C.amber }}>Late</th>
            <th style={{ ...S.th, color: C.danger }}>Absent</th>
            <th style={{ ...S.th, color: C.purple }}>Leave</th>
            <th style={S.th}>Total</th>
            <th style={S.th}>Att%</th>
            <th style={S.th}>Projects</th>
            <th style={S.th}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, idx) => {
            const s = stats[p.id] || { present: 0, late: 0, absent: 0, leave: 0 };
            const t = s.present + s.late + s.absent + s.leave;
            const r = t > 0 ? Math.round(((s.present + s.late) / t) * 100) : 0;
            const myProj = projects.filter(pr =>
              pr.assignedTo === p.id || pr.assignedTo === p.name ||
              (Array.isArray(pr.selectedPeople) && pr.selectedPeople.includes(p.id)) ||
              (pr.personName && pr.personName.split(',').map(n => n.trim().toLowerCase()).includes((p.name || '').toLowerCase())) ||
              (Array.isArray(pr.members) && (pr.members.includes(p.id) || pr.members.includes(p.name)))
            );
            const done = myProj.filter(pr => (pr.status || '').toLowerCase().replace(/[-_]/g, ' ') === 'completed').length;
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...S.tdL }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,${C.purple},${C.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14, flexShrink: 0, boxShadow: `0 3px 10px ${C.purple}30` }}>
                      {(p.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1, fontWeight: 500 }}>{p.role}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...S.td, color: C.green, fontWeight: 900, fontSize: 15 }}>{s.present}</td>
                <td style={{ ...S.td, color: C.amber, fontWeight: 900, fontSize: 15 }}>{s.late}</td>
                <td style={{ ...S.td, color: C.danger, fontWeight: 900, fontSize: 15 }}>{s.absent}</td>
                <td style={{ ...S.td, color: C.purple, fontWeight: 900, fontSize: 15 }}>{s.leave}</td>
                <td style={{ ...S.td, fontWeight: 800, fontSize: 14, color: C.text }}>{t}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontWeight: 900, color: r >= 75 ? C.green : r >= 50 ? C.amber : C.danger, fontSize: 14 }}>{r}%</span>
                    <MiniBar value={r} max={100} color={r >= 75 ? C.green : r >= 50 ? C.amber : C.danger} />
                  </div>
                </td>
                <td style={S.td}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: C.green, fontWeight: 800 }}>{done}</span>
                    <span style={{ color: '#94A3B8' }}>/{myProj.length}</span>
                  </div>
                </td>
                <td style={S.td}><button onClick={() => onView(p)} style={S.viewBtn}>👁 View</button></td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ============================================================
// ProjectsTab Component
// ============================================================
const ProjectsTab = ({ projects, employees, interns, onViewPerson, getStatusBadge }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesc, setSelectedDesc] = useState(null);

  const allPeople = [
    ...employees.map(e => ({ ...e, type: 'Employee' })),
    ...interns.map(i => ({ ...i, type: 'Intern' })),
  ];

  const getPersonName = (project) => {
    if (project.personName) return project.personName;
    if (project.selectedPeople && project.selectedPeople.length) {
      return project.selectedPeople.map(id => {
        const person = allPeople.find(p => p.id === id);
        return person ? person.name : id;
      }).join(', ');
    }
    return '—';
  };

  const filteredProjects = projects.filter(p =>
    p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPersonName(p).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={S.card}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg, gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>All Projects ({projects.length})</div>
        <SearchBar value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search projects or assignee..." />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8F7FF' }}>
              <th style={S.thL}>Project Name</th>
              <th style={S.th}>Assigned To</th>
              <th style={S.th}>Deadline</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Deadline Status</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFF' }}>
                <td
                  style={{ ...S.tdL, fontWeight: 700, color: C.purple, cursor: 'pointer' }}
                  onClick={() => setSelectedDesc({ ...p, _assignedDisplay: getPersonName(p) })}
                >
                  <span style={{ borderBottom: `1.5px dotted ${C.purple}` }}>{p.projectName || p.name || '—'}</span>
                </td>
                <td style={{ ...S.td, fontSize: 12, color: '#64748B', fontWeight: 500 }}>{getPersonName(p)}</td>
                <td style={{ ...S.td, fontSize: 12 }}>{formatDate(p.deadline || p.dueDate)}</td>
                <td style={S.td}>{getStatusBadge(p.status)}</td>
                <td style={S.td}>
                  {(() => {
                    const ds = getDeadlineStatus(p);
                    return <span style={{ color: ds.color, fontWeight: 600 }}>{ds.icon} {ds.text}</span>;
                  })()}
                </td>
                <td style={S.td}>
                  <button
                    onClick={() => {
                      const assignedName = getPersonName(p);
                      const person = allPeople.find(ap =>
                        ap.name === assignedName || p.selectedPeople?.includes(ap.id)
                      );
                      if (person) onViewPerson(person, person.type === 'Intern' ? 'intern' : 'employee');
                    }}
                    style={S.viewBtn}
                  >View Assignee</button>
                </td>
              </tr>
            ))}
            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No projects found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DescriptionPopup project={selectedDesc} onClose={() => setSelectedDesc(null)} getStatusBadge={getStatusBadge} />
    </div>
  );
};

// ============================================================
// Styles object
// ============================================================
const S = {
  card: {
    background: C.card,
    borderRadius: 20,
    boxShadow: '0 2px 16px rgba(124,58,237,0.07)',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    marginBottom: 22,
  },
  cardHead: {
    padding: '16px 22px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: C.bg,
    fontSize: 14, fontWeight: 800, color: C.text,
  },
  th: {
    padding: '12px 12px', fontSize: 10, color: C.mid,
    fontWeight: 800, textAlign: 'center',
    letterSpacing: 0.8, textTransform: 'uppercase',
    fontFamily: "'DM Sans',sans-serif",
  },
  thL: {
    padding: '12px 18px', fontSize: 10, color: C.mid,
    fontWeight: 800, textAlign: 'left',
    letterSpacing: 0.8, textTransform: 'uppercase',
    fontFamily: "'DM Sans',sans-serif",
  },
  td: { padding: '14px 12px', textAlign: 'center', fontSize: 13, color: C.text },
  tdL: { padding: '14px 18px', fontSize: 13, color: C.text },
  backBtn: {
    background: C.light, border: `1.5px solid ${C.border}`,
    borderRadius: 10, padding: '9px 18px',
    cursor: 'pointer', fontWeight: 700, color: C.purple,
    fontSize: 13, fontFamily: "'DM Sans',sans-serif",
    transition: 'all 0.15s',
  },
  viewBtn: {
    background: 'transparent', color: C.teal,
    border: `1.5px solid ${C.teal}40`, borderRadius: 9,
    padding: '6px 14px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
    transition: 'all 0.15s',
  },
  monthNav: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff', borderRadius: 12,
    padding: '8px 16px',
    border: `1.5px solid ${C.border}`,
    boxShadow: '0 1px 6px rgba(124,58,237,0.06)',
  },
  monthBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontWeight: 900, fontSize: 22, color: C.purple,
    lineHeight: 1, padding: '0 4px',
  },
};

export default HRDashboard;