import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import { db } from "../firebase"; 
import { collection, onSnapshot, query, where } from "firebase/firestore";

// ─── Modern Premium Color Palette ───
const theme = {
  primary: "#7C3AED",
  primaryDark: "#1E1B2E",
  primaryLight: "#EDE9FE",
  secondary: "#06B6D4",
  accent: "#F59E0B",
  textDark: "#0F172A",
  textMuted: "#64748B",
  bgPage: "linear-gradient(135deg, #F7F5FF 0%, #F3E8FF 100%)",
  bgCard: "rgba(255, 255, 255, 0.95)",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  teal: "#0D9488",
  border: "rgba(124, 58, 237, 0.15)",
  glow: "0 20px 40px -12px rgba(124, 58, 237, 0.25)",
  cardShadow: "0 10px 30px -8px rgba(0, 0, 0, 0.08)"
};

// ─── Intern Tier System (Animated) ───
const getInternTier = (totalProjects=0) => {
    if (totalProjects >= 21) return {
        label: 'Promoted to Employee',
        emoji: '🚀',
        color: theme.primary,
        bg: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
        badge: theme.primaryLight,
        badgeText: theme.primary,
        next: null,
        progress: 100,
        icon: '🎉'
    };
    if (totalProjects >= 11) return {
        label: 'Stipend Earned',
        emoji: '💰',
        color: theme.teal,
        bg: `linear-gradient(135deg, ${theme.teal}, #0f766e)`,
        badge: '#e0f2f1',
        badgeText: theme.teal,
        next: 21,
        nextLabel: 'Promoted to Employee',
        progress: Math.min(Math.round(((totalProjects - 11) / 10) * 100), 100),
        icon: '💵'
    };
    return {
        label: 'Intern',
        emoji: '🌱',
        color: theme.accent,
        bg: `linear-gradient(135deg, ${theme.accent}, #ea580c)`,
        badge: '#fffbeb',
        badgeText: theme.accent,
        next: 11,
        nextLabel: 'Stipend Earned',
        progress: Math.min(Math.round((totalProjects / 10) * 100), 100),
        icon: '🌿'
    };
};

// ─── Employee Rank System (Premium) ───
const getEmployeeRank = (points=0) => {
    if (points >= 300) return { label: 'Legend', emoji: '👑', icon: '🏆', color: theme.danger, bg: `linear-gradient(135deg, ${theme.danger}, #b91c1c)`, badge: '#fee2e2', badgeText: theme.danger };
    if (points >= 200) return { label: 'Elite', emoji: '💎', icon: '⭐', color: theme.primary, bg: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, badge: theme.primaryLight, badgeText: theme.primary };
    if (points >= 120) return { label: 'Senior', emoji: '⭐', icon: '🔥', color: theme.teal, bg: `linear-gradient(135deg, ${theme.teal}, #0ea5e9)`, badge: '#e0f2fe', badgeText: theme.teal };
    if (points >= 60) return { label: 'Mid-Level', emoji: '🔥', icon: '⚡', color: theme.accent, bg: `linear-gradient(135deg, ${theme.accent}, #d97706)`, badge: '#fef3c7', badgeText: theme.accent };
    return { label: 'Junior', emoji: '🌟', icon: '🌱', color: theme.primaryDark, bg: `linear-gradient(135deg, ${theme.primaryDark}, #4c1d95)`, badge: '#ece6f0', badgeText: theme.primaryDark };
};

// ─── Animated Progress Bar ───
const ProgressBar = ({ percent, color }) => (
    <div style={{ 
        background: 'rgba(0,0,0,0.06)', 
        borderRadius: 99, 
        height: 8, 
        overflow: 'hidden', 
        marginTop: 8,
        position: 'relative'
    }}>
        <div style={{ 
            width: `${Math.min(percent, 100)}%`, 
            height: '100%', 
            borderRadius: 99, 
            background: color,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite'
            }} />
        </div>
        <style>{`
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `}</style>
    </div>
);

