import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageWrapper from '../PageWrapper';
import {
  GraduationCap, Sparkles, TrendingUp, Users, Calendar, Clock, Award,
  Mail, Phone, MapPin, Briefcase, Star, Zap, Heart, Search, Check, AlertCircle,
  Trash2, Edit2, UserPlus, Info, Coffee, Trophy
} from 'lucide-react';
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const COLORS = {
  primary: "#7C3AED",
  primaryDark: "#1E1B2E",
  primaryLight: "#EDE9FE",
  textDark: "#1A1530",
  textMuted: "#64748B",
  bgPage: "#F7F5FF",
  bgCard: "#FFFFFF",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  teal: "#0891B2",
  border: "rgba(124, 58, 237, 0.1)",
};

const RANKS = ['Junior', 'Mid-Level', 'Senior', 'Elite', 'Legend'];
const EMP_TYPES = ['Full Time', 'Part Time', 'Contractor', 'Freelance', 'Intern'];
const AVATAR_COLORS = [COLORS.primary, COLORS.teal, COLORS.danger, '#47234F', COLORS.warning, COLORS.primaryDark];
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE = {
  Monday:    { active: true,  inTime: '09:00', outTime: '17:30' },
  Tuesday:   { active: true,  inTime: '09:00', outTime: '17:30' },
  Wednesday: { active: true,  inTime: '09:00', outTime: '17:30' },
  Thursday:  { active: true,  inTime: '09:00', outTime: '17:30' },
  Friday:    { active: true,  inTime: '09:00', outTime: '17:30' },
  Saturday:  { active: false, inTime: '09:00', outTime: '13:00' },
  Sunday:    { active: false, inTime: '',      outTime: ''       },
};

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'IN';
const generateId  = () => 'int_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pickColor   = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning',   emoji: '🌅', color: COLORS.warning };
  if (h < 17) return { text: 'Good Afternoon', emoji: '☀️', color: COLORS.teal };
  if (h < 20) return { text: 'Good Evening',   emoji: '🌆', color: COLORS.primary };
  return           { text: 'Good Night',       emoji: '🌙', color: COLORS.primaryDark };
};

const formatDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const getPerformanceColor = (v) => v >= 90 ? COLORS.teal : v >= 75 ? COLORS.warning : v >= 60 ? COLORS.primary : COLORS.danger;
const getPerformanceLabel = (v) => v >= 90 ? 'Outstanding' : v >= 75 ? 'Excellent' : v >= 60 ? 'Good' : v >= 40 ? 'Average' : 'Needs Improvement';
const getPerformanceIcon  = (v) => v >= 90 ? <Sparkles size={14}/> : v >= 75 ? <Trophy size={14}/> : v >= 60 ? <Star size={14}/> : v >= 40 ? <Zap size={14}/> : <Heart size={14}/>;

const getStatusStyle = (status) => {
  switch (status) {
    case 'Active':   return { bg: '#dcfce7', color: COLORS.success, dot: COLORS.success, icon: '✅' };
    case 'On Leave': return { bg: '#fef3c7', color: COLORS.warning, dot: COLORS.warning, icon: '🌴' };
    case 'Inactive': return { bg: '#fee2e2', color: COLORS.danger,  dot: COLORS.danger,  icon: '⭕' };
    default:         return { bg: COLORS.primaryLight, color: COLORS.primary, dot: COLORS.primary, icon: '🟡' };
  }
};

const DEPT_COLORS = {
  Engineering: { bg: '#E0F2FE', color: COLORS.teal,    icon: '⚙️' },
  Design:      { bg: COLORS.primaryLight, color: COLORS.primary, icon: '🎨' },
  Marketing:   { bg: '#FEF3C7', color: COLORS.warning,  icon: '📢' },
  QA:          { bg: '#D1FAE5', color: COLORS.success,  icon: '🔍' },
  DevOps:      { bg: '#FFE4E6', color: COLORS.danger,   icon: '🚀' },
  HR:          { bg: '#F3E8FF', color: '#6B21A5',       icon: '🤝' },
  Finance:     { bg: '#FFE4E6', color: '#9F1239',       icon: '💰' },
};

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700;800;900&display=swap');

.tm-premium-container { position: relative; overflow: hidden; font-family: 'Inter', sans-serif; }
.tm-premium-bg { position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 100% 0%, rgba(124,58,237,0.03) 0%, transparent 60%); pointer-events: none; z-index: 0; }

