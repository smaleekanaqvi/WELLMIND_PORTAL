import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageWrapper from '../PageWrapper';
import { 
  GraduationCap, Sparkles, TrendingUp, Users, Building2, Calendar, Clock, Award, 
  Mail, Phone, MapPin, Briefcase, Star, Zap, Heart, Search, Check, AlertCircle, 
  Trash2, Edit2, UserPlus, Info, Coffee, Trophy
} from 'lucide-react';
import { db } from "../firebase"; 
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

// ============================================================
// Professional Light Purple Color Palette (based on :root)
// ============================================================
const COLORS = {
  primary: "#7C3AED",        // vibrant purple
  primaryDark: "#1E1B2E",    // deep purple-black
  primaryLight: "#EDE9FE",   // soft lavender
  textDark: "#1A1530",       // dark purple-gray
  textMuted: "#64748B",      // muted slate
  bgPage: "#F7F5FF",         // very light lavender background
  bgCard: "#FFFFFF",         // white
  success: "#059669",        // emerald
  warning: "#D97706",        // amber
  danger: "#DC2626",         // red
  teal: "#0891B2",           // teal accent
  border: "rgba(124, 58, 237, 0.1)",
};

const RANKS = ['Junior', 'Mid-Level', 'Senior', 'Elite', 'Legend'];
const EMP_TYPES = ['Full Time', 'Part Time', 'Contractor', 'Freelance'];
const AVATAR_COLORS = [COLORS.primary, COLORS.teal, COLORS.danger, '#47234F', COLORS.warning, COLORS.primaryDark];

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'IN';
const generateId = () => 'int_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pickColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅', color: COLORS.warning };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', color: COLORS.teal };
  if (hour < 20) return { text: 'Good Evening', emoji: '🌆', color: COLORS.primary };
  return { text: 'Good Night', emoji: '🌙', color: COLORS.primaryDark };
};

const formatDate = () => {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const getPerformanceColor = (val) => {
  if (val >= 90) return COLORS.teal;
  if (val >= 75) return COLORS.warning;
  if (val >= 60) return COLORS.primary;
  return COLORS.danger;
};

const getPerformanceLabel = (val) => {
  if (val >= 90) return 'Outstanding';
  if (val >= 75) return 'Excellent';
  if (val >= 60) return 'Good';
  if (val >= 40) return 'Average';
  return 'Needs Improvement';
};

const getPerformanceIcon = (val) => {
  if (val >= 90) return <Sparkles size={14} />;
  if (val >= 75) return <Trophy size={14} />;
  if (val >= 60) return <Star size={14} />;
  if (val >= 40) return <Zap size={14} />;
  return <Heart size={14} />;
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'Active':   return { bg: '#dcfce7', color: COLORS.success, dot: COLORS.success, glow: 'rgba(5,150,105,0.2)', icon: '✅' };
    case 'On Leave': return { bg: '#fef3c7', color: COLORS.warning, dot: COLORS.warning, glow: 'rgba(217,119,6,0.2)', icon: '🌴' };
    case 'Inactive': return { bg: '#fee2e2', color: COLORS.danger, dot: COLORS.danger, glow: 'rgba(220,38,38,0.2)', icon: '⭕' };
    default:         return { bg: COLORS.primaryLight, color: COLORS.primary, dot: COLORS.primary, glow: 'rgba(124,58,237,0.2)', icon: '🟡' };
  }
};

const DEPT_COLORS = {
  Engineering: { bg: '#E0F2FE', color: COLORS.teal, icon: '⚙️' },
  Design:      { bg: COLORS.primaryLight, color: COLORS.primary, icon: '🎨' },
  Marketing:   { bg: '#FEF3C7', color: COLORS.warning, icon: '📢' },
  QA:          { bg: '#D1FAE5', color: COLORS.success, icon: '🔍' },
  DevOps:      { bg: '#FFE4E6', color: COLORS.danger, icon: '🚀' },
  HR:          { bg: '#F3E8FF', color: '#6B21A5', icon: '🤝' },
  Finance:     { bg: '#FFE4E6', color: '#9F1239', icon: '💰' },
};

// ─── CSS Styles with Light Purple Theme ──────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700;800;900&display=swap');