// ─── Animated Counter ───
const AnimatedCounter = ({ value, color }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        let start = 0;
        const duration = 1000;
        const increment = value / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        
        return () => clearInterval(timer);
    }, [value]);
    
    return <span style={{ color, fontWeight: 800 }}>{count}</span>;
};

// ─── Premium Podium Card ───
const PodiumCard = ({ data, color, emoji, size, tab }) => {
    if (!data) return null;
    const tier = tab === 'interns' ? getInternTier(data.totalProjects) : getEmployeeRank(data.points);
    return (
        <div style={{
            width: size, 
            background: theme.bgCard,
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            boxShadow: theme.glow,
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            padding: '24px 15px 20px',
            height: size, 
            borderTop: `4px solid ${color}`, 
            position: 'relative',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 30px 50px -15px rgba(124, 58, 237, 0.4)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = theme.glow;
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: `radial-gradient(circle, ${color}20, transparent)`,
                borderRadius: '50%'
            }} />
            
            <div style={{ fontSize: 40, position: 'absolute', top: 20, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>{emoji}</div>
            
            <div style={{
                width: 70, height: 70, borderRadius: '50%', background: tier.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 28, marginBottom: 15,
                boxShadow: `0 8px 20px ${tier.color}66`,
                position: 'relative',
                zIndex: 1,
                transition: 'transform 0.3s ease'
            }}>
                {data.avatar}
                <div style={{
                    position: 'absolute',
                    bottom: -5,
                    right: -5,
                    fontSize: 20
                }}>{tier.icon}</div>
            </div>
            
            <div style={{ fontWeight: 800, fontSize: 15, color: theme.textDark, textAlign: 'center', marginBottom: 8 }}>{data.name}</div>
            
            <div style={{ 
                fontSize: 11, 
                background: tier.badge, 
                color: tier.badgeText, 
                padding: '5px 14px', 
                borderRadius: 20, 
                fontWeight: 800, 
                marginBottom: 8,
                backdropFilter: 'blur(5px)'
            }}>
                {tier.emoji} {tier.label}
            </div>
            
            <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 700 }}>
                {tab === 'interns' ? `${data.totalProjects} Projects` : `${data.points} pts`}
            </div>
        </div>
    );
};

// ─── Glassmorphism Card ───
const GlassCard = ({ children, style }) => (
    <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: theme.cardShadow,
        ...style
    }}>
        {children}
    </div>
);

