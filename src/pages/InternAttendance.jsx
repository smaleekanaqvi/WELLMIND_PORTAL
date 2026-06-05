import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar';
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { 
  Calendar, Clock, Users, Download, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Search, ChevronLeft, ChevronRight, Edit2, X
} from 'lucide-react';

const COLORS = {
  primary: "#623068",
  primaryDark: "#331B3F",
  primaryMid: "#47234F",
  primaryLight: "#F3E8FF",
  secondaryRed: "#8A1C37",
  actionTeal: "#0D7289",
  accentGold: "#f3edf5",
  bgPage: "#F8FAFC",
  bgCard: "#FFFFFF",
  textMain: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  status: {
    present: { bg: "#DCFCE7", text: "#166534", icon: "✅" },
    late:    { bg: "#FEF3C7", text: "#92400E", icon: "⏰" },
    absent:  { bg: "#FEE2E2", text: "#991B1B", icon: "❌" },
    leave:   { bg: "#EDE9FE", text: "#5B21B6", icon: "📋" },
    pending: { bg: "#F1F5F9", text: "#64748B", icon: "⏳" },
  },
};

const todayId = new Date().toISOString().split("T")[0];
const formatCurrentTime = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning',   emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (hour < 20) return { text: 'Good Evening',   emoji: '🌆' };
  return           { text: 'Good Night',          emoji: '🌙' };
};

const formatDate = () => new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

const loadJsPDF = () =>
  new Promise((resolve, reject) => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => {
      const at = document.createElement("script");
      at.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
      at.onload = () => resolve(window.jspdf.jsPDF);
      at.onerror = reject;
      document.head.appendChild(at);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });

const Badge = ({ status }) => {
  const s = COLORS.status[status?.toLowerCase()] || COLORS.status.pending;
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.05em",
      background: s.bg, color: s.text,
      display: "inline-flex", alignItems: "center", gap: 6
    }}>
      {s.icon} {status}
    </span>
  );
};

const addPdfFooter = (pdf, pageWidth) => {
  const n = pdf.internal.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    pdf.setPage(p);
    const ph = pdf.internal.pageSize.getHeight();
    pdf.setDrawColor(226, 232, 240);
    pdf.line(40, ph-25, pageWidth-40, ph-25);
    pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
    pdf.text("WellMind Data Solutions – Intern Attendance", 40, ph-12);
    pdf.text(`Page ${p} of ${n}`, pageWidth-40, ph-12, { align: "right" });
  }
};