.tm-premium-container {
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.tm-premium-bg {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 100% 0%, rgba(124,58,237,0.03) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.tm-welcome-section {
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
  animation: fadeIn 0.5s ease;
}
.tm-welcome-title {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
  color: ${COLORS.textDark};
}
.tm-welcome-subtitle {
  font-size: 15px;
  color: ${COLORS.textMuted};
  margin: 0 0 12px 0;
  font-weight: 500;
}
.tm-date-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: ${COLORS.bgCard};
  border: 1px solid ${COLORS.border};
  border-radius: 40px;
  font-size: 13px;
  font-weight: 600;
  color: ${COLORS.primary};
  margin-top: 12px;
}

.tm-dept-stats { display: flex; gap: 14px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-dept-chip { display: inline-flex; align-items: center; gap: 12px; padding: 10px 22px; background: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; border-radius: 60px; font-size: 13px; font-weight: 600; color: ${COLORS.textMuted}; transition: all 0.3s cubic-bezier(0.2,0.9,0.4,1.1); cursor: pointer; }
.tm-dept-chip:hover { border-color: ${COLORS.primary}; transform: translateY(-3px) scale(1.02); box-shadow: 0 10px 20px rgba(124,58,237,0.12); background: #fff; }
.tm-dept-chip .tm-dept-icon { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.tm-dept-chip .tm-dept-name { font-weight: 800; color: ${COLORS.textDark}; }
.tm-dept-chip .tm-dept-count { font-weight: 900; color: ${COLORS.primary}; background: ${COLORS.primaryLight}; padding: 3px 10px; border-radius: 30px; margin-left: 8px; font-size: 12px; }

.tm-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.tm-stat-card {
  background: ${COLORS.bgCard};
  border-radius: 20px;
  padding: 20px;
  border: 1px solid ${COLORS.border};
  transition: all 0.3s ease;
  cursor: pointer;
}
.tm-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(124,58,237,0.1);
  border-color: ${COLORS.primaryLight};
}
.tm-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.tm-stat-value {
  font-size: 32px;
  font-weight: 900;
  color: ${COLORS.textDark};
  line-height: 1.2;
}
.tm-stat-label {
  font-size: 13px;
  font-weight: 600;
  color: ${COLORS.textMuted};
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tm-filter-bar { display: flex; align-items: center; gap: 18px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-search-box { flex: 1; max-width: 400px; position: relative; }
.tm-search-box input { width: 100%; padding: 13px 18px 13px 48px; font-size: 14px; color: ${COLORS.textDark}; background: ${COLORS.bgCard}; border: 1.5px solid ${COLORS.border}; border-radius: 60px; outline: none; transition: all 0.3s ease; font-family: inherit; }
.tm-search-box input:focus { border-color: ${COLORS.primary}; box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }
.tm-search-box input::placeholder { color: ${COLORS.textMuted}; }
.tm-search-box svg { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: ${COLORS.primary}; opacity: 0.6; }
.tm-filter-tabs { display: flex; gap: 8px; background: ${COLORS.bgPage}; border-radius: 60px; padding: 5px; border: 1px solid ${COLORS.border}; }
.tm-filter-tab { padding: 9px 22px; font-size: 13px; font-weight: 700; color: ${COLORS.textMuted}; background: none; border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; white-space: nowrap; }
.tm-filter-tab:hover { color: ${COLORS.textDark}; background: rgba(124,58,237,0.08); transform: translateY(-1px); }
.tm-filter-tab.active { color: #fff; background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.teal}); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }

.tm-cards-grid { 
  display: grid; 
  grid-template-columns: repeat(2, 1fr); 
  gap: 28px; 
  position: relative;
  z-index: 1;
}
@media (max-width: 768px) {
  .tm-stats-grid { grid-template-columns: repeat(2,1fr); gap: 12px; }
  .tm-filter-bar { flex-direction: column; align-items: stretch; }
  .tm-search-box { max-width: 100%; }
  .tm-filter-tabs { overflow-x: auto; }
  .tm-cards-grid { grid-template-columns: 1fr; gap: 20px; }
}

.tm-emp-card { 
  background: ${COLORS.bgCard}; 
  border-radius: 28px; 
  overflow: hidden; 
  transition: all 0.4s cubic-bezier(0.2,0.9,0.4,1.1); 
  position: relative; 
  border: 1px solid ${COLORS.border}; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.02); 
  animation: cardFadeIn 0.5s ease backwards; 
}
@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.tm-emp-card:hover { 
  box-shadow: 0 25px 45px -12px rgba(124,58,237,0.2); 
  transform: translateY(-6px); 
  border-color: ${COLORS.primaryLight}; 
}
.tm-emp-card.tm-on-leave { background: #FEFAF5; }
.tm-leave-stripe { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: repeating-linear-gradient(90deg, ${COLORS.warning} 0px, ${COLORS.warning} 10px, #FDE68A 10px, #FDE68A 20px); opacity: 0; transition: opacity 0.4s ease; }
.tm-emp-card.tm-on-leave .tm-leave-stripe { opacity: 1; }

.tm-card-top { padding: 24px 24px 0; display: flex; align-items: flex-start; justify-content: space-between; }
.tm-card-emp-info { display: flex; align-items: center; gap: 18px; }
.tm-card-avatar { width: 64px; height: 64px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #fff; flex-shrink: 0; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.tm-emp-card:hover .tm-card-avatar { transform: scale(1.03); }
.tm-card-name { font-size: 18px; font-weight: 800; color: ${COLORS.textDark}; letter-spacing: -0.3px; }
.tm-card-role { font-size: 12px; color: ${COLORS.primary}; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.tm-status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: 60px; font-size: 11px; font-weight: 800; white-space: nowrap; }
.tm-status-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.2); } }

.tm-card-body { padding: 20px 24px; }
.tm-card-contact { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.tm-contact-row { display: flex; align-items: center; gap: 12px; font-size: 13px; color: ${COLORS.textDark}; padding: 6px 0; transition: transform 0.2s ease; }
.tm-contact-row:hover { transform: translateX(4px); }
.tm-contact-row svg { color: ${COLORS.textMuted}; flex-shrink: 0; }
.tm-contact-row:hover svg { color: ${COLORS.primary}; }

.tm-card-divider { height: 1px; background: linear-gradient(90deg, transparent, ${COLORS.border}, ${COLORS.border}, transparent); margin: 0 24px; }

.tm-card-stats { display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; padding: 20px 24px; }
.tm-stat-item { display: flex; flex-direction: column; gap: 10px; }
.tm-stat-label { font-size: 11px; font-weight: 800; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px; }
.tm-stat-value { font-size: 26px; font-weight: 900; color: ${COLORS.textDark}; line-height: 1; }
.tm-perf-bar-track { height: 8px; background: ${COLORS.primaryLight}; border-radius: 10px; overflow: hidden; }
.tm-perf-bar-fill { height: 100%; border-radius: 10px; transition: width 0.8s ease; position: relative; overflow: hidden; }
.tm-perf-bar-fill::after { content: ''; position: absolute; top:0; left:0; right:0; bottom:0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite; }
@keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
.tm-perf-label { font-size: 11px; font-weight: 700; margin-top: 6px; display: flex; align-items: center; gap: 4px; }

.tm-skills-wrap { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 24px 20px; }
.tm-skill-tag { padding: 5px 12px; background: ${COLORS.primaryLight}; border-radius: 30px; font-size: 11px; font-weight: 700; color: ${COLORS.textDark}; border: 1px solid ${COLORS.border}; transition: all 0.25s ease; cursor: default; }
.tm-skill-tag:hover { background: ${COLORS.primary}; color: #fff; transform: translateY(-2px); border-color: transparent; }

.tm-card-leave-section { padding: 14px 24px; border-top: 1px solid ${COLORS.border}; display: flex; align-items: center; justify-content: space-between; background: ${COLORS.bgPage}; }
.tm-leave-toggle-wrap { display: flex; align-items: center; gap: 14px; }
.tm-leave-toggle-label { font-size: 13px; font-weight: 800; color: ${COLORS.textMuted}; display: flex; align-items: center; gap: 8px; }
.tm-leave-toggle-label.tm-active { color: ${COLORS.warning}; }
.tm-leave-toggle { position: relative; width: 52px; height: 26px; cursor: pointer; }
.tm-leave-toggle input { opacity:0; width:0; height:0; position:absolute; }
.tm-leave-track { position: absolute; inset: 0; background: #d8c8dc; border-radius: 26px; transition: all 0.3s ease; }
.tm-leave-toggle input:checked + .tm-leave-track { background: ${COLORS.warning}; box-shadow: 0 0 8px rgba(217,119,6,0.5); }
.tm-leave-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.3s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.tm-leave-toggle input:checked ~ .tm-leave-thumb { transform: translateX(26px); }
.tm-leave-duration { font-size: 12px; font-weight: 800; color: ${COLORS.warning}; background: #fef3c7; border-radius: 40px; padding: 4px 12px; display: flex; align-items: center; gap: 6px; }

.tm-card-actions { display: flex; gap: 12px; padding: 16px 24px; border-top: 1px solid ${COLORS.border}; background: ${COLORS.bgCard}; }
.tm-card-action-btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; font-size: 12px; font-weight: 800; color: ${COLORS.textDark}; background: ${COLORS.bgPage}; border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.tm-card-action-btn:hover { transform: translateY(-2px); }
.tm-card-action-btn.tm-action-edit:hover { background: ${COLORS.primaryLight}; color: ${COLORS.primary}; }
.tm-card-action-btn.tm-action-delete:hover { background: #fee2e2; color: ${COLORS.danger}; }

.tm-checkin-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: ${COLORS.primaryLight}; border-radius: 30px; font-size: 10px; font-weight: 800; color: ${COLORS.primary}; margin-top: 8px; width: fit-content; }

.tm-no-results { text-align: center; padding: 60px 20px; background: ${COLORS.bgCard}; border-radius: 32px; border: 2px dashed ${COLORS.border}; }
.tm-no-results svg { color: ${COLORS.textMuted}; margin-bottom: 16px; opacity:0.5; }
.tm-no-results h3 { font-size: 18px; font-weight: 800; color: ${COLORS.primary}; margin-bottom: 8px; }
.tm-no-results p { font-size: 14px; color: ${COLORS.textMuted}; }

/* Modal Styles */
.tm-modal-overlay { position: fixed; inset: 0; z-index: 900; background: rgba(30,27,46,0.7); backdrop-filter: blur(8px); display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; animation: fadeIn 0.3s ease; }
.tm-modal-box { background: ${COLORS.bgPage}; border-radius: 32px; width: 720px; max-width: 100%; box-shadow: 0 40px 80px rgba(0,0,0,0.2); animation: modalIn 0.4s ease-out; border: 1px solid ${COLORS.border}; overflow: hidden; }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
.tm-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 28px 32px 0; }
.tm-modal-title { font-size: 24px; font-weight: 900; color: ${COLORS.textDark}; }
.tm-modal-subtitle { font-size: 14px; color: ${COLORS.textMuted}; margin-top: 6px; }
.tm-modal-close { background: rgba(124,58,237,0.1); border: none; width: 40px; height: 40px; border-radius: 60px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${COLORS.primary}; transition: all 0.3s ease; }
.tm-modal-close:hover { background: rgba(124,58,237,0.2); transform: rotate(90deg); }
.tm-modal-body { padding: 24px 32px; }
.tm-form-section-title { font-size: 16px; font-weight: 800; color: ${COLORS.textDark}; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.tm-form-section-title::after { content: ''; flex:1; height: 2px; background: linear-gradient(90deg, ${COLORS.primary}, ${COLORS.teal}); border-radius: 2px; }
.tm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.tm-form-group { display: flex; flex-direction: column; }
.tm-form-label { font-size: 13px; font-weight: 700; color: ${COLORS.textDark}; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
.tm-form-label .tm-required { color: ${COLORS.danger}; }
.tm-form-input, .tm-form-select { width: 100%; padding: 12px 16px; font-size: 14px; color: ${COLORS.textDark}; background: #fff; border: 1.5px solid ${COLORS.border}; border-radius: 14px; outline: none; transition: all 0.2s ease; font-family: inherit; }
.tm-form-input:focus, .tm-form-select:focus { border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.tm-form-input.tm-error { border-color: ${COLORS.danger}; background: #FFF5F5; }
.tm-form-error { font-size: 11px; color: ${COLORS.danger}; margin-top: 6px; font-weight: 600; }

.tm-pic-upload-wrap { grid-column: 1 / -1; }
.tm-pic-preview { width: 80px; height: 80px; border-radius: 20px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #fff; border: 2px dashed ${COLORS.border}; cursor: pointer; transition: all 0.2s ease; }
.tm-pic-preview:hover { border-color: ${COLORS.primary}; transform: scale(1.02); }

.tm-info-box { margin: 20px 32px 0; padding: 16px 24px; background: ${COLORS.primaryLight}; border-radius: 20px; border: 1px solid ${COLORS.border}; }
.tm-info-box-title { font-size: 14px; font-weight: 800; color: ${COLORS.primary}; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.tm-info-box ul { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: ${COLORS.textMuted}; }

.tm-modal-footer { padding: 0 32px 28px; display: flex; gap: 16px; justify-content: flex-end; }
.tm-btn-cancel { padding: 10px 24px; font-size: 14px; font-weight: 700; color: ${COLORS.textDark}; background: #fff; border: 1px solid ${COLORS.border}; border-radius: 60px; cursor: pointer; transition: all 0.2s ease; }
.tm-btn-cancel:hover { background: ${COLORS.primaryLight}; transform: translateY(-1px); }
.tm-btn-submit { padding: 10px 28px; font-size: 14px; font-weight: 800; color: #fff; background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.teal}); border: none; border-radius: 60px; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.tm-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(124,58,237,0.4); }

.tm-toast { position: fixed; top: 24px; right: 24px; z-index: 1000; padding: 14px 24px; border-radius: 60px; font-size: 14px; font-weight: 700; background: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; animation: toastIn 0.4s ease; }
.tm-toast.success { border-left: 4px solid ${COLORS.success}; }
.tm-toast.error { border-left: 4px solid ${COLORS.danger}; }
.tm-toast.warning { border-left: 4px solid ${COLORS.warning}; }
@keyframes toastIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }

.tm-delete-overlay, .tm-leave-confirm-overlay { position: fixed; inset: 0; z-index: 950; background: rgba(30,27,46,0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
.tm-delete-box, .tm-leave-confirm-box { background: ${COLORS.bgCard}; border-radius: 28px; width: 400px; max-width: 90vw; padding: 32px; box-shadow: 0 30px 50px rgba(0,0,0,0.2); text-align: center; border: 1px solid ${COLORS.border}; }
.tm-delete-icon, .tm-leave-confirm-icon { width: 60px; height: 60px; border-radius: 60px; background: ${COLORS.primaryLight}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
.tm-delete-title, .tm-leave-confirm-title { font-size: 20px; font-weight: 800; color: ${COLORS.textDark}; margin-bottom: 8px; }
.tm-delete-text, .tm-leave-confirm-text { font-size: 14px; color: ${COLORS.textMuted}; margin-bottom: 24px; }
.tm-delete-actions, .tm-leave-confirm-actions { display: flex; gap: 12px; }
.tm-delete-actions button, .tm-leave-confirm-actions button { flex:1; padding: 10px; font-size: 14px; font-weight: 700; border-radius: 60px; cursor: pointer; border: none; }
.tm-delete-cancel { background: ${COLORS.bgPage}; color: ${COLORS.textDark}; border: 1px solid ${COLORS.border}; }
.tm-delete-confirm { background: ${COLORS.danger}; color: #fff; }
.tm-leave-confirm-approve { background: ${COLORS.warning}; color: #fff; }
.tm-leave-days-group { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; justify-content: center; }
.tm-leave-days-input { width: 80px; padding: 10px; font-size: 16px; font-weight: 800; text-align: center; color: ${COLORS.warning}; background: #fef3c7; border: 1px solid rgba(217,119,6,0.4); border-radius: 12px; outline: none; }

.tm-skeleton { background: linear-gradient(90deg, #E8DEE8 25%, #D8C8DC 50%, #E8DEE8 75%); background-size: 200% 100%; border-radius: 16px; animation: skeleton 1.5s ease-in-out infinite; }
@keyframes skeleton { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
`;

if (typeof document !== 'undefined' && !document.getElementById('int-styles-premium')) {
  const tag = document.createElement('style');
  tag.id = 'int-styles-premium';
  tag.textContent = styles;
  document.head.appendChild(tag);
}

const Interns = ({ onNavigate }) => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [leaveModal, setLeaveModal] = useState(null);
  const [leaveDays, setLeaveDays] = useState(1);
  const [toast, setToast] = useState(null);
  
  const [form, setForm] = useState({
    name: '', email: '', phone: '', type: 'Intern', role: '', rank: '',
    department: '', location: '', checkInTime: '09:00', checkOutTime: '17:30',
    education: '', institute: '', profilePic: null
  });
  const [editForm, setEditForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const greeting = getGreeting();
  const currentDate = formatDate();

  const fetchInterns = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "interns"));
      const list = querySnapshot.docs.map(d => ({
        ...d.data(),
        id: d.id,
        status: d.data().status || 'Active',
        leaveDays: d.data().leaveDays || null,
        projects: d.data().projects || [],
        performance: d.data().performance || Math.floor(Math.random() * 40) + 60,
        skills: d.data().skills || ['React', 'Node.js', 'Python'].slice(0, Math.floor(Math.random() * 3) + 1)
      }));
      setTeam(list);
    } catch (error) {
      console.error("Error fetching interns:", error);
      showToast('Failed to load interns', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInterns(); }, [fetchInterns]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const deptStats = useMemo(() => {
    const counts = {};
    team.forEach(m => { if (m.department) counts[m.department] = (counts[m.department] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => ({ dept, count }));
  }, [team]);

  const allDepts = useMemo(() => {
    const set = new Set(team.map(m => m.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [team]);

  const statusTabs = useMemo(() => {
    const counts = { All: team.length, Active: 0, 'On Leave': 0 };
    team.forEach(m => {
      if (m.status === 'Active') counts.Active++;
      else if (m.status === 'On Leave') counts['On Leave']++;
    });
    return counts;
  }, [team]);

  const filteredTeam = useMemo(() => {
    return team.filter(m => {
      const matchSearch = !search ||
        (m.name && m.name.toLowerCase().includes(search.toLowerCase())) ||
        (m.role && m.role.toLowerCase().includes(search.toLowerCase())) ||
        (m.email && m.email.toLowerCase().includes(search.toLowerCase()));
      const matchDept = filterDept === 'All' || m.department === filterDept;
      const matchStatus = filterStatus === 'All' || m.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [team, search, filterDept, filterStatus]);

  const handleLeaveToggle = async (member) => {
    if (member.status === 'On Leave') {
      try {
        await updateDoc(doc(db, "interns", member.id), { status: 'Active', leaveDays: null });
        setTeam(prev => prev.map(m => m.id === member.id ? { ...m, status: 'Active', leaveDays: null } : m));
        showToast(`${member.name} is back — marked as Active`, 'success');
      } catch (e) { showToast('Failed to update status', 'error'); }
    } else { setLeaveModal(member); setLeaveDays(1); }
  };

  const confirmLeave = async () => {
    if (!leaveModal) return;
    const days = Math.max(1, parseInt(leaveDays) || 1);
    try {
      await updateDoc(doc(db, "interns", leaveModal.id), { status: 'On Leave', leaveDays: days });
      setTeam(prev => prev.map(m => m.id === leaveModal.id ? { ...m, status: 'On Leave', leaveDays: days } : m));
      showToast(`${leaveModal.name} marked on leave for ${days} day${days > 1 ? 's' : ''}`, 'warning');
      setLeaveModal(null);
    } catch (e) { showToast('Failed to approve leave', 'error'); }
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) setEditErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = (f, setErr) => {
    const e = {};
    if (!f.name?.trim()) e.name = 'Full name is required';
    if (!f.email?.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = 'Invalid email format';
    if (!f.role) e.role = 'Role is required';
    if (!f.rank) e.rank = 'Rank is required';
    if (!f.department) e.department = 'Department is required';
    if (!f.checkInTime) e.checkInTime = 'Check-in time is required';
    if (!f.checkOutTime) e.checkOutTime = 'Check-out time is required';
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setForm({
      name: '', email: '', phone: '', type: 'Intern', role: '', rank: '',
      department: '', location: '', checkInTime: '09:00', checkOutTime: '17:30',
      education: '', institute: '', profilePic: null
    });
    setErrors({});
  };

  const openEditModal = (member) => {
    setEditForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      type: member.type || 'Intern',
      role: member.role || '',
      rank: member.rank || '',
      department: member.department || '',
      location: member.location || '',
      checkInTime: member.checkInTime || '09:00',
      checkOutTime: member.checkOutTime || '17:30',
      education: member.education || '',
      institute: member.institute || '',
      profilePic: member.profilePic || null,
      avatarColor: member.avatarColor || pickColor(),
    });
    setEditErrors({});
    setEditModal(member);
  };

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 700 * 1024) { showToast('Image too large (Max 700KB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => updateForm('profilePic', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleEditPicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 700 * 1024) { showToast('Image too large (Max 700KB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => updateEditForm('profilePic', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!validate(form, setErrors)) return;
    setSubmitting(true);
    const newId = generateId();
    const memberData = {
      id: newId,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone ? form.phone.trim() : '',
      type: form.type,
      role: form.role,
      education: form.education || '',
      institute: form.institute || '',
      rank: form.rank,
      department: form.department,
      location: form.location || 'Remote',
      status: 'Active',
      avatar: form.profilePic ? null : getInitials(form.name),
      avatarColor: pickColor(),
      profilePic: form.profilePic || null,
      projects: [],
      performance: Math.floor(Math.random() * 40) + 60,
      skills: [],
      checkInTime: form.checkInTime || '09:00',
      checkOutTime: form.checkOutTime || '17:30',
      leaveDays: null,
      createdAt: new Date()
    };
    try {
      await setDoc(doc(db, "interns", newId), memberData);
      setTeam(prev => [...prev, memberData]);
      showToast(`${memberData.name} added to team`, 'success');
      resetForm();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast('Failed to add intern', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validate(editForm, setEditErrors)) return;
    setEditSubmitting(true);
    const updatedData = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone ? editForm.phone.trim() : '',
      type: editForm.type,
      role: editForm.role,
      education: editForm.education || '',
      institute: editForm.institute || '',
      rank: editForm.rank,
      department: editForm.department,
      location: editForm.location || 'Remote',
      avatar: editForm.profilePic ? null : getInitials(editForm.name),
      avatarColor: editForm.avatarColor,
      profilePic: editForm.profilePic || null,
      checkInTime: editForm.checkInTime,
      checkOutTime: editForm.checkOutTime,
    };
    try {
      await updateDoc(doc(db, "interns", editModal.id), updatedData);
      setTeam(prev => prev.map(m => m.id === editModal.id ? { ...m, ...updatedData } : m));
      showToast(`${updatedData.name} updated successfully`, 'success');
      setEditModal(null);
    } catch (error) {
      console.error(error);
      showToast('Failed to update intern', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const member = team.find(m => m.id === id);
    try {
      await deleteDoc(doc(db, "interns", id));
      setTeam(prev => prev.filter(m => m.id !== id));
      showToast(`${member?.name || 'Intern'} removed`, 'error');
      setDeleteModal(null);
    } catch (error) {
      console.error(error);
      showToast('Failed to remove intern', 'error');
    }
  };

  const renderFormFields = (f, upd, errs, picInputId, onPicUpload) => (
    <div className="tm-form-grid">
      <div className="tm-pic-upload-wrap">
        <label className="tm-form-label">Profile Picture</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div
            className="tm-pic-preview"
            style={{ backgroundColor: (f.profilePic && f.profilePic !== 'null') ? 'transparent' : COLORS.primary }}
            onClick={() => document.getElementById(picInputId).click()}
          >
            {(f.profilePic && f.profilePic !== 'null')
              ? <img src={f.profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(f.name || 'IN')
            }
          </div>
          <div>
            <input id={picInputId} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPicUpload} />
            <button type="button" className="tm-btn-cancel" style={{ fontSize: 12, padding: '8px 18px' }}
              onClick={() => document.getElementById(picInputId).click()}>
              📁 Upload Photo
            </button>
            {(f.profilePic && f.profilePic !== 'null') && (
              <button type="button" className="tm-card-action-btn tm-action-delete"
                style={{ fontSize: 12, padding: '8px 16px', marginLeft: 10 }}
                onClick={() => upd('profilePic', null)}>
                Remove
              </button>
            )}
            <p style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>JPG, PNG, WEBP — max 700KB</p>
          </div>
        </div>
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Full Name <span className="tm-required">*</span></label>
        <input className={`tm-form-input${errs.name ? ' tm-error' : ''}`} type="text" placeholder="e.g. Sarah Ahmed"
          value={f.name || ''} onChange={e => upd('name', e.target.value)} />
        {errs.name && <span className="tm-form-error">{errs.name}</span>}
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Email Address <span className="tm-required">*</span></label>
        <input className={`tm-form-input${errs.email ? ' tm-error' : ''}`} type="email" placeholder="e.g. sarah@wellmind.com"
          value={f.email || ''} onChange={e => upd('email', e.target.value)} />
        {errs.email && <span className="tm-form-error">{errs.email}</span>}
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Phone Number</label>
        <input className="tm-form-input" type="tel" placeholder="+92 3XX XXXXXXX"
          value={f.phone || ''} onChange={e => upd('phone', e.target.value)} />
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Education</label>
        <input className="tm-form-input" type="text" placeholder="e.g. BS Computer Science"
          value={f.education || ''} onChange={e => upd('education', e.target.value)} />
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Institute</label>
        <input className="tm-form-input" type="text" placeholder="e.g. LUMS"
          value={f.institute || ''} onChange={e => upd('institute', e.target.value)} />
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Location</label>
        <input className="tm-form-input" type="text" placeholder="e.g. Lahore"
          value={f.location || ''} onChange={e => upd('location', e.target.value)} />
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Department <span className="tm-required">*</span></label>
        <input type="text"
          className={`tm-form-input${errs.department ? ' tm-error' : ''}`}
          placeholder="e.g. Engineering"
          value={f.department || ''}
          onChange={e => upd('department', e.target.value)} />
        {errs.department && <span className="tm-form-error">{errs.department}</span>}
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Intern Type</label>
        <select className="tm-form-select" value={f.type || 'Intern'} onChange={e => upd('type', e.target.value)}>
          {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Role <span className="tm-required">*</span></label>
        <input type="text" placeholder="e.g. Intern Developer"
          className={`tm-form-input${errs.role ? ' tm-error' : ''}`}
          value={f.role || ''}
          onChange={e => upd('role', e.target.value)} />
        {errs.role && <span className="tm-form-error">{errs.role}</span>}
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Rank <span className="tm-required">*</span></label>
        <select className={`tm-form-select${errs.rank ? ' tm-error' : ''}`}
          value={f.rank || ''} onChange={e => upd('rank', e.target.value)}>
          <option value="">Select rank...</option>
          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {errs.rank && <span className="tm-form-error">{errs.rank}</span>}
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Check-in Time <span className="tm-required">*</span></label>
        <input className={`tm-form-input${errs.checkInTime ? ' tm-error' : ''}`} type="time"
          value={f.checkInTime || '09:00'} onChange={e => upd('checkInTime', e.target.value)} />
        {errs.checkInTime && <span className="tm-form-error">{errs.checkInTime}</span>}
      </div>

      <div className="tm-form-group">
        <label className="tm-form-label">Check-out Time <span className="tm-required">*</span></label>
        <input className={`tm-form-input${errs.checkOutTime ? ' tm-error' : ''}`} type="time"
          value={f.checkOutTime || '17:30'} onChange={e => upd('checkOutTime', e.target.value)} />
        {errs.checkOutTime && <span className="tm-form-error">{errs.checkOutTime}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper pageId="interns" pageLabel="Interns" description="Manage your interns" onNavigate={onNavigate}>
        <div style={{ padding: '20px' }}>
          <div className="tm-skeleton" style={{ width: '60%', height: 40, marginBottom: 20, borderRadius: 14 }}></div>
          <div className="tm-skeleton" style={{ width: '40%', height: 20, marginBottom: 30, borderRadius: 10 }}></div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>{[1,2,3,4].map(i => <div key={i} className="tm-skeleton" style={{ flex: 1, height: 100, borderRadius: 20 }}></div>)}</div>
          <div className="tm-skeleton" style={{ height: 60, borderRadius: 60, marginBottom: 32 }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>{[1,2,3,4].map(i => <div key={i} className="tm-skeleton" style={{ height: 400, borderRadius: 28 }}></div>)}</div>
        </div>
      </PageWrapper>
    );
  }

  const activeCount = team.filter(m => m.status === 'Active').length;
  const onLeaveCount = team.filter(m => m.status === 'On Leave').length;
  const avgPerformance = Math.round(team.reduce((sum, m) => sum + (m.performance || 0), 0) / team.length) || 0;

  return (
    <PageWrapper pageId="interns" pageLabel="Interns" description="Manage your interns" onNavigate={onNavigate}>
      <div className="tm-premium-container">
        <div className="tm-premium-bg"></div>

        {/* Welcome Section */}
        <div className="tm-welcome-section">
          <h1 className="tm-welcome-title">
            {greeting.emoji} {greeting.text}, <span style={{ color: COLORS.primary }}>Admin</span>
          </h1>
          <p className="tm-welcome-subtitle">
            Here's what's happening with your interns at WellMind Data Solutions
          </p>
          <div className="tm-date-badge">
            <Calendar size={14} /> {currentDate}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="tm-stats-grid">
          <div className="tm-stat-card" onClick={() => setFilterStatus('All')}>
            <div className="tm-stat-icon" style={{ background: COLORS.primaryLight }}>
              <Users size={24} color={COLORS.primary} />
            </div>
            <div className="tm-stat-value">{team.length}</div>
            <div className="tm-stat-label">Total Interns</div>
          </div>
          <div className="tm-stat-card" onClick={() => setFilterStatus('Active')}>
            <div className="tm-stat-icon" style={{ background: '#D1FAE5' }}>
              <Check size={24} color={COLORS.success} />
            </div>
            <div className="tm-stat-value">{activeCount}</div>
            <div className="tm-stat-label">Active</div>
          </div>
          <div className="tm-stat-card" onClick={() => setFilterStatus('On Leave')}>
            <div className="tm-stat-icon" style={{ background: '#FEF3C7' }}>
              <Coffee size={24} color={COLORS.warning} />
            </div>
            <div className="tm-stat-value">{onLeaveCount}</div>
            <div className="tm-stat-label">On Leave</div>
          </div>
          <div className="tm-stat-card">
            <div className="tm-stat-icon" style={{ background: '#E0F2FE' }}>
              <TrendingUp size={24} color={COLORS.teal} />
            </div>
            <div className="tm-stat-value">{avgPerformance}%</div>
            <div className="tm-stat-label">Avg Performance</div>
          </div>
        </div>

        {/* Department Stats */}
        <div className="tm-dept-stats">
          {deptStats.map(d => {
            const deptInfo = DEPT_COLORS[d.dept] || { bg: COLORS.primaryLight, icon: '🏢' };
            return (
              <div className="tm-dept-chip" key={d.dept} onClick={() => setFilterDept(d.dept)}>
                <div className="tm-dept-icon" style={{ background: deptInfo.bg }}>{deptInfo.icon}</div>
                <span className="tm-dept-name">{d.dept}</span>
                <span className="tm-dept-count">{d.count}</span>
              </div>
            );
          })}
          {filterDept !== 'All' && (
            <div className="tm-dept-chip" onClick={() => setFilterDept('All')}>
              <div className="tm-dept-icon" style={{ background: COLORS.primaryLight }}>❌</div>
              <span className="tm-dept-name">Clear Filter</span>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="tm-filter-bar">
          <div className="tm-search-box">
            <Search size={20} />
            <input type="text" placeholder="Search by name, role, or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tm-filter-tabs">
            {Object.entries(statusTabs).map(([label, count]) => (
              <button key={label} className={`tm-filter-tab${filterStatus === label ? ' active' : ''}`}
                onClick={() => setFilterStatus(label)}>{label} ({count})</button>
            ))}
          </div>
        </div>

        {/* Intern Cards */}
        {filteredTeam.length === 0 ? (
          <div className="tm-no-results">
            <Users size={64} strokeWidth={1.5} />
            <h3>No interns found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="tm-cards-grid">
            {filteredTeam.map((member, idx) => {
              const ss = getStatusStyle(member.status);
              const pc = getPerformanceColor(member.performance || 0);
              const isOnLeave = member.status === 'On Leave';
              return (
                <div className={`tm-emp-card${isOnLeave ? ' tm-on-leave' : ''}`} key={member.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="tm-leave-stripe"></div>

                  <div className="tm-card-top">
                    <div className="tm-card-emp-info">
                      <div className="tm-card-avatar" style={{
                        backgroundImage: (member.profilePic && member.profilePic !== '' && member.profilePic !== 'null')
                          ? `url(${member.profilePic})` : 'none',
                        backgroundColor: (member.profilePic && member.profilePic !== '' && member.profilePic !== 'null')
                          ? 'transparent' : (member.avatarColor || COLORS.primary),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}>
                        {(!member.profilePic || member.profilePic === '' || member.profilePic === 'null') && (member.avatar || (member.name ? member.name.charAt(0).toUpperCase() : 'I'))}
                      </div>
                      <div className="tm-card-name-wrap">
                        <span className="tm-card-name">{member.name}</span>
                        <span className="tm-card-role">{member.role}</span>
                        <div className="tm-checkin-badge">
                          <Clock size={11} />
                          {isOnLeave ? 'On Leave' : `${member.checkInTime || '09:00'} — ${member.checkOutTime || '17:30'}`}
                        </div>
                      </div>
                    </div>
                    <span className="tm-status-badge" style={{ background: ss.bg, color: ss.color }}>
                      <span className="tm-status-dot" style={{ backgroundColor: ss.dot }}></span>
                      {ss.icon} {member.status}
                    </span>
                  </div>

                  <div className="tm-card-body">
                    <div className="tm-card-contact">
                      <div className="tm-contact-row"><Mail size={14} /><span>{member.email}</span></div>
                      <div className="tm-contact-row"><Phone size={14} /><span>{member.phone || '—'}</span></div>
                      <div className="tm-contact-row"><MapPin size={14} /><span>{member.location || 'Remote'}</span></div>
                      <div className="tm-contact-row">
                        <GraduationCap size={16} />
                        <span>{member.education ? `${member.education}${member.institute ? `, ${member.institute}` : ''}` : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="tm-card-divider"></div>

                  <div className="tm-card-stats">
                    <div className="tm-stat-item">
                      <span className="tm-stat-label"><Briefcase size={13} /> Projects</span>
                      <span className="tm-stat-value">{Array.isArray(member.projects) ? member.projects.length : (member.projects || 0)}</span>
                    </div>
                    <div className="tm-stat-item">
                      <span className="tm-stat-label"><Award size={13} /> Performance</span>
                      <span className="tm-stat-value" style={{ color: pc }}>{member.performance || 0}%</span>
                      <div className="tm-perf-bar-track">
                        <div className="tm-perf-bar-fill" style={{ width: `${member.performance || 0}%`, backgroundColor: pc }} />
                      </div>
                      <span className="tm-perf-label" style={{ color: pc }}>
                        {getPerformanceIcon(member.performance || 0)} {getPerformanceLabel(member.performance || 0)}
                      </span>
                    </div>
                  </div>

                  {member.skills && member.skills.length > 0 && (
                    <div className="tm-skills-wrap">
                      {member.skills.map(s => <span className="tm-skill-tag" key={s}>{s}</span>)}
                    </div>
                  )}

                  <div className="tm-card-leave-section">
                    <div className="tm-leave-toggle-wrap">
                      <span className={`tm-leave-toggle-label${isOnLeave ? ' tm-active' : ''}`}>
                        <Calendar size={14} />{isOnLeave ? 'On Leave' : 'Mark Leave'}
                      </span>
                      <label className="tm-leave-toggle">
                        <input type="checkbox" checked={isOnLeave} onChange={() => handleLeaveToggle(member)} />
                        <span className="tm-leave-track"></span>
                        <span className="tm-leave-thumb"></span>
                      </label>
                    </div>
                    {member.leaveDays && (
                      <div className="tm-leave-duration">
                        <Calendar size={12} />{member.leaveDays} day{member.leaveDays > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="tm-card-actions">
                    <button className="tm-card-action-btn tm-action-edit" onClick={() => openEditModal(member)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button className="tm-card-action-btn tm-action-delete" onClick={() => setDeleteModal(member)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODALS (unchanged logic, only colors updated via CSS) */}
        {modalOpen && (
          <div className="tm-modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
              <div className="tm-modal-header">
                <div>
                  <div className="tm-modal-title"><UserPlus size={22} style={{ display: 'inline', marginRight: 10 }} /> Add New Intern</div>
                  <div className="tm-modal-subtitle">Add a talented new intern to your team</div>
                </div>
                <button className="tm-modal-close" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              <div className="tm-modal-body">
                <div className="tm-form-section-title">📋 Intern Information</div>
                {renderFormFields(form, updateForm, errors, 'int-pic-add', handlePicUpload)}
              </div>
              <div className="tm-info-box">
                <div className="tm-info-box-title"><Info size={16} /> Quick Tips</div>
                <ul>
                  <li>All fields marked with <span className="tm-required">*</span> are required</li>
                  <li>Check-in/Check-out times are used in the Attendance module</li>
                </ul>
              </div>
              <div className="tm-modal-footer">
                <button className="tm-btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="tm-btn-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Adding...' : <><Sparkles size={16} /> Add Intern</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {editModal && (
          <div className="tm-modal-overlay" onClick={() => setEditModal(null)}>
            <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
              <div className="tm-modal-header">
                <div>
                  <div className="tm-modal-title"><Edit2 size={22} style={{ display: 'inline', marginRight: 10 }} /> Edit Intern</div>
                  <div className="tm-modal-subtitle">Editing: <strong>{editModal.name}</strong></div>
                </div>
                <button className="tm-modal-close" onClick={() => setEditModal(null)}>✕</button>
              </div>
              <div className="tm-modal-body">
                <div className="tm-form-section-title">📋 Intern Information</div>
                {renderFormFields(editForm, updateEditForm, editErrors, 'int-pic-edit', handleEditPicUpload)}
              </div>
              <div className="tm-info-box">
                <div className="tm-info-box-title"><Info size={16} /> Editing Guidelines</div>
                <ul>
                  <li>Changes are saved immediately to Firebase</li>
                  <li>Updated times will reflect in Attendance page</li>
                </ul>
              </div>
              <div className="tm-modal-footer">
                <button className="tm-btn-cancel" onClick={() => setEditModal(null)}>Cancel</button>
                <button className="tm-btn-submit" onClick={handleEditSubmit} disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : <><Check size={16} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {leaveModal && (
          <div className="tm-leave-confirm-overlay" onClick={() => setLeaveModal(null)}>
            <div className="tm-leave-confirm-box" onClick={e => e.stopPropagation()}>
              <div className="tm-leave-confirm-icon"><Coffee size={28} color={COLORS.warning} /></div>
              <div className="tm-leave-confirm-title">Mark {leaveModal.name} On Leave</div>
              <div className="tm-leave-confirm-text">This will update their status to <strong>On Leave</strong>.</div>
              <div className="tm-leave-days-group">
                <label>Duration:</label>
                <input className="tm-leave-days-input" type="number" min="1" max="90"
                  value={leaveDays} onChange={e => setLeaveDays(e.target.value)} />
                <span>day{leaveDays > 1 ? 's' : ''}</span>
              </div>
              <div className="tm-leave-confirm-actions">
                <button className="tm-delete-cancel" onClick={() => setLeaveModal(null)}>Cancel</button>
                <button className="tm-leave-confirm-approve" onClick={confirmLeave}>Approve Leave</button>
              </div>
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="tm-delete-overlay" onClick={() => setDeleteModal(null)}>
            <div className="tm-delete-box" onClick={e => e.stopPropagation()}>
              <div className="tm-delete-icon"><Trash2 size={28} color={COLORS.danger} /></div>
              <div className="tm-delete-title">Remove Intern</div>
              <div className="tm-delete-text">
                Are you sure you want to remove <strong>{deleteModal.name}</strong>? This action cannot be undone.
              </div>
              <div className="tm-delete-actions">
                <button className="tm-delete-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="tm-delete-confirm" onClick={() => handleDelete(deleteModal.id)}>Remove</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`tm-toast ${toast.type}`}>
            {toast.type === 'success' ? <Check size={18} color={COLORS.success} /> : <AlertCircle size={18} color={toast.type === 'warning' ? COLORS.warning : COLORS.danger} />}
            {toast.message}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Interns;