const Achievements = ({ onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('employees');
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const q = query(collection(db, "projects"), where("status", "==", "completed"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!isMounted) return;

            try {
                const projects = snapshot.docs.map(doc => doc.data());

                const stats = projects.reduce((acc, proj) => {
                    const type = proj.personType === 'employees' || proj.personType === 'employee' ? 'employees' : 'interns';
                    if (type !== activeTab) return acc;

                    const id = proj.personId || proj.personName || "unknown";
                    if (!acc[id]) {
                        acc[id] = {
                            name: proj.personName || "Unknown",
                            projectsDone: 0,
                            totalProjects: 0,
                            onTime: 0,
                            points: 0,
                            lastCompletion: 0,
                            avatar: proj.personName ? proj.personName.charAt(0).toUpperCase() : "?"
                        };
                    }

                    acc[id].totalProjects += 1;
                    const isThisMonth = proj.completedAt && proj.completedAt >= startOfMonth;
                    
                    if (isThisMonth) {
                        acc[id].projectsDone += 1;
                        const compDate = new Date(proj.completedAt);
                        const deadDate = new Date(proj.deadline);
                        
                        if (!isNaN(compDate) && !isNaN(deadDate)) {
                            if (compDate <= deadDate) {
                                acc[id].onTime += 1;
                                acc[id].points += 15;
                            } else {
                                acc[id].points += 5;
                            }
                            if (compDate.getTime() > acc[id].lastCompletion) {
                                acc[id].lastCompletion = compDate.getTime();
                            }
                        }
                    }
                    return acc;
                }, {});

                const sortedArray = Object.values(stats).sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    if (b.onTime !== a.onTime) return b.onTime - a.onTime;
                    return a.lastCompletion - b.lastCompletion;
                });

                setLeaderboard(sortedArray.map((item, index) => ({ ...item, rank: index + 1 })));
                setLoading(false);

            } catch (error) {
                console.error("Data processing error:", error);
                setLoading(false);
            }
        }, (err) => {
            console.error("Firebase error:", err);
            if (isMounted) setLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [activeTab]);
    
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    const podiumOrder = [
        top3[1] ? { data: top3[1], color: '#94a3b8', emoji: '🥈', size: 170 } : null,
        top3[0] ? { data: top3[0], color: theme.accent, emoji: '🥇', size: 210 } : null,
        top3[2] ? { data: top3[2], color: '#cd7f32', emoji: '🥉', size: 155 } : null,
    ].filter(Boolean);

    // Styles
    const pageStyle = {
        display: 'flex',
        background: theme.bgPage,
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden'
    };

    const mainContentStyle = {
        flex: 1,
        padding: 'clamp(20px, 4vw, 40px)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflowX: 'auto',
        position: 'relative',
        zIndex: 1
    };

    const headerStyle = {
        marginBottom: 40,
        textAlign: 'center'
    };

    const titleStyle = {
        margin: 0,
        fontSize: 'clamp(28px, 5vw, 42px)',
        fontWeight: 900,
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary}, ${theme.accent})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'gradient 3s ease infinite',
        backgroundSize: '200% 200%'
    };

    const tabContainerStyle = {
        display: 'flex',
        gap: 15,
        marginBottom: 40,
        justifyContent: 'center',
        flexWrap: 'wrap'
    };

    const tabButtonStyle = (isActive) => ({
        padding: '12px 32px',
        border: 'none',
        borderRadius: 40,
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 15,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isActive ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : 'rgba(255, 255, 255, 0.9)',
        color: isActive ? 'white' : theme.textMuted,
        boxShadow: isActive ? `0 8px 20px ${theme.primary}66` : '0 2px 8px rgba(0,0,0,0.05)',
        border: isActive ? 'none' : '1px solid rgba(124, 58, 237, 0.2)',
        position: 'relative',
        overflow: 'hidden'
    });

    const legendsContainerStyle = {
        display: 'flex',
        gap: 15,
        marginBottom: 50,
        flexWrap: 'wrap',
        justifyContent: 'center'
    };

    const legendCardStyle = (bgColor) => ({
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: `1px solid ${bgColor}40`,
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    });

    const podiumContainerStyle = {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 'clamp(20px, 4vw, 40px)',
        marginBottom: 60,
        flexWrap: 'wrap'
    };

    const tableStyle = {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        border: '1px solid rgba(124, 58, 237, 0.1)'
    };

    const tableHeaderStyle = {
        padding: '20px 28px',
        borderBottom: '2px solid rgba(124, 58, 237, 0.1)',
        fontWeight: 800,
        color: theme.textDark,
        fontSize: 15,
        background: `linear-gradient(135deg, ${theme.primaryLight}, rgba(124, 58, 237, 0.05))`,
        letterSpacing: '0.5px'
    };

    const tableRowStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: '18px 24px',
        borderBottom: '1px solid rgba(124, 58, 237, 0.08)',
        gap: 16,
        transition: 'all 0.3s ease',
        flexWrap: 'wrap',
        cursor: 'pointer'
    };

    return (
        <div style={pageStyle}>
            {/* Animated background bubbles */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 0
            }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: Math.random() * 100 + 50,
                        height: Math.random() * 100 + 50,
                        background: `radial-gradient(circle, ${theme.primary}10, transparent)`,
                        borderRadius: '50%',
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `float ${Math.random() * 20 + 10}s linear infinite`,
                        opacity: 0.3
                    }} />
                ))}
                <style>{`
                    @keyframes float {
                        0% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(180deg); }
                        100% { transform: translateY(0) rotate(360deg); }
                    }
                    @keyframes gradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}</style>
            </div>

            <div style={{ width: 260, flexShrink: 0, position: 'relative', zIndex: 2 }}>
                <Sidebar onNavigate={onNavigate} activeNav="achievements" />
            </div>

            <div style={mainContentStyle}>
                {/* Header with confetti effect */}
                <div style={headerStyle}>
                    <h1 style={titleStyle}>
                        🏆 Monthly Leaderboard
                        <div style={{
                            fontSize: 14,
                            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 20,
                            color: 'white',
                            marginLeft: 12,
                            fontSize: 12
                        }}>LIVE</div>
                    </h1>
                    <p style={{ color: theme.textMuted, marginTop: 12, fontSize: 15 }}>
                        Ranking based on speed, quality & on-time completion
                    </p>
                </div>

                {/* Premium Tabs */}
                <div style={tabContainerStyle}>
                    {['employees', 'interns'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={tabButtonStyle(activeTab === tab)}
                            onMouseEnter={(e) => {
                                if (activeTab !== tab) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.2)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tab) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                }
                            }}
                        >
                            {tab === 'employees' ? '👔 Professional Team' : '🌱 Rising Interns'}
                        </button>
                    ))}
                </div>

                {/* Interactive Legends */}
                <div style={legendsContainerStyle}>
                    {(activeTab === 'interns' ? [
                        { label: 'Intern', emoji: '🌱', range: '1–10 Projects', color: theme.accent, bg: '#fffbeb' },
                        { label: 'Stipend Earned', emoji: '💰', range: '11–20 Projects', color: theme.teal, bg: '#e0f2f1' },
                        { label: 'Promoted', emoji: '🚀', range: '21+ Projects', color: theme.primary, bg: theme.primaryLight },
                    ] : [
                        { label: 'Junior', emoji: '🌟', pts: '0–59 pts', color: theme.primaryDark, bg: '#ece6f0' },
                        { label: 'Mid-Level', emoji: '🔥', pts: '60–119 pts', color: theme.accent, bg: '#fef3c7' },
                        { label: 'Senior', emoji: '⭐', pts: '120–199 pts', color: theme.teal, bg: '#e0f2fe' },
                        { label: 'Elite', emoji: '💎', pts: '200–299 pts', color: theme.primary, bg: theme.primaryLight },
                        { label: 'Legend', emoji: '👑', pts: '300+ pts', color: theme.danger, bg: '#fee2e2' },
                    ]).map(t => (
                        <div 
                            key={t.label} 
                            style={legendCardStyle(t.color)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                            }}
                        >
                            <span style={{ fontSize: 24 }}>{t.emoji}</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: t.color }}>{t.label}</div>
                                <div style={{ fontSize: 11, color: theme.textMuted }}>{t.pts || t.range}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ 
                            width: 60, height: 60, 
                            background: `conic-gradient(from 0deg, ${theme.primary}, ${theme.secondary}, ${theme.primary})`,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }} />
                        <p style={{ color: theme.textMuted, fontWeight: 500 }}>Loading achievements...</p>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <GlassCard style={{ padding: 80, textAlign: 'center' }}>
                        <span style={{ fontSize: 64, display: 'block', marginBottom: 20 }}>🎯</span>
                        <h3 style={{ color: theme.textDark, marginBottom: 10 }}>No Data Yet</h3>
                        <p style={{ color: theme.textMuted }}>Complete projects to see your ranking here!</p>
                    </GlassCard>
                ) : (
                    <>
                        {/* Premium Podium */}
                        <div style={podiumContainerStyle}>
                            {podiumOrder.map(({ data, color, emoji, size }) => (
                                <PodiumCard key={data.name} data={data} color={color} emoji={emoji} size={size} tab={activeTab} />
                            ))}
                        </div>

                        {/* Detailed Rankings Table */}
                        {rest.length > 0 && (
                            <div style={tableStyle}>
                                <div style={tableHeaderStyle}>
                                    <span style={{ fontSize: 18, marginRight: 8 }}>📊</span> 
                                    Complete Rankings & Analytics
                                </div>
                                {rest.map((user) => {
                                    if (!user) return null;
                                    const tier = activeTab === 'interns' ? getInternTier(user.totalProjects) : getEmployeeRank(user.points);
                                    
                                    return (
                                        <div 
                                            key={user.name} 
                                            style={tableRowStyle}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.03)';
                                                e.currentTarget.style.transform = 'scale(1.01)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <div style={{ 
                                                width: 45, 
                                                fontWeight: 800, 
                                                color: user.rank <= 10 ? theme.primary : theme.textMuted,
                                                fontSize: user.rank <= 10 ? 18 : 15
                                            }}>
                                                {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : `#${user.rank}`}
                                            </div>
                                            
                                            <div style={{
                                                width: 50, height: 50, borderRadius: '50%', background: tier.bg,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 900, fontSize: 20,
                                                flexShrink: 0,
                                                boxShadow: `0 4px 10px ${tier.color}66`
                                            }}>
                                                {user.avatar}
                                            </div>

                                            <div style={{ flex: 1, minWidth: '160px' }}>
                                                <div style={{ fontWeight: 700, color: theme.textDark, fontSize: 15, marginBottom: 6 }}>
                                                    {user.name}
                                                </div>
                                                <div style={{
                                                    fontSize: 11,
                                                    background: tier.badge,
                                                    color: tier.badgeText,
                                                    padding: '4px 12px',
                                                    borderRadius: 20,
                                                    fontWeight: 700,
                                                    display: 'inline-block'
                                                }}>
                                                    {tier.emoji} {tier.label}
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'center', minWidth: 70 }}>
                                                <div style={{ fontWeight: 800, fontSize: 20, color: theme.primary }}>
                                                    <AnimatedCounter value={user.projectsDone} color={theme.primary} />
                                                </div>
                                                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>This Month</div>
                                            </div>

                                            <div style={{ textAlign: 'center', minWidth: 70 }}>
                                                <div style={{ fontWeight: 800, fontSize: 20, color: theme.success }}>
                                                    <AnimatedCounter value={user.onTime} color={theme.success} />
                                                </div>
                                                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>On-Time</div>
                                            </div>

                                            <div style={{
                                                background: `linear-gradient(135deg, ${theme.primaryLight}, rgba(124, 58, 237, 0.1))`,
                                                padding: '8px 18px',
                                                borderRadius: 30,
                                                fontWeight: 800,
                                                fontSize: 16,
                                                color: theme.primary,
                                                minWidth: 90,
                                                textAlign: 'center'
                                            }}>
                                                {user.points} pts
                                            </div>

                                            {activeTab === 'interns' && tier.next && (
                                                <div style={{ minWidth: 140 }}>
                                                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6, fontWeight: 500 }}>
                                                        🎯 {user.totalProjects}/{tier.next} → {tier.nextLabel}
                                                    </div>
                                                    <ProgressBar percent={tier.progress} color={tier.color} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Promotion Celebration Banner */}
                        {activeTab === 'interns' && leaderboard.some(u => u.totalProjects >= 21) && (
                            <GlassCard style={{
                                marginTop: 40,
                                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                                color: 'white',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: -50,
                                    right: -50,
                                    width: 200,
                                    height: 200,
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent)',
                                    borderRadius: '50%'
                                }} />
                                <div style={{ padding: '28px 32px', position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        🚀 <span>Promotion Celebration!</span> 🎉
                                    </div>
                                    <p style={{ opacity: 0.95, marginBottom: 20, fontSize: 14 }}>
                                        These outstanding interns have completed 21+ projects and earned their promotion to full-time employees:
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        {leaderboard.filter(u => u.totalProjects >= 21).map(u => (
                                            <div key={u.name} style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                borderRadius: 12,
                                                padding: '10px 18px',
                                                fontWeight: 700,
                                                fontSize: 14,
                                                backdropFilter: 'blur(10px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8
                                            }}>
                                                <span style={{ fontSize: 20 }}>🏆</span>
                                                {u.avatar} {u.name}
                                                <span style={{ fontSize: 12, opacity: 0.9 }}>({u.totalProjects} projects)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </GlassCard>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Achievements;