.tm-welcome-section { margin-bottom: 32px; position: relative; z-index: 1; animation: fadeIn 0.5s ease; }
.tm-welcome-title    { font-size: 32px; font-weight: 900; letter-spacing: -0.02em; margin: 0 0 8px; color: #1A1530; }
.tm-welcome-subtitle { font-size: 15px; color: #64748B; margin: 0 0 12px; font-weight: 500; }
.tm-date-badge       { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: #fff; border: 1px solid rgba(124,58,237,0.1); border-radius: 40px; font-size: 13px; font-weight: 600; color: #7C3AED; margin-top: 12px; }

.tm-dept-stats { display: flex; gap: 14px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-dept-chip  { display: inline-flex; align-items: center; gap: 12px; padding: 10px 22px; background: #fff; border: 1px solid rgba(124,58,237,0.1); border-radius: 60px; font-size: 13px; font-weight: 600; color: #64748B; transition: all 0.3s cubic-bezier(0.2,0.9,0.4,1.1); cursor: pointer; }
.tm-dept-chip:hover { border-color: #7C3AED; transform: translateY(-3px) scale(1.02); box-shadow: 0 10px 20px rgba(124,58,237,0.12); background: #fff; }
.tm-dept-chip .tm-dept-icon  { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.tm-dept-chip .tm-dept-name  { font-weight: 800; color: #1A1530; }
.tm-dept-chip .tm-dept-count { font-weight: 900; color: #7C3AED; background: #EDE9FE; padding: 3px 10px; border-radius: 30px; margin-left: 8px; font-size: 12px; }

.tm-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 32px; }
.tm-stat-card  { background: #fff; border-radius: 20px; padding: 20px; border: 1px solid rgba(124,58,237,0.1); transition: all 0.3s ease; cursor: pointer; }
.tm-stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(124,58,237,0.1); border-color: #EDE9FE; }
.tm-stat-icon  { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.tm-stat-value { font-size: 32px; font-weight: 900; color: #1A1530; line-height: 1.2; }
.tm-stat-label { font-size: 13px; font-weight: 600; color: #64748B; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

.tm-filter-bar  { display: flex; align-items: center; gap: 18px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-search-box  { flex: 1; max-width: 400px; position: relative; }
.tm-search-box input { width: 100%; padding: 13px 18px 13px 48px; font-size: 14px; color: #1A1530; background: #fff; border: 1.5px solid rgba(124,58,237,0.1); border-radius: 60px; outline: none; transition: all 0.3s ease; font-family: inherit; }
.tm-search-box input:focus { border-color: #7C3AED; box-shadow: 0 0 0 4px rgba(124,58,237,0.1); }
.tm-search-box input::placeholder { color: #64748B; }
.tm-search-box svg { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #7C3AED; opacity: 0.6; }
.tm-filter-tabs { display: flex; gap: 8px; background: #F7F5FF; border-radius: 60px; padding: 5px; border: 1px solid rgba(124,58,237,0.1); }
.tm-filter-tab  { padding: 9px 22px; font-size: 13px; font-weight: 700; color: #64748B; background: none; border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; white-space: nowrap; }
.tm-filter-tab:hover  { color: #1A1530; background: rgba(124,58,237,0.08); transform: translateY(-1px); }
.tm-filter-tab.active { color: #fff; background: linear-gradient(135deg,#7C3AED,#0891B2); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }

.tm-cards-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 28px; position: relative; z-index: 1; }
@media (max-width: 768px) {
  .tm-stats-grid { grid-template-columns: repeat(2,1fr); gap: 12px; }
  .tm-filter-bar { flex-direction: column; align-items: stretch; }
  .tm-search-box { max-width: 100%; }
  .tm-filter-tabs { overflow-x: auto; }
  .tm-cards-grid  { grid-template-columns: 1fr; gap: 20px; }
}

.tm-emp-card { background: #fff; border-radius: 28px; overflow: hidden; transition: all 0.4s cubic-bezier(0.2,0.9,0.4,1.1); position: relative; border: 1px solid rgba(124,58,237,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.02); animation: cardFadeIn 0.5s ease backwards; }
@keyframes cardFadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.tm-emp-card:hover { box-shadow: 0 25px 45px -12px rgba(124,58,237,0.2); transform: translateY(-6px); border-color: #EDE9FE; }
.tm-emp-card.tm-on-leave { background: #FEFAF5; opacity: 0.82; }
.tm-leave-stripe { position: absolute; top:0; left:0; right:0; height:4px; background: repeating-linear-gradient(90deg,#D97706 0,#D97706 10px,#FDE68A 10px,#FDE68A 20px); opacity:0; transition: opacity 0.4s ease; }
.tm-emp-card.tm-on-leave .tm-leave-stripe { opacity:1; }

.tm-card-top  { padding: 24px 24px 0; display: flex; align-items: flex-start; justify-content: space-between; }
.tm-card-emp-info { display: flex; align-items: center; gap: 18px; }
.tm-card-avatar { width:64px; height:64px; border-radius:22px; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900; color:#fff; flex-shrink:0; overflow:hidden; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.tm-emp-card:hover .tm-card-avatar { transform: scale(1.03); }
.tm-card-name { font-size:18px; font-weight:800; color:#1A1530; letter-spacing:-0.3px; }

/* ── NEW Role Block Badge ── */
.tm-role-block {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
  padding: 5px 14px 5px 8px;
  background: linear-gradient(135deg, #1E1B2E 0%, #2D1F4E 100%);
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #E9D8FD;
  letter-spacing: 0.2px;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(124,58,237,0.25);
}
.tm-role-block-icon {
  width: 20px;
  height: 20px;
  background: rgba(124,58,237,0.5);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tm-status-badge { display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:60px; font-size:11px; font-weight:800; white-space:nowrap; flex-shrink:0; }
.tm-status-dot   { width:8px; height:8px; border-radius:50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.6;transform:scale(1.2);} }

.tm-card-body    { padding: 20px 24px; }
.tm-card-contact { display:flex; flex-direction:column; gap:12px; margin-bottom:20px; }
.tm-contact-row  { display:flex; align-items:center; gap:12px; font-size:13px; color:#1A1530; padding:6px 0; transition: transform 0.2s ease; }
.tm-contact-row:hover { transform: translateX(4px); }
.tm-contact-row svg { color:#64748B; flex-shrink:0; }
.tm-contact-row:hover svg { color:#7C3AED; }

.tm-card-divider { height:1px; background: linear-gradient(90deg,transparent,rgba(124,58,237,0.1),rgba(124,58,237,0.1),transparent); margin:0 24px; }
.tm-card-stats   { display:grid; grid-template-columns:1fr 1.2fr; gap:20px; padding:20px 24px; }
.tm-stat-item    { display:flex; flex-direction:column; gap:10px; }
.tm-stat-label   { font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:0.08em; display:flex; align-items:center; gap:6px; }
.tm-stat-value   { font-size:26px; font-weight:900; color:#1A1530; line-height:1; }
.tm-perf-bar-track { height:8px; background:#EDE9FE; border-radius:10px; overflow:hidden; }
.tm-perf-bar-fill  { height:100%; border-radius:10px; transition:width 0.8s ease; position:relative; overflow:hidden; }
.tm-perf-bar-fill::after { content:''; position:absolute; top:0;left:0;right:0;bottom:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation:shimmer 2s infinite; }
@keyframes shimmer { 0%{transform:translateX(-100%);} 100%{transform:translateX(100%);} }
.tm-perf-label   { font-size:11px; font-weight:700; margin-top:6px; display:flex; align-items:center; gap:4px; }

.tm-skills-wrap  { display:flex; flex-wrap:wrap; gap:8px; padding:12px 24px 20px; }
.tm-skill-tag    { padding:5px 12px; background:#EDE9FE; border-radius:30px; font-size:11px; font-weight:700; color:#1A1530; border:1px solid rgba(124,58,237,0.1); transition:all 0.25s ease; cursor:default; }
.tm-skill-tag:hover { background:#7C3AED; color:#fff; transform:translateY(-2px); border-color:transparent; }

/* ── Simplified Leave Section — no days shown ── */
.tm-card-leave-section { padding:14px 24px; border-top:1px solid rgba(124,58,237,0.08); display:flex; align-items:center; gap:14px; background:#F7F5FF; }
.tm-leave-toggle-label { font-size:13px; font-weight:800; color:#64748B; display:flex; align-items:center; gap:8px; transition: color 0.2s; }
.tm-leave-toggle-label.tm-active { color:#D97706; }
.tm-leave-toggle { position:relative; width:52px; height:26px; cursor:pointer; flex-shrink:0; }
.tm-leave-toggle input { opacity:0; width:0; height:0; position:absolute; }
.tm-leave-track  { position:absolute; inset:0; background:#d8c8dc; border-radius:26px; transition:all 0.3s ease; }
.tm-leave-toggle input:checked + .tm-leave-track { background:#D97706; box-shadow:0 0 8px rgba(217,119,6,0.4); }
.tm-leave-thumb  { position:absolute; top:3px; left:3px; width:20px; height:20px; background:#fff; border-radius:50%; transition:transform 0.3s ease; box-shadow:0 2px 6px rgba(0,0,0,0.2); }
.tm-leave-toggle input:checked ~ .tm-leave-thumb { transform:translateX(26px); }

.tm-card-actions      { display:flex; gap:12px; padding:16px 24px; border-top:1px solid rgba(124,58,237,0.08); background:#fff; }
.tm-card-action-btn   { display:inline-flex; align-items:center; gap:8px; padding:8px 18px; font-size:12px; font-weight:800; color:#1A1530; background:#F7F5FF; border:none; border-radius:60px; cursor:pointer; transition:all 0.3s ease; font-family:inherit; }
.tm-card-action-btn:hover { transform:translateY(-2px); }
.tm-card-action-btn.tm-action-edit:hover   { background:#EDE9FE; color:#7C3AED; }
.tm-card-action-btn.tm-action-delete:hover { background:#fee2e2; color:#DC2626; }

.tm-checkin-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; background:#EDE9FE; border-radius:30px; font-size:10px; font-weight:800; color:#7C3AED; margin-top:7px; width:fit-content; }
.tm-no-results    { text-align:center; padding:60px 20px; background:#fff; border-radius:32px; border:2px dashed rgba(124,58,237,0.1); }
.tm-no-results h3  { font-size:18px; font-weight:800; color:#7C3AED; margin-bottom:8px; }
.tm-no-results p   { font-size:14px; color:#64748B; }

/* MODAL */
.tm-modal-overlay { position:fixed; inset:0; z-index:900; background:rgba(30,27,46,0.7); backdrop-filter:blur(8px); display:flex; align-items:flex-start; justify-content:center; padding:40px 20px; overflow-y:auto; animation:fadeIn 0.3s ease; }
.tm-modal-box     { background:#F7F5FF; border-radius:32px; width:780px; max-width:100%; box-shadow:0 40px 80px rgba(0,0,0,0.2); animation:modalIn 0.4s ease-out; border:1px solid rgba(124,58,237,0.1); overflow:hidden; }
@keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
@keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(20px);} to{opacity:1;transform:scale(1) translateY(0);} }
.tm-modal-header { display:flex; justify-content:space-between; align-items:flex-start; padding:28px 32px 0; }
.tm-modal-title  { font-size:24px; font-weight:900; color:#1A1530; display:flex; align-items:center; gap:10px; }
.tm-modal-subtitle { font-size:14px; color:#64748B; margin-top:6px; }
.tm-modal-close  { background:rgba(124,58,237,0.1); border:none; width:40px; height:40px; border-radius:60px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#7C3AED; transition:all 0.3s ease; font-size:16px; font-family:inherit; }
.tm-modal-close:hover { background:rgba(124,58,237,0.2); transform:rotate(90deg); }
.tm-modal-body   { padding:24px 32px; }
.tm-modal-footer { padding:0 32px 28px; display:flex; gap:16px; justify-content:flex-end; }

/* FORM */
.tm-form-section { margin-bottom: 28px; }
.tm-form-section-title { font-size:15px; font-weight:800; color:#1A1530; margin-bottom:18px; display:flex; align-items:center; gap:10px; padding-bottom:10px; border-bottom:2px solid rgba(124,58,237,0.1); }
.tm-form-section-title span { font-size:18px; }
.tm-form-grid    { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.tm-form-group   { display:flex; flex-direction:column; }
.tm-form-group.full-width { grid-column: 1 / -1; }
.tm-form-label   { font-size:12px; font-weight:700; color:#1A1530; margin-bottom:7px; display:flex; align-items:center; gap:5px; }
.tm-form-label .tm-required { color:#DC2626; }
.tm-form-input, .tm-form-select { width:100%; padding:11px 14px; font-size:13.5px; color:#1A1530; background:#fff; border:1.5px solid rgba(124,58,237,0.1); border-radius:12px; outline:none; transition:all 0.2s ease; font-family:inherit; }
.tm-form-input:focus, .tm-form-select:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,0.1); }
.tm-form-input.tm-error { border-color:#DC2626; background:#FFF5F5; }
.tm-form-error   { font-size:11px; color:#DC2626; margin-top:5px; font-weight:600; }

.tm-pic-upload-row { display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
.tm-pic-preview { width:80px; height:80px; border-radius:20px; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:#fff; border:2px dashed rgba(124,58,237,0.2); cursor:pointer; transition:all 0.2s ease; flex-shrink:0; }
.tm-pic-preview:hover { border-color:#7C3AED; transform:scale(1.02); }

/* SCHEDULE TABLE */
.tm-schedule-table { width:100%; border-radius:16px; overflow:hidden; border:1px solid rgba(124,58,237,0.1); }
.tm-schedule-head  { display:grid; grid-template-columns:130px 1fr 1fr 60px; background:#EDE9FE; padding:10px 16px; font-size:11px; font-weight:800; color:#7C3AED; text-transform:uppercase; letter-spacing:0.06em; }
.tm-schedule-row   { display:grid; grid-template-columns:130px 1fr 1fr 60px; align-items:center; padding:10px 16px; border-top:1px solid rgba(124,58,237,0.08); background:#fff; transition:background 0.2s; }
.tm-schedule-row:hover { background:#F7F5FF; }
.tm-schedule-row.inactive { opacity:0.45; }
.tm-schedule-day   { font-size:13px; font-weight:700; color:#1A1530; display:flex; align-items:center; gap:8px; }
.tm-schedule-time  { padding:0 8px; }
.tm-schedule-time input { width:100%; padding:7px 10px; font-size:13px; font-family:inherit; color:#1A1530; background:#f8f5ff; border:1.5px solid rgba(124,58,237,0.12); border-radius:9px; outline:none; transition:all 0.2s; }
.tm-schedule-time input:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,0.1); }
.tm-schedule-time input:disabled { background:#f1f5f9; color:#64748B; cursor:not-allowed; }
.tm-day-toggle { position:relative; width:36px; height:20px; cursor:pointer; margin:auto; }
.tm-day-toggle input { opacity:0; width:0; height:0; position:absolute; }
.tm-day-track  { position:absolute; inset:0; background:#d1d5db; border-radius:20px; transition:all 0.3s ease; }
.tm-day-toggle input:checked + .tm-day-track { background:#7C3AED; }
.tm-day-thumb  { position:absolute; top:2px; left:2px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform 0.3s ease; box-shadow:0 1px 4px rgba(0,0,0,0.2); }
.tm-day-toggle input:checked ~ .tm-day-thumb { transform:translateX(16px); }

.tm-copy-schedule-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; font-size:12px; font-weight:700; color:#7C3AED; background:#EDE9FE; border:1px solid rgba(124,58,237,0.2); border-radius:30px; cursor:pointer; transition:all 0.2s; margin-bottom:12px; font-family:inherit; }
.tm-copy-schedule-btn:hover { background:#7C3AED; color:#fff; transform:translateY(-1px); }

.tm-info-box { margin:4px 32px 20px; padding:14px 22px; background:#EDE9FE; border-radius:18px; border:1px solid rgba(124,58,237,0.1); }
.tm-info-box-title { font-size:13px; font-weight:800; color:#7C3AED; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
.tm-info-box ul    { margin:0; padding-left:18px; font-size:12px; line-height:1.7; color:#64748B; }

.tm-btn-cancel { padding:10px 24px; font-size:14px; font-weight:700; color:#1A1530; background:#fff; border:1px solid rgba(124,58,237,0.15); border-radius:60px; cursor:pointer; transition:all 0.2s ease; font-family:inherit; }
.tm-btn-cancel:hover { background:#EDE9FE; transform:translateY(-1px); }
.tm-btn-submit { padding:10px 28px; font-size:14px; font-weight:800; color:#fff; background:linear-gradient(135deg,#7C3AED,#0891B2); border:none; border-radius:60px; cursor:pointer; transition:all 0.2s ease; display:inline-flex; align-items:center; gap:8px; box-shadow:0 2px 8px rgba(124,58,237,0.3); font-family:inherit; }
.tm-btn-submit:hover { transform:translateY(-1px); box-shadow:0 6px 14px rgba(124,58,237,0.4); }
.tm-btn-submit:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

.tm-toast { position:fixed; top:24px; right:24px; z-index:1000; padding:14px 24px; border-radius:60px; font-size:14px; font-weight:700; background:#fff; border:1px solid rgba(124,58,237,0.1); box-shadow:0 10px 25px rgba(0,0,0,0.1); display:flex; align-items:center; gap:12px; animation:toastIn 0.4s ease; }
.tm-toast.success { border-left:4px solid #059669; }
.tm-toast.error   { border-left:4px solid #DC2626; }
.tm-toast.warning { border-left:4px solid #D97706; }
@keyframes toastIn { from{opacity:0;transform:translateX(40px);} to{opacity:1;transform:translateX(0);} }

.tm-delete-overlay { position:fixed; inset:0; z-index:950; background:rgba(30,27,46,0.6); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
.tm-delete-box { background:#fff; border-radius:28px; width:400px; max-width:90vw; padding:32px; box-shadow:0 30px 50px rgba(0,0,0,0.2); text-align:center; border:1px solid rgba(124,58,237,0.1); }
.tm-delete-icon { width:60px; height:60px; border-radius:60px; background:#fee2e2; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
.tm-delete-title { font-size:20px; font-weight:800; color:#1A1530; margin-bottom:8px; }
.tm-delete-text  { font-size:14px; color:#64748B; margin-bottom:24px; }
.tm-delete-actions { display:flex; gap:12px; }
.tm-delete-actions button { flex:1; padding:10px; font-size:14px; font-weight:700; border-radius:60px; cursor:pointer; border:none; font-family:inherit; }
.tm-delete-cancel  { background:#F7F5FF; color:#1A1530; border:1px solid rgba(124,58,237,0.15) !important; }
.tm-delete-confirm { background:#DC2626; color:#fff; }

.tm-skeleton { background:linear-gradient(90deg,#E8DEE8 25%,#D8C8DC 50%,#E8DEE8 75%); background-size:200% 100%; border-radius:16px; animation:skeleton 1.5s ease-in-out infinite; }
@keyframes skeleton { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
`;

if (typeof document !== 'undefined' && !document.getElementById('int-styles-v4')) {
  const tag = document.createElement('style');
  tag.id = 'int-styles-v4';
  tag.textContent = styles;
  document.head.appendChild(tag);
}

const defaultForm = () => ({
  name: '', email: '', phone: '', city: '',
  education: '', institute: '',
  department: '', role: '', rank: '', type: 'Intern',
  profilePic: null,
  schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
});

// ── Schedule Editor ───────────────────────────────────────────
const ScheduleEditor = ({ schedule, onChange }) => {
  const copyMonFriToAll = () => {
    const mon = schedule['Monday'];
    const updated = { ...schedule };
    WEEK_DAYS.forEach(d => { updated[d] = { ...mon, active: d !== 'Sunday' }; });
    onChange(updated);
  };
  const DAY_EMOJI = { Monday:'🟦', Tuesday:'🟩', Wednesday:'🟨', Thursday:'🟧', Friday:'🟥', Saturday:'🌤️', Sunday:'😴' };
  return (
    <div>
      <button type="button" className="tm-copy-schedule-btn" onClick={copyMonFriToAll}>
        ⚡ Copy Monday timing to all active days
      </button>
      <div className="tm-schedule-table">
        <div className="tm-schedule-head">
          <div>Day</div><div>Check-In</div><div>Check-Out</div><div style={{textAlign:'center'}}>On</div>
        </div>
        {WEEK_DAYS.map(day => {
          const d = schedule[day] || { active: false, inTime: '', outTime: '' };
          return (
            <div key={day} className={`tm-schedule-row${!d.active ? ' inactive' : ''}`}>
              <div className="tm-schedule-day">{DAY_EMOJI[day]} {day}</div>
              <div className="tm-schedule-time">
                <input type="time" value={d.inTime} disabled={!d.active}
                  onChange={e => onChange({ ...schedule, [day]: { ...d, inTime: e.target.value } })} />
              </div>
              <div className="tm-schedule-time">
                <input type="time" value={d.outTime} disabled={!d.active}
                  onChange={e => onChange({ ...schedule, [day]: { ...d, outTime: e.target.value } })} />
              </div>
              <label className="tm-day-toggle">
                <input type="checkbox" checked={!!d.active}
                  onChange={() => onChange({ ...schedule, [day]: { ...d, active: !d.active } })} />
                <span className="tm-day-track"></span>
                <span className="tm-day-thumb"></span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Intern Form ───────────────────────────────────────────────
const InternForm = ({ f, upd, errs, picInputId, onPicUpload }) => (
  <div>
    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>👤</span> Personal Information</div>
      <div className="tm-form-grid">
        <div className="tm-form-group full-width">
          <label className="tm-form-label">Profile Picture</label>
          <div className="tm-pic-upload-row">
            <div className="tm-pic-preview"
              style={{ backgroundColor: f.profilePic ? 'transparent' : '#7C3AED' }}
              onClick={() => document.getElementById(picInputId).click()}>
              {f.profilePic
                ? <img src={f.profilePic} alt="profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : getInitials(f.name || 'IN')}
            </div>
            <div>
              <input id={picInputId} type="file" accept="image/*" style={{ display:'none' }} onChange={onPicUpload} />
              <button type="button" className="tm-btn-cancel" style={{ fontSize:12, padding:'7px 16px' }}
                onClick={() => document.getElementById(picInputId).click()}>📁 Upload Photo</button>
              {f.profilePic && (
                <button type="button" className="tm-card-action-btn tm-action-delete"
                  style={{ fontSize:12, padding:'7px 14px', marginLeft:8 }}
                  onClick={() => upd('profilePic', null)}>Remove</button>
              )}
              <p style={{ fontSize:10, color:'#64748B', marginTop:6 }}>JPG / PNG / WEBP — max 700KB</p>
            </div>
          </div>
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Full Name <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.name ? ' tm-error' : ''}`} type="text"
            placeholder="e.g. Ayesha Siddiqui" value={f.name || ''}
            onChange={e => upd('name', e.target.value)} />
          {errs.name && <span className="tm-form-error">{errs.name}</span>}
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Email Address <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.email ? ' tm-error' : ''}`} type="email"
            placeholder="e.g. ayesha@wellmind.com" value={f.email || ''}
            onChange={e => upd('email', e.target.value)} />
          {errs.email && <span className="tm-form-error">{errs.email}</span>}
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Phone Number</label>
          <input className="tm-form-input" type="tel"
            placeholder="+92 3XX XXXXXXX" value={f.phone || ''}
            onChange={e => upd('phone', e.target.value)} />
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">City</label>
          <input className="tm-form-input" type="text"
            placeholder="e.g. Karachi" value={f.city || ''}
            onChange={e => upd('city', e.target.value)} />
        </div>
      </div>
    </div>

    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>🎓</span> Education</div>
      <div className="tm-form-grid">
        <div className="tm-form-group">
          <label className="tm-form-label">Degree / Qualification</label>
          <input className="tm-form-input" type="text"
            placeholder="e.g. BS Computer Science" value={f.education || ''}
            onChange={e => upd('education', e.target.value)} />
        </div>
        <div className="tm-form-group">
          <label className="tm-form-label">Institute / University</label>
          <input className="tm-form-input" type="text"
            placeholder="e.g. NED University" value={f.institute || ''}
            onChange={e => upd('institute', e.target.value)} />
        </div>
      </div>
    </div>

    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>💼</span> Role & Department</div>
      <div className="tm-form-grid">
        <div className="tm-form-group">
          <label className="tm-form-label">Department <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.department ? ' tm-error' : ''}`} type="text"
            placeholder="e.g. Engineering" value={f.department || ''}
            onChange={e => upd('department', e.target.value)} />
          {errs.department && <span className="tm-form-error">{errs.department}</span>}
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Role / Position <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.role ? ' tm-error' : ''}`} type="text"
            placeholder="e.g. Frontend Developer" value={f.role || ''}
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
          <label className="tm-form-label">Intern Type</label>
          <select className="tm-form-select"
            value={f.type || 'Intern'} onChange={e => upd('type', e.target.value)}>
            {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>

    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>🗓️</span> Weekly Schedule</div>
      <ScheduleEditor
        schedule={f.schedule || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))}
        onChange={s => upd('schedule', s)}
      />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────
const Interns = ({ onNavigate }) => {
  const [team, setTeam]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [filterDept, setFilterDept]         = useState('All');
  const [filterStatus, setFilterStatus]     = useState('All');
  const [modalOpen, setModalOpen]           = useState(false);
  const [editModal, setEditModal]           = useState(null);
  const [deleteModal, setDeleteModal]       = useState(null);
  const [toast, setToast]                   = useState(null);
  const [form, setForm]                     = useState(defaultForm());
  const [editForm, setEditForm]             = useState({});
  const [errors, setErrors]                 = useState({});
  const [editErrors, setEditErrors]         = useState({});
  const [submitting, setSubmitting]         = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const greeting    = getGreeting();
  const currentDate = formatDate();

  const fetchInterns = useCallback(async () => {
    try {
      const qs = await getDocs(collection(db, "interns"));
      const list = qs.docs.map(d => ({
        ...d.data(), id: d.id,
        status:      d.data().status || 'Active',
        projects:    d.data().projects || [],
        performance: d.data().performance || Math.floor(Math.random() * 40) + 60,
        skills:      d.data().skills || [],
        schedule:    d.data().schedule || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
      }));
      setTeam(list);
    } catch (e) {
      console.error(e);
      showToast('Failed to load interns', 'error');
    } finally { setLoading(false); }
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

  const statusTabs = useMemo(() => {
    const c = { All: team.length, Active: 0, 'On Leave': 0 };
    team.forEach(m => { if (m.status === 'Active') c.Active++; else if (m.status === 'On Leave') c['On Leave']++; });
    return c;
  }, [team]);

  // On Leave waale end mein
  const filteredTeam = useMemo(() => team
    .filter(m => {
      const s = search.toLowerCase();
      const matchSearch = !s || (m.name||'').toLowerCase().includes(s) || (m.role||'').toLowerCase().includes(s) || (m.email||'').toLowerCase().includes(s);
      const matchDept   = filterDept === 'All' || m.department === filterDept;
      const matchStatus = filterStatus === 'All' || m.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    })
    .sort((a, b) => {
      if (a.status === 'On Leave' && b.status !== 'On Leave') return 1;
      if (a.status !== 'On Leave' && b.status === 'On Leave') return -1;
      return 0;
    }),
  [team, search, filterDept, filterStatus]);

  // Simple leave toggle — no days, no confirm modal
  const handleLeaveToggle = async (member) => {
    const newStatus = member.status === 'On Leave' ? 'Active' : 'On Leave';
    try {
      await updateDoc(doc(db, "interns", member.id), { status: newStatus });
      setTeam(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
      showToast(
        newStatus === 'On Leave'
          ? `${member.name} marked On Leave`
          : `${member.name} marked Active`,
        newStatus === 'On Leave' ? 'warning' : 'success'
      );
    } catch { showToast('Failed to update', 'error'); }
  };

  const updForm     = (f, v) => { setForm(p => ({ ...p, [f]: v }));     if (errors[f])     setErrors(p => ({ ...p, [f]: null })); };
  const updEditForm = (f, v) => { setEditForm(p => ({ ...p, [f]: v })); if (editErrors[f]) setEditErrors(p => ({ ...p, [f]: null })); };

  const validate = (f, setErr) => {
    const e = {};
    if (!f.name?.trim())  e.name = 'Full name is required';
    if (!f.email?.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = 'Invalid email format';
    if (!f.role)          e.role = 'Role is required';
    if (!f.rank)          e.rank = 'Rank is required';
    if (!f.department)    e.department = 'Department is required';
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const handlePicUpload = (e, updFn) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 700 * 1024) { showToast('Image too large (Max 700KB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => updFn('profilePic', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!validate(form, setErrors)) return;
    setSubmitting(true);
    const newId = generateId();
    const data = {
      id: newId, name: form.name.trim(), email: form.email.trim(),
      phone: form.phone?.trim() || '', city: form.city?.trim() || '',
      type: form.type, role: form.role, rank: form.rank,
      department: form.department, education: form.education || '',
      institute: form.institute || '', status: 'Active',
      avatar: form.profilePic ? null : getInitials(form.name),
      avatarColor: pickColor(), profilePic: form.profilePic || null,
      projects: [], performance: Math.floor(Math.random() * 40) + 60,
      skills: [], schedule: form.schedule || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
      createdAt: new Date(),
    };
    try {
      await setDoc(doc(db, "interns", newId), data);
      setTeam(prev => [...prev, data]);
      showToast(`${data.name} added successfully! 🎉`, 'success');
      setForm(defaultForm()); setErrors({});
      setModalOpen(false);
    } catch (err) { console.error(err); showToast('Failed to add intern', 'error'); }
    finally { setSubmitting(false); }
  };

  const openEditModal = (member) => {
    setEditForm({
      name: member.name || '', email: member.email || '', phone: member.phone || '',
      city: member.city || '', type: member.type || 'Intern', role: member.role || '',
      rank: member.rank || '', department: member.department || '',
      education: member.education || '', institute: member.institute || '',
      profilePic: member.profilePic || null, avatarColor: member.avatarColor || pickColor(),
      schedule: member.schedule ? JSON.parse(JSON.stringify(member.schedule)) : JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
    });
    setEditErrors({}); setEditModal(member);
  };

  const handleEditSubmit = async () => {
    if (!validate(editForm, setEditErrors)) return;
    setEditSubmitting(true);
    const updated = {
      name: editForm.name.trim(), email: editForm.email.trim(),
      phone: editForm.phone?.trim() || '', city: editForm.city?.trim() || '',
      type: editForm.type, role: editForm.role, rank: editForm.rank,
      department: editForm.department, education: editForm.education || '',
      institute: editForm.institute || '',
      avatar: editForm.profilePic ? null : getInitials(editForm.name),
      avatarColor: editForm.avatarColor, profilePic: editForm.profilePic || null,
      schedule: editForm.schedule || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
    };
    try {
      await updateDoc(doc(db, "interns", editModal.id), updated);
      setTeam(prev => prev.map(m => m.id === editModal.id ? { ...m, ...updated } : m));
      showToast(`${updated.name} updated successfully!`, 'success');
      setEditModal(null);
    } catch (err) { console.error(err); showToast('Failed to update intern', 'error'); }
    finally { setEditSubmitting(false); }
  };

  const handleDelete = async (id) => {
    const member = team.find(m => m.id === id);
    try {
      await deleteDoc(doc(db, "interns", id));
      setTeam(prev => prev.filter(m => m.id !== id));
      showToast(`${member?.name || 'Intern'} removed`, 'error');
      setDeleteModal(null);
    } catch { showToast('Failed to remove', 'error'); }
  };

  const getTodaySchedule = (member) => {
    if (member.status === 'On Leave') return 'On Leave';
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];
    const sched = member.schedule?.[today];
    if (!sched || !sched.active) return 'Day Off Today';
    return `${sched.inTime || '09:00'} — ${sched.outTime || '17:30'}`;
  };

  if (loading) {
    return (
      <PageWrapper pageId="interns" pageLabel="Interns" description="Manage your interns" onNavigate={onNavigate}>
        <div style={{ padding:'20px' }}>
          <div className="tm-skeleton" style={{ width:'60%', height:40, marginBottom:20, borderRadius:14 }}></div>
          <div className="tm-skeleton" style={{ width:'40%', height:20, marginBottom:30, borderRadius:10 }}></div>
          <div style={{ display:'flex', gap:16, marginBottom:32 }}>
            {[1,2,3,4].map(i => <div key={i} className="tm-skeleton" style={{ flex:1, height:100, borderRadius:20 }}></div>)}
          </div>
          <div className="tm-skeleton" style={{ height:60, borderRadius:60, marginBottom:32 }}></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:28 }}>
            {[1,2,3,4].map(i => <div key={i} className="tm-skeleton" style={{ height:400, borderRadius:28 }}></div>)}
          </div>
        </div>
      </PageWrapper>
    );
  }

  const activeCount    = team.filter(m => m.status === 'Active').length;
  const onLeaveCount   = team.filter(m => m.status === 'On Leave').length;
  const avgPerformance = Math.round(team.reduce((s, m) => s + (m.performance || 0), 0) / (team.length || 1));

  return (
    <PageWrapper pageId="interns" pageLabel="Interns" description="Manage your interns" onNavigate={onNavigate}>
      <div className="tm-premium-container">
        <div className="tm-premium-bg"></div>

        {/* Welcome */}
        <div className="tm-welcome-section">
          <h1 className="tm-welcome-title">
            {greeting.emoji} {greeting.text}, <span style={{ color: '#7C3AED' }}>Admin</span>
          </h1>
          <p className="tm-welcome-subtitle">Here's what's happening with your interns at WellMind Data Solutions</p>
          <div className="tm-date-badge"><Calendar size={14} /> {currentDate}</div>
        </div>

        {/* Stats */}
        <div className="tm-stats-grid">
          <div className="tm-stat-card" onClick={() => setFilterStatus('All')}>
            <div className="tm-stat-icon" style={{ background: '#EDE9FE' }}><Users size={24} color="#7C3AED" /></div>
            <div className="tm-stat-value">{team.length}</div>
            <div className="tm-stat-label">Total Interns</div>
          </div>
          <div className="tm-stat-card" onClick={() => setFilterStatus('Active')}>
            <div className="tm-stat-icon" style={{ background: '#D1FAE5' }}><Check size={24} color="#059669" /></div>
            <div className="tm-stat-value">{activeCount}</div>
            <div className="tm-stat-label">Active</div>
          </div>
          <div className="tm-stat-card" onClick={() => setFilterStatus('On Leave')}>
            <div className="tm-stat-icon" style={{ background: '#FEF3C7' }}><Coffee size={24} color="#D97706" /></div>
            <div className="tm-stat-value">{onLeaveCount}</div>
            <div className="tm-stat-label">On Leave</div>
          </div>
          <div className="tm-stat-card">
            <div className="tm-stat-icon" style={{ background: '#E0F2FE' }}><TrendingUp size={24} color="#0891B2" /></div>
            <div className="tm-stat-value">{avgPerformance}%</div>
            <div className="tm-stat-label">Avg Performance</div>
          </div>
        </div>

        {/* Dept Chips */}
        <div className="tm-dept-stats">
          {deptStats.map(d => {
            const info = DEPT_COLORS[d.dept] || { bg: '#EDE9FE', icon: '🏢' };
            return (
              <div className="tm-dept-chip" key={d.dept} onClick={() => setFilterDept(d.dept)}>
                <div className="tm-dept-icon" style={{ background: info.bg }}>{info.icon}</div>
                <span className="tm-dept-name">{d.dept}</span>
                <span className="tm-dept-count">{d.count}</span>
              </div>
            );
          })}
          {filterDept !== 'All' && (
            <div className="tm-dept-chip" onClick={() => setFilterDept('All')}>
              <div className="tm-dept-icon" style={{ background: '#EDE9FE' }}>❌</div>
              <span className="tm-dept-name">Clear Filter</span>
            </div>
          )}
        </div>

        {/* Filter Bar */}
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
          <button className="tm-btn-submit" onClick={() => setModalOpen(true)} style={{ whiteSpace:'nowrap', flexShrink:0 }}>
            <UserPlus size={16} /> Add Intern
          </button>
        </div>

        {/* Cards */}
        {filteredTeam.length === 0 ? (
          <div className="tm-no-results">
            <Users size={64} strokeWidth={1.5} style={{ color:'#64748B', marginBottom:16, opacity:0.4 }} />
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
                <div className={`tm-emp-card${isOnLeave ? ' tm-on-leave' : ''}`} key={member.id} style={{ animationDelay:`${idx * 0.05}s` }}>
                  <div className="tm-leave-stripe"></div>

                  <div className="tm-card-top">
                    <div className="tm-card-emp-info">
                      <div className="tm-card-avatar" style={{
                        backgroundImage: member.profilePic ? `url(${member.profilePic})` : 'none',
                        backgroundColor: member.profilePic ? 'transparent' : (member.avatarColor || '#7C3AED'),
                        backgroundSize:'cover', backgroundPosition:'center'
                      }}>
                        {!member.profilePic && (member.avatar || (member.name ? member.name.charAt(0).toUpperCase() : 'I'))}
                      </div>
                      <div>
                        <div className="tm-card-name">{member.name}</div>

                        {/* ✅ NEW: Dark block role badge */}
                        <div className="tm-role-block">
                          <span className="tm-role-block-icon">
                            <Briefcase size={10} color="#E9D8FD" />
                          </span>
                          {member.role}
                        </div>

                        <div className="tm-checkin-badge">
                          <Clock size={11} /> {getTodaySchedule(member)}
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
                      <div className="tm-contact-row"><MapPin size={14} /><span>{member.city || 'Remote'}</span></div>
                      <div className="tm-contact-row">
                        <GraduationCap size={14} />
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
                        <div className="tm-perf-bar-fill" style={{ width:`${member.performance || 0}%`, backgroundColor: pc }} />
                      </div>
                      <span className="tm-perf-label" style={{ color: pc }}>
                        {getPerformanceIcon(member.performance || 0)} {getPerformanceLabel(member.performance || 0)}
                      </span>
                    </div>
                  </div>

                  {member.skills?.length > 0 && (
                    <div className="tm-skills-wrap">
                      {member.skills.map(s => <span className="tm-skill-tag" key={s}>{s}</span>)}
                    </div>
                  )}

                  {/* ✅ Simple leave toggle — no days, no confirm popup */}
                  <div className="tm-card-leave-section">
                    <span className={`tm-leave-toggle-label${isOnLeave ? ' tm-active' : ''}`}>
                      <Calendar size={14} />
                      {isOnLeave ? '🌴 Currently On Leave' : 'Mark On Leave'}
                    </span>
                    <label className="tm-leave-toggle">
                      <input type="checkbox" checked={isOnLeave} onChange={() => handleLeaveToggle(member)} />
                      <span className="tm-leave-track"></span>
                      <span className="tm-leave-thumb"></span>
                    </label>
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

        {/* ADD MODAL */}
        {modalOpen && (
          <div className="tm-modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
              <div className="tm-modal-header">
                <div>
                  <div className="tm-modal-title"><UserPlus size={22} />Add New Intern</div>
                  <div className="tm-modal-subtitle">Fill in the details to add a new intern to your team</div>
                </div>
                <button className="tm-modal-close" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              <div className="tm-modal-body">
                <InternForm f={form} upd={updForm} errs={errors} picInputId="pic-add" onPicUpload={e => handlePicUpload(e, updForm)} />
              </div>
              <div className="tm-info-box">
                <div className="tm-info-box-title"><Info size={15} /> Tips</div>
                <ul>
                  <li>Fields marked <b>*</b> are required</li>
                  <li>Toggle each weekday ON/OFF and set individual check-in/out times</li>
                  <li>Use "Copy Monday timing" to quickly apply same hours to all active days</li>
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

        {/* EDIT MODAL */}
        {editModal && (
          <div className="tm-modal-overlay" onClick={() => setEditModal(null)}>
            <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
              <div className="tm-modal-header">
                <div>
                  <div className="tm-modal-title"><Edit2 size={22} />Edit Intern</div>
                  <div className="tm-modal-subtitle">Editing: <strong>{editModal.name}</strong></div>
                </div>
                <button className="tm-modal-close" onClick={() => setEditModal(null)}>✕</button>
              </div>
              <div className="tm-modal-body">
                <InternForm f={editForm} upd={updEditForm} errs={editErrors} picInputId="pic-edit" onPicUpload={e => handlePicUpload(e, updEditForm)} />
              </div>
              <div className="tm-info-box">
                <div className="tm-info-box-title"><Info size={15} /> Note</div>
                <ul>
                  <li>Changes are saved to Firebase immediately</li>
                  <li>Updated schedule reflects in the Attendance page</li>
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

        {/* DELETE CONFIRM */}
        {deleteModal && (
          <div className="tm-delete-overlay" onClick={() => setDeleteModal(null)}>
            <div className="tm-delete-box" onClick={e => e.stopPropagation()}>
              <div className="tm-delete-icon"><Trash2 size={28} color="#DC2626" /></div>
              <div className="tm-delete-title">Remove Intern</div>
              <div className="tm-delete-text">Remove <strong>{deleteModal.name}</strong>? This cannot be undone.</div>
              <div className="tm-delete-actions">
                <button className="tm-delete-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="tm-delete-confirm" onClick={() => handleDelete(deleteModal.id)}>Remove</button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div className={`tm-toast ${toast.type}`}>
            {toast.type === 'success'
              ? <Check size={18} color="#059669" />
              : <AlertCircle size={18} color={toast.type === 'warning' ? '#D97706' : '#DC2626'} />}
            {toast.message}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Interns;