/* ── TimeEditModal ── */
const TimeEditModal = ({ intern, type, onSave, onClose }) => {
  const to24 = (t) => {
    if (!t || !t.includes(" ")) return "09:00";
    const [time, mod] = t.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (mod === "PM" && h !== 12) h += 12;
    if (mod === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  };
  const to12 = (t) => {
    const [h, m] = t.split(":").map(Number);
    const mod = h >= 12 ? "PM" : "AM";
    const hr  = h % 12 || 12;
    return `${String(hr).padStart(2,"0")}:${String(m).padStart(2,"0")} ${mod}`;
  };
  const currentValue = type === 'checkin' ? intern.scheduledIn : (intern.scheduledOut || "05:00 PM");
  const [timeVal, setTimeVal] = useState(to24(currentValue));
  const [saving,  setSaving]  = useState(false);
  const handleSave = async () => {
    setSaving(true);
    const formatted = to12(timeVal);
    try {
      if (type === 'checkin') {
        await updateDoc(doc(db, "interns", intern.id), { checkInTime: formatted });
        onSave(intern.id, formatted, 'checkin');
      } else {
        await updateDoc(doc(db, "interns", intern.id), { checkOutTime: formatted });
        onSave(intern.id, formatted, 'checkout');
      }
    } catch (e) { console.error("Time update error:", e); alert("Failed to save."); }
    finally { setSaving(false); }
  };
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.box} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={modalStyles.avatar}>{(intern.name || "?")[0].toUpperCase()}</div>
          <div>
            <div style={modalStyles.name}>{intern.name}</div>
            <div style={modalStyles.role}>{intern.role}</div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={20}/></button>
        </div>
        <div style={modalStyles.body}>
          <label style={modalStyles.label}>Schedule {type === 'checkin' ? 'Check-In' : 'Check-Out'}</label>
          <input type="time" value={timeVal} onChange={e => setTimeVal(e.target.value)} style={modalStyles.input}/>
          <div style={modalStyles.preview}>Preview: <b style={{color:COLORS.actionTeal}}>{to12(timeVal)}</b></div>
        </div>
        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.btnSecondary}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{...modalStyles.btnPrimary,opacity:saving?0.7:1}}>
            {saving?"Saving...":"Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: { position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)" },
  box: { background:"#fff",borderRadius:16,width:400,maxWidth:"90%",boxShadow:"0 20px 25px -5px rgba(0,0,0,0.1)",border:`1px solid ${COLORS.border}`,overflow:"hidden",animation:"fadeIn 0.2s ease-out" },
  header: { background:COLORS.bgPage,padding:"20px",borderBottom:`1px solid ${COLORS.border}`,display:"flex",alignItems:"center",gap:12 },
  avatar: { width:40,height:40,borderRadius:"50%",background:COLORS.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16 },
  name: { color:COLORS.textMain,fontWeight:600,fontSize:16 },
  role: { color:COLORS.textMuted,fontSize:13 },
  closeBtn: { marginLeft:"auto",background:"none",border:"none",color:COLORS.textMuted,cursor:"pointer",padding:4,borderRadius:4 },
  body: { padding:"24px" },
  label: { display:"block",fontSize:13,fontWeight:600,color:COLORS.textMuted,marginBottom:8 },
  input: { width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${COLORS.border}`,fontSize:16,outline:"none",background:"#fff",color:COLORS.textMain },
  preview: { marginTop:12,fontSize:13,color:COLORS.textMuted },
  footer: { padding:"16px 24px",background:COLORS.bgPage,borderTop:`1px solid ${COLORS.border}`,display:"flex",justifyContent:"flex-end",gap:12 },
  btnSecondary: { padding:"8px 16px",borderRadius:6,border:`1px solid ${COLORS.border}`,background:"#fff",color:COLORS.textMain,fontSize:13,fontWeight:500,cursor:"pointer" },
  btnPrimary: { padding:"8px 16px",borderRadius:6,border:"none",background:COLORS.primary,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer" }
};

/* ── P / L / A checkbox cell ── */
const MarkCell = ({ record, onMark }) => {
  const checks = [
    { label:"P", title:"Present", type:"Present", color:COLORS.status.present.text, bg:COLORS.status.present.bg, checked:record.status==="Present"||record.status==="Late" },
    { label:"L", title:"Leave",   type:"Leave",   color:COLORS.status.leave.text,   bg:COLORS.status.leave.bg,   checked:record.status==="Leave" },
    { label:"A", title:"Absent",  type:"Absent",  color:COLORS.status.absent.text,  bg:COLORS.status.absent.bg,  checked:record.status==="Absent" },
  ];
  return (
    <div style={{ display:"flex", gap:12, justifyContent:"center", alignItems:"flex-end" }}>
      {checks.map(c => (
        <div key={c.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{
            fontSize:10, fontWeight:800, color:c.checked?c.color:COLORS.textMuted,
            background:c.checked?c.bg:"transparent",
            padding:"2px 5px", borderRadius:4,
            letterSpacing:"0.04em", lineHeight:1,
            transition:"all 0.2s"
          }}>{c.label}</span>
          <input
            type="checkbox"
            checked={c.checked}
            onChange={() => onMark(record.id, record.scheduledIn, c.type)}
            style={{ accentColor:c.color, width:16, height:16, cursor:"pointer" }}
            title={c.title}
          />
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════ */
const InternAttendance = ({ onNavigate }) => {
  const [records, setRecords]             = useState([]);
  const [monthlyStats, setMonthlyStats]   = useState({});
  const [dailyDetails, setDailyDetails]   = useState({});
  const [view, setView]                   = useState("daily");
  const [selectedEmp, setSelectedEmp]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [currentTime, setCurrentTime]     = useState(formatCurrentTime());
  const [downloading, setDownloading]     = useState(false);
  const [personDl, setPersonDl]           = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [editType, setEditType]           = useState('checkin');
  const [selectedDate, setSelectedDate]   = useState(todayId);
  const [searchTerm, setSearchTerm]       = useState("");

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });

  const greeting    = getGreeting();
  const currentDate = formatDate();
  const isToday     = selectedDate === todayId;
  const baseRecordsRef = useRef([]);
  const recordsRef     = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { recordsRef.current = records; }, [records]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(formatCurrentTime()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const snap = await getDocs(collection(db, "interns"));
        const base = snap.docs.map(d => ({
          id: d.id, ...d.data(),
          scheduledIn: d.data().checkInTime || "09:00 AM",
          scheduledOut: d.data().checkOutTime || "05:00 PM",
          status: "Pending", checkIn: null,
        }));
        baseRecordsRef.current = base;
      } catch (e) { console.error("Interns load error:", e); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (baseRecordsRef.current.length === 0) return;
    const fresh = baseRecordsRef.current.map(r => ({ ...r, status: "Pending", checkIn: null }));
    setRecords(fresh);
    recordsRef.current = fresh;
    const unsub = onSnapshot(collection(db, "intern_attendance", selectedDate, "records"), (s) => {
      const updates = {};
      s.forEach(d => { updates[d.id] = d.data(); });
      setRecords(prev => prev.map(r => updates[r.id] ? { ...r, ...updates[r.id] } : r));
    });
    return () => unsub();
  }, [selectedDate, loading]);

  const filteredRecords = records.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAttendance = async (empId, empScheduledIn, type) => {
    const nowStr = formatCurrentTime();
    let finalStatus = type;
    if (type === "Present" && isToday) {
      const parseMin = (t) => {
        if (!t || !t.includes(" ")) return 0;
        const [time, mod] = t.split(" ");
        let [h, m] = time.split(":");
        if (h === '12') h = '0';
        return (parseInt(h) + (mod === 'PM' ? 12 : 0)) * 60 + parseInt(m);
      };
      if (parseMin(nowStr) > parseMin(empScheduledIn) + 5) finalStatus = "Late";
    }
    const payload = {
      status: finalStatus,
      checkIn: (finalStatus === "Present" || finalStatus === "Late") ? nowStr : "—",
      timestamp: new Date(), dateId: selectedDate, internId: empId,
    };
    try {
      await setDoc(doc(db, "intern_attendance", selectedDate, "records", empId), payload, { merge: true });
      setRecords(prev => prev.map(r => r.id === empId ? { ...r, ...payload } : r));
    } catch (e) { console.error("Save error:", e); }
  };

  const handleTimeSaved = (internId, newTime, type) => {
    setRecords(prev => prev.map(r => r.id === internId ? { ...r, [type === 'checkin' ? 'scheduledIn' : 'scheduledOut']: newTime } : r));
    setEditingIntern(null);
  };

  const fetchMonthlyReport = async () => {
    const stats = {}, details = {};
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth(), todayDay = now.getDate();
    const dayStrings = [];
    for (let d = 1; d <= todayDay; d++)
      dayStrings.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    try {
      const results = await Promise.all(
        dayStrings.map(dayStr =>
          getDocs(collection(db, "intern_attendance", dayStr, "records"))
            .then(snap => ({ dayStr, snap }))
            .catch(() => ({ dayStr, snap: { forEach: () => {} } }))
        )
      );
      results.forEach(({ dayStr, snap }) => {
        snap.forEach(docSnap => {
          const data = docSnap.data(), empId = docSnap.id;
          if (!stats[empId])   stats[empId]   = { present:0, late:0, absent:0, leave:0 };
          if (!details[empId]) details[empId] = {};
          details[empId][dayStr] = { status: data.status||"—", checkIn: data.checkIn||"—" };
          if      (data.status==="Present") stats[empId].present++;
          else if (data.status==="Late")    stats[empId].late++;
          else if (data.status==="Absent")  stats[empId].absent++;
          else if (data.status==="Leave")   stats[empId].leave++;
        });
      });
      recordsRef.current.forEach(r => {
        if (r.status && r.status !== "Pending") {
          if (!stats[r.id])   stats[r.id]   = { present:0, late:0, absent:0, leave:0 };
          if (!details[r.id]) details[r.id] = {};
          if (!details[r.id][todayId]) {
            details[r.id][todayId] = { status: r.status, checkIn: r.checkIn||"—" };
            if      (r.status==="Present") stats[r.id].present++;
            else if (r.status==="Late")    stats[r.id].late++;
            else if (r.status==="Absent")  stats[r.id].absent++;
            else if (r.status==="Leave")   stats[r.id].leave++;
          }
        }
      });
      setMonthlyStats(stats);
      setDailyDetails(details);
      return { stats, details };
    } catch (e) { console.error("fetchMonthlyReport error:", e); return { stats:{}, details:{} }; }
  };

  const openPersonView = async (emp) => { setSelectedEmp(emp); await fetchMonthlyReport(); setView("person"); };
  const goToMonthly   = async ()      => { await fetchMonthlyReport(); setView("monthly"); };

  const downloadMonthlyPDF = async () => {
    setDownloading(true);
    try {
      const JsPDF = await loadJsPDF();
      const { stats } = await fetchMonthlyReport();
      const monthLabel = new Date().toLocaleString("default",{month:"long",year:"numeric"});
      const pdf = new JsPDF({orientation:"landscape",unit:"pt",format:"a4"});
      const pw  = pdf.internal.pageSize.getWidth();
      pdf.setFillColor(98,48,104); pdf.rect(0,0,pw,70,"F");
      pdf.setFont("helvetica","bold"); pdf.setFontSize(20); pdf.setTextColor(245,240,229);
      pdf.text("Monthly Intern Attendance Report",pw/2,30,{align:"center"});
      pdf.setFontSize(12); pdf.text(monthLabel,pw/2,52,{align:"center"});
      pdf.setFontSize(8); pdf.setTextColor(180,160,140);
      pdf.text(`Generated: ${new Date().toLocaleString()}`,40,88);
      const totals = recordsRef.current.reduce((acc,r)=>{ const s=stats[r.id]||{present:0,late:0,absent:0,leave:0}; acc.present+=s.present;acc.late+=s.late;acc.absent+=s.absent;acc.leave+=s.leave; return acc; },{present:0,late:0,absent:0,leave:0});
      pdf.autoTable({
        startY:105,
        head:[["#","Intern Name","Role","Scheduled Time","Present","Late","Absent","Leave","Total Days"]],
        body:recordsRef.current.map((r,i)=>{ const s=stats[r.id]||{present:0,late:0,absent:0,leave:0}; return [i+1,r.name||"—",r.role||"—",r.scheduledIn||"09:00 AM",s.present,s.late,s.absent,s.leave,s.present+s.late+s.absent+s.leave]; }),
        foot:[["","TOTAL","","",totals.present,totals.late,totals.absent,totals.leave,totals.present+totals.late+totals.absent+totals.leave]],
        theme:"grid",
        headStyles:{fillColor:[98,48,104],textColor:[245,240,229],fontStyle:"bold",halign:"center",fontSize:9},
        bodyStyles:{halign:"center",fontSize:9},
        footStyles:{fillColor:[51,27,63],textColor:[245,240,229],fontStyle:"bold",halign:"center",fontSize:9},
        alternateRowStyles:{fillColor:[250,246,240]}, showFoot:"lastPage", margin:{left:30,right:30},
      });
      addPdfFooter(pdf,pw);
      pdf.save(`WellMind_Intern_Attendance_${new Date().toISOString().slice(0,7)}.pdf`);
    } catch(e){ console.error(e); alert("PDF generation failed."); }
    finally { setDownloading(false); }
  };

  const downloadPersonPDF = async () => {
    if (!selectedEmp) return;
    setPersonDl(true);
    try {
      const JsPDF = await loadJsPDF();
      const { details, stats:fs } = await fetchMonthlyReport();
      const empDays  = details[selectedEmp.id]||{};
      const empStats = fs[selectedEmp.id]||{present:0,late:0,absent:0,leave:0};
      const total    = empStats.present+empStats.late+empStats.absent+empStats.leave;
      const rate     = total>0?Math.round(((empStats.present+empStats.late)/total)*100):0;
      const ml       = new Date().toLocaleString("default",{month:"long",year:"numeric"});
      const pdf = new JsPDF({orientation:"portrait",unit:"pt",format:"a4"});
      const pw  = pdf.internal.pageSize.getWidth();
      pdf.setFillColor(13,114,137); pdf.rect(0,0,pw,80,"F");
      pdf.setFont("helvetica","bold"); pdf.setFontSize(18); pdf.setTextColor(255,255,255);
      pdf.text(selectedEmp.name||"—",40,35);
      pdf.setFontSize(11); pdf.text(`${selectedEmp.role||"—"}  ·  ${ml}`,40,55);
      pdf.setFontSize(9); pdf.setTextColor(180,230,240); pdf.text(`Generated: ${new Date().toLocaleString()}`,40,70);
      const by=100;
      pdf.setFillColor(240,235,225); pdf.roundedRect(40,by,pw-80,36,6,6,"F");
      pdf.setFont("helvetica","bold"); pdf.setFontSize(11); pdf.setTextColor(45,27,56);
      pdf.text("Attendance Rate",56,by+14);
      pdf.setFontSize(13); pdf.setTextColor(13,114,137);
      pdf.text(`${rate}%`,pw-56,by+14,{align:"right"});
      pdf.setFillColor(220,210,200); pdf.roundedRect(56,by+20,pw-112,8,4,4,"F");
      pdf.setFillColor(13,114,137); pdf.roundedRect(56,by+20,Math.max(8,(rate/100)*(pw-112)),8,4,4,"F");
      const cy=152,cw=(pw-80-30)/4,ch=58,g=10;
      [{label:"Present",value:empStats.present,bg:[220,252,231],fg:[21,128,61]},
       {label:"Late",value:empStats.late,bg:[254,243,199],fg:[180,83,9]},
       {label:"Absent",value:empStats.absent,bg:[254,226,226],fg:[138,28,55]},
       {label:"Leave",value:empStats.leave,bg:[224,231,255],fg:[98,48,104]}
      ].forEach((c,i)=>{
        const x=40+i*(cw+g);
        pdf.setFillColor(...c.bg); pdf.roundedRect(x,cy,cw,ch,8,8,"F");
        pdf.setFont("helvetica","bold"); pdf.setFontSize(20); pdf.setTextColor(...c.fg);
        pdf.text(String(c.value),x+cw/2,cy+28,{align:"center"});
        pdf.setFontSize(9); pdf.setFont("helvetica","normal"); pdf.setTextColor(100,116,139);
        pdf.text(c.label,x+cw/2,cy+44,{align:"center"});
      });
      const sorted = Object.entries(empDays).sort(([a],[b])=>a.localeCompare(b));
      pdf.autoTable({
        startY:cy+ch+20,
        head:[["#","Date","Day","Check In","Status"]],
        body:sorted.map(([ds,data],i)=>{ const d=new Date(ds); return [i+1,d.toLocaleDateString("en-US",{day:"2-digit",month:"short",year:"numeric"}),d.toLocaleDateString("en-US",{weekday:"long"}),data.checkIn||"—",data.status||"—"]; }),
        foot:[["","SUMMARY","","",`P:${empStats.present} L:${empStats.late} A:${empStats.absent} Lv:${empStats.leave}`]],
        theme:"grid",
        headStyles:{fillColor:[13,114,137],textColor:[255,255,255],fontStyle:"bold",halign:"center",fontSize:9},
        bodyStyles:{fontSize:9,halign:"center"},
        footStyles:{fillColor:[51,27,63],textColor:[245,240,229],fontStyle:"bold",fontSize:9,halign:"center"},
        alternateRowStyles:{fillColor:[250,246,240]},
        showFoot:"lastPage", margin:{left:30,right:30},
      });
      addPdfFooter(pdf,pw);
      pdf.save(`${(selectedEmp.name||"Intern").replace(/\s+/g,"_")}_Intern_Attendance_${new Date().toISOString().slice(0,7)}.pdf`);
    } catch(e){ console.error(e); alert("PDF failed."); }
    finally { setPersonDl(false); }
  };

  const PersonDetail = () => {
    if (!selectedEmp) return null;
    const empDays  = dailyDetails[selectedEmp.id]||{};
    const empStats = monthlyStats[selectedEmp.id]||{present:0,late:0,absent:0,leave:0};
    const total    = empStats.present+empStats.late+empStats.absent+empStats.leave;
    const rate     = total>0?Math.round(((empStats.present+empStats.late)/total)*100):0;
    const ml       = new Date().toLocaleString("default",{month:"long",year:"numeric"});
    const daysList = Object.entries(empDays).sort(([a],[b])=>a.localeCompare(b)).map(([ds,data])=>({
      dateStr:ds, dayName:new Date(ds).toLocaleDateString("en-US",{weekday:"short"}),
      dateLabel:new Date(ds).toLocaleDateString("en-US",{day:"2-digit",month:"short"}), ...data,
    }));
    return (
      <div style={{animation:"fadeIn 0.3s ease",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <button onClick={()=>setView("monthly")} style={{...styles.btnSecondary,display:"flex",alignItems:"center",gap:8}}>
              <ChevronLeft size={16}/> Back
            </button>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:COLORS.primaryLight,color:COLORS.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:20}}>
                {(selectedEmp.name||"?")[0].toUpperCase()}
              </div>
              <div>
                <h2 style={{margin:0,color:COLORS.textMain,fontSize:20,fontWeight:700}}>{selectedEmp.name}</h2>
                <div style={{color:COLORS.textMuted,fontWeight:500,fontSize:13,marginTop:2}}>{ml} · {selectedEmp.role}</div>
              </div>
            </div>
          </div>
          <button onClick={downloadPersonPDF} disabled={personDl} style={styles.btnPrimary}>
            <Download size={16}/> {personDl?"...":"Export PDF"}
          </button>
        </div>
        <div style={{background:"linear-gradient(135deg,#fff,#fcfcfc)",borderRadius:12,padding:24,marginBottom:24,boxShadow:styles.card.boxShadow,border:`1px solid ${COLORS.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontWeight:700,color:COLORS.textMain,fontSize:15}}>Attendance Rate</span>
            <span style={{fontWeight:900,fontSize:24,color:COLORS.actionTeal}}>{rate}%</span>
          </div>
          <div style={{background:COLORS.bgPage,borderRadius:99,height:10,overflow:"hidden"}}>
            <div style={{width:`${rate}%`,height:"100%",background:`linear-gradient(90deg,${COLORS.actionTeal},${COLORS.primary})`}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:16,marginBottom:24}}>
          {[
            {label:"Present",value:empStats.present,color:COLORS.status.present.text},
            {label:"Late",   value:empStats.late,   color:COLORS.status.late.text},
            {label:"Absent", value:empStats.absent, color:COLORS.status.absent.text},
            {label:"Leave",  value:empStats.leave,  color:COLORS.status.leave.text},
          ].map(c=>(
            <div key={c.label} style={{background:"#fff",padding:20,borderRadius:12,border:`1px solid ${COLORS.border}`,boxShadow:styles.card.boxShadow,textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:900,color:c.color,lineHeight:1.2}}>{c.value}</div>
              <div style={{fontSize:12,fontWeight:600,color:COLORS.textMuted,marginTop:4,textTransform:"uppercase"}}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",borderRadius:12,boxShadow:styles.card.boxShadow,border:`1px solid ${COLORS.border}`,overflow:"hidden"}}>
          <div style={{padding:16,borderBottom:`1px solid ${COLORS.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:COLORS.bgPage}}>
            <h3 style={{margin:0,color:COLORS.textMain,fontSize:15,fontWeight:700}}>History</h3>
            <span style={{fontSize:12,color:COLORS.textMuted,fontWeight:600}}>{daysList.length} days</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
              <thead style={{background:COLORS.bgPage}}>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={{...styles.th,textAlign:"left"}}>Date</th>
                  <th style={styles.th}>Day</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {daysList.map((day,idx)=>(
                  <tr key={day.dateStr} style={{borderBottom:`1px solid ${COLORS.border}`}}>
                    <td style={{...styles.td,textAlign:"center"}}>{idx+1}</td>
                    <td style={{...styles.td,fontWeight:600}}>{day.dateLabel}</td>
                    <td style={{...styles.td,textAlign:"center"}}>{day.dayName}</td>
                    <td style={{...styles.td,textAlign:"center",fontFamily:"monospace"}}>{day.checkIn}</td>
                    <td style={{...styles.td,textAlign:"center"}}><Badge status={day.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{display:"flex",minHeight:"100vh",background:COLORS.bgPage}}>
      {!isMobile && <Sidebar onNavigate={onNavigate}/>}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={styles.spinner}></div>
      </div>
    </div>
  );

  const selectedDateLabel = new Date(selectedDate+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});

  return (
    <div style={styles.root}>
      {!isMobile && (
        <div style={{width:"260px",flexShrink:0,height:"100vh",background:COLORS.primaryDark,color:"white",position:"sticky",top:0}}>
          <Sidebar onNavigate={onNavigate}/>
        </div>
      )}
      <div style={{flex:1,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",padding:isMobile?"16px":"28px 32px"}}>

          {/* Header */}
          <div style={{marginBottom:32}}>
            <h1 style={{fontSize:isMobile?24:28,fontWeight:800,color:COLORS.textMain,margin:"0 0 8px 0",letterSpacing:"-0.02em"}}>
              {greeting.emoji} {greeting.text}, <span style={{color:COLORS.primary}}>Admin</span>
            </h1>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <p style={{fontSize:15,color:COLORS.textMuted,fontWeight:500,margin:0}}>Track intern attendance</p>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",background:"#fff",border:`1px solid ${COLORS.border}`,borderRadius:20,fontSize:12,fontWeight:600,color:COLORS.primary}}>
                <Calendar size={14}/> {currentDate}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{background:"#fff",padding:16,borderRadius:12,marginBottom:24,border:`1px solid ${COLORS.border}`,boxShadow:styles.card.boxShadow,display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:700,color:COLORS.textMain}}>
                {view==="daily"?"Daily Attendance":view==="monthly"?"Monthly Report":`${selectedEmp?.name}`}
              </h2>
              {view==="daily" && (
                <div style={{display:"flex",alignItems:"center",gap:8,background:COLORS.bgPage,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:4}}>
                  <Calendar size={14} color={COLORS.textMuted} style={{marginLeft:8}}/>
                  <input type="date" value={selectedDate} max={todayId} onChange={e=>setSelectedDate(e.target.value)} style={{border:"none",background:"transparent",fontSize:13,fontWeight:600,color:COLORS.textMain,cursor:"pointer",outline:"none"}}/>
                  {!isToday && <button onClick={()=>setSelectedDate(todayId)} style={styles.btnSmall}>Today</button>}
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {view!=="person" && (
                <>
                  <button onClick={async()=>{ if(view==="daily") await goToMonthly(); else setView("daily"); }} style={styles.btnSecondary}>
                    {view==="daily"?"Report":"Daily"}
                  </button>
                  <button onClick={downloadMonthlyPDF} disabled={downloading} style={styles.btnPrimary}>
                    <Download size={16}/> Export
                  </button>
                </>
              )}
              <div style={{padding:"6px 12px",background:COLORS.primaryDark,color:"#fff",borderRadius:8,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                <Clock size={14}/> {currentTime}
              </div>
            </div>
          </div>

          {view==="daily" && !isToday && (
            <div style={{background:"#FEF3C7",border:`1px solid #FCD34D`,borderRadius:8,padding:12,marginBottom:20,display:"flex",alignItems:"center",gap:12,fontSize:13,color:"#92400E",fontWeight:600,flexWrap:"wrap",animation:"fadeIn 0.3s ease"}}>
              <AlertCircle size={20} color="#F59E0B}"/>
              <span>You are editing historical data for <b>{selectedDateLabel}</b>.</span>
            </div>
          )}

          {/* Search */}
          {view==="daily" && (
            <div style={{position:"relative",marginBottom:20,maxWidth:400}}>
              <Search size={18} style={{position:"absolute",left:12,top:13,color:COLORS.textMuted}}/>
              <input type="text" placeholder="Search interns..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{width:"100%",padding:"10px 12px 10px 40px",border:`1px solid ${COLORS.border}`,borderRadius:8,fontSize:14,outline:"none",background:"#fff",color:COLORS.textMain}} onFocus={e=>e.currentTarget.style.borderColor=COLORS.primary} onBlur={e=>e.currentTarget.style.borderColor=COLORS.border}/>
            </div>
          )}

          {/* Table */}
          {view==="person" ? <PersonDetail/> : (
            <div style={styles.card}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:view==="daily"?1000:800}}>
                  <thead style={{background:COLORS.bgPage,position:"sticky",top:0,zIndex:10}}>
                    {view==="daily" ? (
                      <tr>
                        <th style={{...styles.th,textAlign:"left"}}>Intern</th>
                        <th style={styles.th}>Scheduled In</th>
                        <th style={styles.th}>Scheduled Out</th>
                        <th style={styles.th}>Actual In</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>
                          <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                            {[
                              {label:"P",color:COLORS.status.present.text,bg:COLORS.status.present.bg},
                              {label:"L",color:COLORS.status.leave.text,  bg:COLORS.status.leave.bg},
                              {label:"A",color:COLORS.status.absent.text,  bg:COLORS.status.absent.bg},
                            ].map(h=>(
                              <span key={h.label} style={{fontSize:10,fontWeight:800,color:h.color,background:h.bg,padding:"2px 6px",borderRadius:4,letterSpacing:"0.05em"}}>{h.label}</span>
                            ))}
                          </div>
                        </th>
                        <th style={styles.th}>Edit</th>
                      </tr>
                    ) : (
                      <tr>
                        <th style={{...styles.th,textAlign:"left"}}>Intern</th>
                        <th style={{...styles.th,color:COLORS.status.present.text}}>Present</th>
                        <th style={{...styles.th,color:COLORS.status.late.text}}>Late</th>
                        <th style={{...styles.th,color:COLORS.status.absent.text}}>Absent</th>
                        <th style={{...styles.th,color:COLORS.status.leave.text}}>Leave</th>
                        <th style={styles.th}>Total</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {filteredRecords.map(r => view==="daily" ? (
                      <tr key={r.id} style={{borderBottom:`1px solid ${COLORS.border}`,transition:"background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background=COLORS.bgPage} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={styles.td}>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:36,height:36,borderRadius:"50%",background:COLORS.primaryLight,color:COLORS.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14}}>
                              {(r.name||"?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{fontWeight:600,fontSize:14,color:COLORS.textMain}}>{r.name}</div>
                              <div style={{fontSize:12,color:COLORS.textMuted}}>{r.role}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{...styles.td,textAlign:"center"}}><span style={styles.timeBadge}>{r.scheduledIn}</span></td>
                        <td style={{...styles.td,textAlign:"center"}}><span style={{...styles.timeBadge,background:COLORS.status.late.bg,color:COLORS.status.late.text}}>{r.scheduledOut}</span></td>
                        <td style={{...styles.td,textAlign:"center",fontFamily:"monospace",fontWeight:500}}>{r.checkIn||"—"}</td>
                        {/* Status Badge */}
                        <td style={{...styles.td,textAlign:"center"}}>
                          <Badge status={r.status||"Pending"}/>
                        </td>
                        {/* P / L / A checkboxes */}
                        <td style={styles.td}>
                          <MarkCell record={r} onMark={handleAttendance}/>
                        </td>
                        {/* Edit */}
                        <td style={styles.td}>
                          <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                            <button onClick={()=>{ setEditType('checkin'); setEditingIntern(r); }} style={styles.iconBtn}>Edit In</button>
                            <button onClick={()=>{ setEditType('checkout'); setEditingIntern(r); }} style={styles.iconBtn}>Edit Out</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={r.id} style={{borderBottom:`1px solid ${COLORS.border}`}} onMouseEnter={e=>e.currentTarget.style.background=COLORS.bgPage} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={styles.td}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:COLORS.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12}}>{(r.name||"?")[0].toUpperCase()}</div>
                            <span style={{fontWeight:600,fontSize:13}}>{r.name}</span>
                          </div>
                        </td>
                        <td style={{...styles.td,textAlign:"center",fontWeight:700,color:COLORS.status.present.text}}>{monthlyStats[r.id]?.present||0}</td>
                        <td style={{...styles.td,textAlign:"center",fontWeight:700,color:COLORS.status.late.text}}>{monthlyStats[r.id]?.late||0}</td>
                        <td style={{...styles.td,textAlign:"center",fontWeight:700,color:COLORS.status.absent.text}}>{monthlyStats[r.id]?.absent||0}</td>
                        <td style={{...styles.td,textAlign:"center",fontWeight:700,color:COLORS.status.leave.text}}>{monthlyStats[r.id]?.leave||0}</td>
                        <td style={{...styles.td,textAlign:"center",fontWeight:700}}>{(monthlyStats[r.id]?.present||0)+(monthlyStats[r.id]?.late||0)+(monthlyStats[r.id]?.absent||0)+(monthlyStats[r.id]?.leave||0)}</td>
                        <td style={styles.td}><button onClick={()=>openPersonView(r)} style={styles.iconBtnAction}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRecords.length===0 && <div style={{padding:40,textAlign:"center",color:COLORS.textMuted}}>No interns found matching your search.</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingIntern && (
        <TimeEditModal intern={editingIntern} type={editType} onSave={handleTimeSaved} onClose={()=>setEditingIntern(null)}/>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        ::-webkit-scrollbar{width:6px;height:6px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;} ::-webkit-scrollbar-thumb:hover{background:#94a3b8;}
      `}</style>
    </div>
  );
};

const styles = {
  root: { display:"flex", minHeight:"100vh", background:COLORS.bgPage, fontFamily:"'Inter',sans-serif", color:COLORS.textMain },
  card: { background:COLORS.bgCard, borderRadius:12, border:`1px solid ${COLORS.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden" },
  th:   { padding:"12px 16px", fontSize:11, fontWeight:700, color:COLORS.textMuted, textAlign:"center", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:`1px solid ${COLORS.border}` },
  td:   { padding:"14px 16px", fontSize:13, color:COLORS.textMain, borderBottom:`1px solid ${COLORS.border}` },
  timeBadge: { display:"inline-flex", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:700, background:COLORS.status.present.bg, color:COLORS.status.present.text, fontFamily:"monospace" },
  btnPrimary:   { padding:"8px 16px", borderRadius:6, border:"none", background:COLORS.primary, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 },
  btnSecondary: { padding:"8px 16px", borderRadius:6, border:`1px solid ${COLORS.border}`, background:"#fff", color:COLORS.textMain, fontSize:13, fontWeight:600, cursor:"pointer" },
  btnSmall:     { background:COLORS.primary, color:"#fff", border:"none", borderRadius:4, padding:"2px 8px", fontSize:10, fontWeight:700, cursor:"pointer" },
  iconBtn:      { padding:"4px 8px", borderRadius:4, border:`1px solid ${COLORS.border}`, background:"transparent", color:COLORS.textMuted, fontSize:10, fontWeight:700, cursor:"pointer" },
  iconBtnAction:{ padding:"6px 12px", borderRadius:6, border:`1px solid ${COLORS.actionTeal}`, background:"transparent", color:COLORS.actionTeal, fontSize:11, fontWeight:700, cursor:"pointer" },
  spinner:      { width:40, height:40, border:`4px solid ${COLORS.primaryLight}`, borderTop:`4px solid ${COLORS.primary}`, borderRadius:"50%", animation:"spin 1s linear infinite" },
};

export default InternAttendance;