import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageWrapper from '../PageWrapper';
import {
  GraduationCap, Sparkles, TrendingUp, Users, Calendar, Clock, Award,
  Mail, Phone, MapPin, Briefcase, Star, Zap, Heart, Search, Check, AlertCircle,
  Trash2, Edit2, UserPlus, Info, Coffee, Trophy, Building2
} from 'lucide-react';
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

// ============================================================
// WellMind Brand Palette
// #623068 Primary | #331B3F Dark | #47234F Mid
// #8A1C37 Red | #0D7289 Teal | #C0854A Gold
// #F5F0E5 BG | #1A1228 Dark BG | #2D1B38 Text | #F0EAF8 Light
// ============================================================

const COLORS = {
  primary: "#623068",
  primaryDark: "#1A1228",
  primaryMid: "#47234F",
  primaryLight: "#F0EAF8",
  textDark: "#2D1B38",
  textMuted: "#9B6EA0",
  bgPage: "#F5F0E5",
  bgCard: "#FFFFFF",
  success: "#0D7289",
  warning: "#C0854A",
  danger: "#8A1C37",
  teal: "#0D7289",
  border: "rgba(98,48,104,0.1)",
};

const RANKS = ['Junior', 'Mid-Level', 'Senior', 'Elite', 'Legend'];
const EMP_TYPES = ['Full Time', 'Part Time', 'Contractor', 'Freelance'];
const AVATAR_COLORS = ['#623068', '#0D7289', '#8A1C37', '#47234F', '#C0854A', '#331B3F'];
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

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'EM';
const generateId  = () => 'emp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pickColor   = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

const getPerformanceColor = (v) => v >= 90 ? COLORS.teal : v >= 75 ? COLORS.warning : v >= 60 ? COLORS.primary : COLORS.danger;
const getPerformanceLabel = (v) => v >= 90 ? 'Outstanding' : v >= 75 ? 'Excellent' : v >= 60 ? 'Good' : v >= 40 ? 'Average' : 'Needs Improvement';
const getPerformanceIcon  = (v) => v >= 90 ? <Sparkles size={14}/> : v >= 75 ? <Trophy size={14}/> : v >= 60 ? <Star size={14}/> : v >= 40 ? <Zap size={14}/> : <Heart size={14}/>;

const getStatusStyle = (status) => {
  switch (status) {
    case 'Active':   return { bg: '#D1FAE5', color: '#065F46', dot: '#10B981', icon: '✅' };
    case 'On Leave': return { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', icon: '🌴' };
    case 'Inactive': return { bg: '#FEE2E2', color: '#991F1B', dot: '#EF4444', icon: '⭕' };
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

// Normalize old schedule format (lowercase/enabled/checkIn/checkOut) to new format
const normalizeSchedule = (sched) => {
  if (!sched) return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  if (sched['Monday'] !== undefined) {
    const result = {};
    WEEK_DAYS.forEach(d => {
      result[d] = sched[d] ? { ...DEFAULT_SCHEDULE[d], ...sched[d] } : { ...DEFAULT_SCHEDULE[d] };
    });
    return result;
  }
  const mapping = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
  };
  const converted = {};
  WEEK_DAYS.forEach(d => { converted[d] = { ...DEFAULT_SCHEDULE[d] }; });
  Object.entries(mapping).forEach(([oldKey, newKey]) => {
    if (sched[oldKey]) {
      converted[newKey] = {
        active: !!sched[oldKey].enabled,
        inTime: sched[oldKey].checkIn || sched[oldKey].inTime || '09:00',
        outTime: sched[oldKey].checkOut || sched[oldKey].outTime || '17:30',
      };
    }
  });
  return converted;
};

// ─── CSS Styles ─────────────────────────────────────────────────────────────
const styles = `
.tm-premium-container { position: relative; overflow: hidden; font-family: 'Inter', sans-serif; }
.tm-premium-bg { position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 100% 0%, rgba(98,48,104,0.03) 0%, transparent 60%); pointer-events: none; z-index: 0; }

.tm-dept-stats { display: flex; gap: 14px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-dept-chip  { display: inline-flex; align-items: center; gap: 12px; padding: 10px 22px; background: #fff; border: 1px solid rgba(98,48,104,0.1); border-radius: 60px; font-size: 13px; font-weight: 600; color: #9B6EA0; transition: all 0.3s cubic-bezier(0.2,0.9,0.4,1.1); cursor: pointer; }
.tm-dept-chip:hover { border-color: #623068; transform: translateY(-3px) scale(1.02); box-shadow: 0 10px 20px rgba(98,48,104,0.12); background: #fff; }
.tm-dept-chip .tm-dept-icon  { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.tm-dept-chip .tm-dept-name  { font-weight: 800; color: #2D1B38; }
.tm-dept-chip .tm-dept-count { font-weight: 900; color: #623068; background: #F0EAF8; padding: 3px 10px; border-radius: 30px; margin-left: 8px; font-size: 12px; }

.tm-filter-bar  { display: flex; align-items: center; gap: 18px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-search-box  { flex: 1; max-width: 400px; position: relative; }
.tm-search-box input { width: 100%; padding: 13px 18px 13px 48px; font-size: 14px; color: #2D1B38; background: #fff; border: 1.5px solid rgba(98,48,104,0.1); border-radius: 60px; outline: none; transition: all 0.3s ease; font-family: inherit; }
.tm-search-box input:focus { border-color: #623068; box-shadow: 0 0 0 4px rgba(98,48,104,0.1); }
.tm-search-box input::placeholder { color: #9B6EA0; }
.tm-search-box svg { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #623068; opacity: 0.6; }
.tm-filter-tabs { display: flex; gap: 8px; background: rgba(245,240,229,0.8); border-radius: 60px; padding: 5px; border: 1px solid rgba(98,48,104,0.1); }
.tm-filter-tab  { padding: 9px 22px; font-size: 13px; font-weight: 700; color: #9B6EA0; background: none; border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; white-space: nowrap; }
.tm-filter-tab:hover  { color: #2D1B38; background: rgba(98,48,104,0.08); transform: translateY(-1px); }
.tm-filter-tab.active { color: #F0EAF8; background: linear-gradient(135deg,#623068,#0D7289); box-shadow: 0 4px 12px rgba(98,48,104,0.3); }

.tm-cards-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 28px; position: relative; z-index: 1; }
@media (max-width: 768px) {
  .tm-filter-bar { flex-direction: column; align-items: stretch; }
  .tm-search-box { max-width: 100%; }
  .tm-filter-tabs { overflow-x: auto; }
  .tm-cards-grid  { grid-template-columns: 1fr; gap: 20px; }
}

.tm-emp-card { background: #fff; border-radius: 28px; overflow: hidden; transition: all 0.4s cubic-bezier(0.2,0.9,0.4,1.1); position: relative; border: 1px solid rgba(98,48,104,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.02); animation: cardFadeIn 0.5s ease backwards; }
@keyframes cardFadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
.tm-emp-card:hover { box-shadow: 0 25px 45px -12px rgba(98,48,104,0.2); transform: translateY(-6px); border-color: rgba(98,48,104,0.15); }
.tm-emp-card.tm-on-leave { background: #FEFAF5; opacity: 0.82; }
.tm-leave-stripe { position: absolute; top:0; left:0; right:0; height:4px; background: repeating-linear-gradient(90deg,#C0854A 0,#C0854A 10px,#FDE68A 10px,#FDE68A 20px); opacity:0; transition: opacity 0.4s ease; }
.tm-emp-card.tm-on-leave .tm-leave-stripe { opacity:1; }

.tm-card-top  { padding: 24px 24px 0; display: flex; align-items: flex-start; justify-content: space-between; }
.tm-card-emp-info { display: flex; align-items: center; gap: 18px; }
.tm-card-avatar { width:64px; height:64px; border-radius:22px; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900; color:#fff; flex-shrink:0; overflow:hidden; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.tm-emp-card:hover .tm-card-avatar { transform: scale(1.03); }
.tm-card-name { font-size:18px; font-weight:800; color:#2D1B38; letter-spacing:-0.3px; }

.tm-role-block {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
  padding: 5px 14px 5px 8px;
  background: linear-gradient(135deg, #1A1228 0%, #47234F 100%);
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #F0EAF8;
  letter-spacing: 0.2px;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(98,48,104,0.25);
}
.tm-role-block-icon {
  width: 20px;
  height: 20px;
  background: rgba(98,48,104,0.5);
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
.tm-contact-row  { display:flex; align-items:center; gap:12px; font-size:13px; color:#2D1B38; padding:6px 0; transition: transform 0.2s ease; }
.tm-contact-row:hover { transform: translateX(4px); }
.tm-contact-row svg { color:#9B6EA0; flex-shrink:0; }
.tm-contact-row:hover svg { color:#623068; }

.tm-card-divider { height:1px; background: linear-gradient(90deg,transparent,rgba(98,48,104,0.1),rgba(98,48,104,0.1),transparent); margin:0 24px; }
.tm-card-stats   { display:grid; grid-template-columns:1fr 1.2fr; gap:20px; padding:20px 24px; }
.tm-stat-item    { display:flex; flex-direction:column; gap:10px; }
.tm-stat-label   { font-size:11px; font-weight:800; color:#9B6EA0; text-transform:uppercase; letter-spacing:0.08em; display:flex; align-items:center; gap:6px; }
.tm-stat-value   { font-size:26px; font-weight:900; color:#2D1B38; line-height:1; }
.tm-perf-bar-track { height:8px; background:rgba(98,48,104,0.08); border-radius:10px; overflow:hidden; }
.tm-perf-bar-fill  { height:100%; border-radius:10px; transition:width 0.8s ease; position:relative; overflow:hidden; }
.tm-perf-bar-fill::after { content:''; position:absolute; top:0;left:0;right:0;bottom:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation:shimmer 2s infinite; }
@keyframes shimmer { 0%{transform:translateX(-100%);} 100%{transform:translateX(100%);} }
.tm-perf-label   { font-size:11px; font-weight:700; margin-top:6px; display:flex; align-items:center; gap:4px; }

.tm-skills-wrap  { display:flex; flex-wrap:wrap; gap:8px; padding:12px 24px 20px; }
.tm-skill-tag    { padding:5px 12px; background:#F0EAF8; border-radius:30px; font-size:11px; font-weight:700; color:#2D1B38; border:1px solid rgba(98,48,104,0.1); transition:all 0.25s ease; cursor:default; }
.tm-skill-tag:hover { background:#623068; color:#F0EAF8; transform:translateY(-2px); border-color:transparent; }

.tm-checkin-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; background:#F0EAF8; border-radius:30px; font-size:10px; font-weight:800; color:#623068; margin-top:7px; width:fit-content; }

/* Simple Leave Section — no days, no confirm */
.tm-card-leave-section { padding:14px 24px; border-top:1px solid rgba(98,48,104,0.08); display:flex; align-items:center; gap:14px; background:rgba(245,240,229,0.6); }
.tm-leave-toggle-label { font-size:13px; font-weight:800; color:#9B6EA0; display:flex; align-items:center; gap:8px; transition: color 0.2s; }
.tm-leave-toggle-label.tm-active { color:#C0854A; }
.tm-leave-toggle { position:relative; width:52px; height:26px; cursor:pointer; flex-shrink:0; }
.tm-leave-toggle input { opacity:0; width:0; height:0; position:absolute; }
.tm-leave-track  { position:absolute; inset:0; background:#d8c8dc; border-radius:26px; transition:all 0.3s ease; }
.tm-leave-toggle input:checked + .tm-leave-track { background:#C0854A; box-shadow:0 0 8px rgba(192,133,74,0.4); }
.tm-leave-thumb  { position:absolute; top:3px; left:3px; width:20px; height:20px; background:#fff; border-radius:50%; transition:transform 0.3s cubic-bezier(0.2,0.9,0.4,1.1); box-shadow:0 2px 6px rgba(0,0,0,0.2); }
.tm-leave-toggle input:checked ~ .tm-leave-thumb { transform:translateX(26px); }

.tm-card-actions      { display:flex; gap:12px; padding:16px 24px; border-top:1px solid rgba(98,48,104,0.08); background:#fff; }
.tm-card-action-btn   { display:inline-flex; align-items:center; gap:8px; padding:8px 18px; font-size:12px; font-weight:800; color:#2D1B38; background:#F5F0E5; border:none; border-radius:60px; cursor:pointer; transition:all 0.3s ease; font-family:inherit; }
.tm-card-action-btn:hover { transform:translateY(-2px); }
.tm-card-action-btn.tm-action-edit:hover   { background:#F0EAF8; color:#623068; }
.tm-card-action-btn.tm-action-delete:hover { background:#FEE2E2; color:#8A1C37; }

.tm-no-results    { text-align:center; padding:60px 20px; background:#fff; border-radius:32px; border:2px dashed rgba(98,48,104,0.1); }
.tm-no-results h3  { font-size:18px; font-weight:800; color:#623068; margin-bottom:8px; }
.tm-no-results p   { font-size:14px; color:#9B6EA0; }

/* ── Modal ── */
.tm-modal-overlay { position:fixed; inset:0; z-index:900; background:rgba(26,18,40,0.7); backdrop-filter:blur(8px); display:flex; align-items:flex-start; justify-content:center; padding:40px 20px; overflow-y:auto; animation:fadeIn 0.3s ease; }
.tm-modal-box     { background:linear-gradient(135deg,#F5F0E5,#FCFAF5); border-radius:32px; width:780px; max-width:100%; box-shadow:0 40px 80px rgba(26,18,40,0.3); animation:modalIn 0.4s ease-out; border:1px solid rgba(98,48,104,0.15); overflow:hidden; }
@keyframes fadeIn  { from{opacity:0;} to{opacity:1;} }
@keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(20px);} to{opacity:1;transform:scale(1) translateY(0);} }
.tm-modal-header { display:flex; justify-content:space-between; align-items:flex-start; padding:28px 32px 0; }
.tm-modal-title  { font-size:24px; font-weight:900; color:#2D1B38; display:flex; align-items:center; gap:10px; }
.tm-modal-subtitle { font-size:14px; color:#9B6EA0; margin-top:6px; }
.tm-modal-close  { background:rgba(98,48,104,0.1); border:none; width:40px; height:40px; border-radius:60px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#623068; transition:all 0.3s ease; font-size:16px; font-family:inherit; }
.tm-modal-close:hover { background:rgba(98,48,104,0.2); transform:rotate(90deg); }
.tm-modal-body   { padding:24px 32px; }
.tm-modal-footer { padding:0 32px 28px; display:flex; gap:16px; justify-content:flex-end; }

/* ── Form (Section-based, no tabs) ── */
.tm-form-section { margin-bottom: 28px; }
.tm-form-section-title { font-size:15px; font-weight:800; color:#2D1B38; margin-bottom:18px; display:flex; align-items:center; gap:10px; padding-bottom:10px; border-bottom:2px solid rgba(98,48,104,0.1); }
.tm-form-section-title span { font-size:18px; }
.tm-form-grid    { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.tm-form-group   { display:flex; flex-direction:column; }
.tm-form-group.full-width { grid-column: 1 / -1; }
.tm-form-label   { font-size:12px; font-weight:700; color:#2D1B38; margin-bottom:7px; display:flex; align-items:center; gap:5px; }
.tm-form-label .tm-required { color:#8A1C37; }
.tm-form-input, .tm-form-select { width:100%; padding:11px 14px; font-size:13.5px; color:#2D1B38; background:#fff; border:1.5px solid rgba(98,48,104,0.1); border-radius:12px; outline:none; transition:all 0.2s ease; font-family:inherit; box-sizing:border-box; }
.tm-form-input:focus, .tm-form-select:focus { border-color:#623068; box-shadow:0 0 0 3px rgba(98,48,104,0.1); }
.tm-form-input.tm-error { border-color:#8A1C37; background:#FFF5F5; }
.tm-form-error   { font-size:11px; color:#8A1C37; margin-top:5px; font-weight:600; }
.tm-form-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23623068' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 42px; }

.tm-pic-upload-row { display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
.tm-pic-preview { width:80px; height:80px; border-radius:20px; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:#fff; border:2px dashed rgba(98,48,104,0.2); cursor:pointer; transition:all 0.2s ease; flex-shrink:0; }
.tm-pic-preview:hover { border-color:#623068; transform:scale(1.02); }

/* ── Schedule Table ── */
.tm-schedule-table { width:100%; border-radius:16px; overflow:hidden; border:1px solid rgba(98,48,104,0.1); }
.tm-schedule-head  { display:grid; grid-template-columns:130px 1fr 1fr 60px; background:#F0EAF8; padding:10px 16px; font-size:11px; font-weight:800; color:#623068; text-transform:uppercase; letter-spacing:0.06em; }
.tm-schedule-row   { display:grid; grid-template-columns:130px 1fr 1fr 60px; align-items:center; padding:10px 16px; border-top:1px solid rgba(98,48,104,0.08); background:#fff; transition:background 0.2s; }
.tm-schedule-row:hover { background:rgba(245,240,229,0.5); }
.tm-schedule-row.inactive { opacity:0.45; }
.tm-schedule-day   { font-size:13px; font-weight:700; color:#2D1B38; display:flex; align-items:center; gap:8px; }
.tm-schedule-time  { padding:0 8px; }
.tm-schedule-time input { width:100%; padding:7px 10px; font-size:13px; font-family:inherit; color:#2D1B38; background:rgba(245,240,229,0.6); border:1.5px solid rgba(98,48,104,0.12); border-radius:9px; outline:none; transition:all 0.2s; }
.tm-schedule-time input:focus { border-color:#623068; box-shadow:0 0 0 3px rgba(98,48,104,0.1); }
.tm-schedule-time input:disabled { background:#f1f5f9; color:#9B6EA0; cursor:not-allowed; }
.tm-day-toggle { position:relative; width:36px; height:20px; cursor:pointer; margin:auto; }
.tm-day-toggle input { opacity:0; width:0; height:0; position:absolute; }
.tm-day-track  { position:absolute; inset:0; background:#d1d5db; border-radius:20px; transition:all 0.3s ease; }
.tm-day-toggle input:checked + .tm-day-track { background:linear-gradient(135deg,#623068,#0D7289); }
.tm-day-thumb  { position:absolute; top:2px; left:2px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform 0.3s ease; box-shadow:0 1px 4px rgba(0,0,0,0.2); }
.tm-day-toggle input:checked ~ .tm-day-thumb { transform:translateX(16px); }

.tm-copy-schedule-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; font-size:12px; font-weight:700; color:#623068; background:#F0EAF8; border:1px solid rgba(98,48,104,0.2); border-radius:30px; cursor:pointer; transition:all 0.2s; margin-bottom:12px; font-family:inherit; }
.tm-copy-schedule-btn:hover { background:linear-gradient(135deg,#623068,#0D7289); color:#F0EAF8; transform:translateY(-1px); }

.tm-info-box { margin:4px 32px 20px; padding:14px 22px; background:linear-gradient(135deg,rgba(13,114,137,0.06),rgba(13,114,137,0.1)); border-radius:18px; border:1px solid rgba(13,114,137,0.15); }
.tm-info-box-title { font-size:13px; font-weight:800; color:#0D7289; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
.tm-info-box ul    { margin:0; padding-left:18px; font-size:12px; line-height:1.7; color:#0a5a6e; }

.tm-btn-cancel { padding:10px 24px; font-size:14px; font-weight:700; color:#2D1B38; background:#ede4ee; border:none; border-radius:60px; cursor:pointer; transition:all 0.2s ease; font-family:inherit; }
.tm-btn-cancel:hover { background:#d8c8dc; transform:translateY(-1px); }
.tm-btn-submit { padding:10px 28px; font-size:14px; font-weight:800; color:#F0EAF8; background:linear-gradient(135deg,#623068,#0D7289); border:none; border-radius:60px; cursor:pointer; transition:all 0.2s ease; display:inline-flex; align-items:center; gap:8px; box-shadow:0 2px 8px rgba(98,48,104,0.3); font-family:inherit; }
.tm-btn-submit:hover { transform:translateY(-1px); box-shadow:0 6px 14px rgba(98,48,104,0.4); }
.tm-btn-submit:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

.tm-toast { position:fixed; top:24px; right:24px; z-index:1000; padding:14px 24px; border-radius:60px; font-size:14px; font-weight:700; background:#fff; border:1px solid rgba(98,48,104,0.15); box-shadow:0 10px 25px rgba(0,0,0,0.1); display:flex; align-items:center; gap:12px; animation:toastIn 0.4s ease; }
.tm-toast.success { border-left:4px solid #0D7289; }
.tm-toast.error   { border-left:4px solid #8A1C37; }
.tm-toast.warning { border-left:4px solid #C0854A; }
@keyframes toastIn { from{opacity:0;transform:translateX(40px);} to{opacity:1;transform:translateX(0);} }

.tm-delete-overlay { position:fixed; inset:0; z-index:950; background:rgba(26,18,40,0.6); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease; }
.tm-delete-box { background:#fff; border-radius:28px; width:400px; max-width:90vw; padding:32px; box-shadow:0 30px 50px rgba(0,0,0,0.2); text-align:center; border:1px solid rgba(98,48,104,0.1); animation:modalIn 0.3s ease-out; }
.tm-delete-icon { width:60px; height:60px; border-radius:60px; background:#FEE2E2; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
.tm-delete-title { font-size:20px; font-weight:800; color:#2D1B38; margin-bottom:8px; }
.tm-delete-text  { font-size:14px; color:#9B6EA0; margin-bottom:24px; }
.tm-delete-actions { display:flex; gap:12px; }
.tm-delete-actions button { flex:1; padding:10px; font-size:14px; font-weight:700; border-radius:60px; cursor:pointer; border:none; font-family:inherit; }
.tm-delete-cancel  { background:#F5F0E5; color:#2D1B38; }
.tm-delete-cancel:hover { background:#ede4ee; transform:translateY(-1px); }
.tm-delete-confirm { background:linear-gradient(135deg,#8A1C37,#6e1530); color:#F0EAF8; }
.tm-delete-confirm:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(138,28,55,0.3); }

.tm-skeleton { background:linear-gradient(90deg,#E8DEE8 25%,#D8C8DC 50%,#E8DEE8 75%); background-size:200% 100%; border-radius:16px; animation:skeleton 1.5s ease-in-out infinite; }
@keyframes skeleton { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }

@media (max-width: 768px) {
  .tm-form-grid { grid-template-columns: 1fr; }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('emp-tm-styles-v3')) {
  const tag = document.createElement('style');
  tag.id = 'emp-tm-styles-v3';
  tag.textContent = styles;
  document.head.appendChild(tag);
}

// ─── Schedule Editor (Table-style, same as Interns) ────────────────────────
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

// ─── Employee Form (Section-based, same layout as Interns) ─────────────────
const EmployeeForm = ({ f, upd, errs, picInputId, onPicUpload }) => (
  <div>
    {/* Section 1: Personal Information */}
    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>👤</span> Personal Information</div>
      <div className="tm-form-grid">
        <div className="tm-form-group full-width">
          <label className="tm-form-label">Profile Picture</label>
          <div className="tm-pic-upload-row">
            <div className="tm-pic-preview"
              style={{ backgroundColor: f.profilePic ? 'transparent' : COLORS.primary }}
              onClick={() => document.getElementById(picInputId).click()}>
              {f.profilePic
                ? <img src={f.profilePic} alt="profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : getInitials(f.name || 'EM')}
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
              <p style={{ fontSize:10, color:COLORS.textMuted, marginTop:6 }}>JPG / PNG / WEBP — max 700KB</p>
            </div>
          </div>
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Full Name <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.name ? ' tm-error' : ''}`} type="text"
            placeholder="e.g. Ali Hassan" value={f.name || ''}
            onChange={e => upd('name', e.target.value)} />
          {errs.name && <span className="tm-form-error">{errs.name}</span>}
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Email Address <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.email ? ' tm-error' : ''}`} type="email"
            placeholder="e.g. ali@company.com" value={f.email || ''}
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
          <label className="tm-form-label">City / Location</label>
          <input className="tm-form-input" type="text"
            placeholder="e.g. Karachi, Lahore, Remote" value={f.location || ''}
            onChange={e => upd('location', e.target.value)} />
        </div>
      </div>
    </div>

    {/* Section 2: Education */}
    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>🎓</span> Education</div>
      <div className="tm-form-grid">
        <div className="tm-form-group">
          <label className="tm-form-label">Degree / Qualification</label>
          <input className="tm-form-input" type="text"
            placeholder="e.g. BS Computer Science, MBA" value={f.education || ''}
            onChange={e => upd('education', e.target.value)} />
        </div>
        <div className="tm-form-group">
          <label className="tm-form-label">Department of Education</label>
          <input className="tm-form-input" type="text"
            placeholder="e.g. Computer Science, Business Admin" value={f.eduDepartment || ''}
            onChange={e => upd('eduDepartment', e.target.value)} />
        </div>
        <div className="tm-form-group">
          <label className="tm-form-label">Institute / University</label>
          <input className="tm-form-input" type="text"
            placeholder="e.g. FAST NUCES, LUMS, IBA" value={f.institute || ''}
            onChange={e => upd('institute', e.target.value)} />
        </div>
        <div className="tm-form-group">
          <label className="tm-form-label">Graduation Year</label>
          <input className="tm-form-input" type="number" min="1970" max="2030"
            placeholder="e.g. 2021" value={f.gradYear || ''}
            onChange={e => upd('gradYear', e.target.value)} />
        </div>
      </div>
    </div>

    {/* Section 3: Professional Details */}
    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>💼</span> Professional Details</div>
      <div className="tm-form-grid">
        <div className="tm-form-group">
          <label className="tm-form-label">Department <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.department ? ' tm-error' : ''}`} type="text"
            placeholder="e.g. Engineering, Design, HR" value={f.department || ''}
            onChange={e => upd('department', e.target.value)} />
          {errs.department && <span className="tm-form-error">{errs.department}</span>}
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Role / Job Title <span className="tm-required">*</span></label>
          <input className={`tm-form-input${errs.role ? ' tm-error' : ''}`} type="text"
            placeholder="e.g. Senior Developer, UI Designer" value={f.role || ''}
            onChange={e => upd('role', e.target.value)} />
          {errs.role && <span className="tm-form-error">{errs.role}</span>}
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Rank / Level <span className="tm-required">*</span></label>
          <select className={`tm-form-select${errs.rank ? ' tm-error' : ''}`}
            value={f.rank || ''} onChange={e => upd('rank', e.target.value)}>
            <option value="">Select rank...</option>
            {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {errs.rank && <span className="tm-form-error">{errs.rank}</span>}
        </div>

        <div className="tm-form-group">
          <label className="tm-form-label">Employment Type</label>
          <select className="tm-form-select"
            value={f.type || 'Full Time'} onChange={e => upd('type', e.target.value)}>
            {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>

    {/* Section 4: Weekly Schedule */}
    <div className="tm-form-section">
      <div className="tm-form-section-title"><span>🗓️</span> Weekly Schedule</div>
      <ScheduleEditor
        schedule={f.schedule || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))}
        onChange={s => upd('schedule', s)}
      />
    </div>
  </div>
);

// ─── Default Form ──────────────────────────────────────────────────────────
const defaultForm = () => ({
  name: '', email: '', phone: '', location: '',
  education: '', eduDepartment: '', institute: '', gradYear: '',
  department: '', role: '', rank: '', type: 'Full Time',
  profilePic: null,
  schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
});

// ─── Main Employees Component ──────────────────────────────────────────────
const Employees = ({ onNavigate }) => {
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

  const fetchEmployees = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "employees"));
      const list = querySnapshot.docs.map(d => ({
        ...d.data(),
        firestoreId: d.id,
        id: d.data().id || d.id,
        status: d.data().status || 'Active',
        leaveDays: d.data().leaveDays || null,
        projects: d.data().projects || [],
        performance: d.data().performance || Math.floor(Math.random() * 40) + 60,
        skills: d.data().skills || [],
        weeklySchedule: normalizeSchedule(d.data().weeklySchedule || d.data().schedule),
      }));
      setTeam(list);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

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

  // On Leave sorted to end (same as Interns)
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

  // Today's schedule display
  const getTodaySchedule = (member) => {
    if (member.status === 'On Leave') return 'On Leave';
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];
    const sched = member.weeklySchedule?.[today];
    if (!sched || !sched.active) return 'Day Off Today';
    return `${sched.inTime || '09:00'} — ${sched.outTime || '17:30'}`;
  };

  // Simple leave toggle — no days, no confirm modal (same as Interns)
  const handleLeaveToggle = async (member) => {
    const newStatus = member.status === 'On Leave' ? 'Active' : 'On Leave';
    const docId = member.firestoreId || member.id;
    try {
      await updateDoc(doc(db, "employees", docId), { status: newStatus, leaveDays: null });
      setTeam(prev => prev.map(m => (m.firestoreId || m.id) === docId ? { ...m, status: newStatus, leaveDays: null } : m));
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
      phone: form.phone?.trim() || '', location: form.location?.trim() || 'Remote',
      type: form.type, role: form.role, rank: form.rank,
      department: form.department, education: form.education || '',
      eduDepartment: form.eduDepartment || '', institute: form.institute || '',
      gradYear: form.gradYear || '',
      status: 'Active',
      avatar: form.profilePic ? null : getInitials(form.name),
      avatarColor: pickColor(), profilePic: form.profilePic || null,
      projects: [], performance: Math.floor(Math.random() * 40) + 60,
      skills: [], weeklySchedule: form.schedule || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
      leaveDays: null, createdAt: new Date(),
    };
    try {
      await setDoc(doc(db, "employees", newId), data);
      setTeam(prev => [...prev, data]);
      showToast(`${data.name} added successfully! 🎉`, 'success');
      setForm(defaultForm()); setErrors({});
      setModalOpen(false);
    } catch (err) { console.error(err); showToast('Failed to add employee', 'error'); }
    finally { setSubmitting(false); }
  };

  const openEditModal = (member) => {
    setEditForm({
      name: member.name || '', email: member.email || '', phone: member.phone || '',
      location: member.location || '', type: member.type || 'Full Time', role: member.role || '',
      rank: member.rank || '', department: member.department || '',
      education: member.education || '', eduDepartment: member.eduDepartment || '',
      institute: member.institute || '', gradYear: member.gradYear || '',
      profilePic: member.profilePic || null, avatarColor: member.avatarColor || pickColor(),
      schedule: normalizeSchedule(member.weeklySchedule),
    });
    setEditErrors({}); setEditModal(member);
  };

  const handleEditSubmit = async () => {
    if (!validate(editForm, setEditErrors)) return;
    setEditSubmitting(true);
    const updated = {
      name: editForm.name.trim(), email: editForm.email.trim(),
      phone: editForm.phone?.trim() || '', location: editForm.location?.trim() || 'Remote',
      type: editForm.type, role: editForm.role, rank: editForm.rank,
      department: editForm.department, education: editForm.education || '',
      eduDepartment: editForm.eduDepartment || '', institute: editForm.institute || '',
      gradYear: editForm.gradYear || '',
      avatar: editForm.profilePic ? null : getInitials(editForm.name),
      avatarColor: editForm.avatarColor, profilePic: editForm.profilePic || null,
      weeklySchedule: editForm.schedule || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
    };
    const docId = editModal.firestoreId || editModal.id;
    try {
      await updateDoc(doc(db, "employees", docId), updated);
      setTeam(prev => prev.map(m => (m.firestoreId || m.id) === docId ? { ...m, ...updated } : m));
      showToast(`${updated.name} updated successfully!`, 'success');
      setEditModal(null);
    } catch (err) { console.error(err); showToast('Failed to update employee', 'error'); }
    finally { setEditSubmitting(false); }
  };

  const handleDelete = async (id) => {
    const member = team.find(m => (m.firestoreId || m.id) === id);
    const docId = member?.firestoreId || id;
    try {
      await deleteDoc(doc(db, "employees", docId));
      setTeam(prev => prev.filter(m => (m.firestoreId || m.id) !== id));
      showToast(`${member?.name || 'Employee'} removed`, 'error');
      setDeleteModal(null);
    } catch { showToast('Failed to remove', 'error'); }
  };

  if (loading) {
    return (
      <PageWrapper pageId="employees" pageLabel="Employees" description="Manage your employees" onNavigate={onNavigate}>
        <div style={{ padding:'20px' }}>
          <div className="tm-skeleton" style={{ width:'60%', height:40, marginBottom:20, borderRadius:14 }}></div>
          <div className="tm-skeleton" style={{ width:'40%', height:20, marginBottom:30, borderRadius:10 }}></div>
          <div style={{ display:'flex', gap:16, marginBottom:32 }}>
            {[1,2,3,4].map(i => <div key={i} className="tm-skeleton" style={{ flex:1, height:52, borderRadius:60 }}></div>)}
          </div>
          <div className="tm-skeleton" style={{ height:60, borderRadius:60, marginBottom:32 }}></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:28 }}>
            {[1,2,3,4].map(i => <div key={i} className="tm-skeleton" style={{ height:400, borderRadius:28 }}></div>)}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper pageId="employees" pageLabel="Employees" description="Manage your employees" onNavigate={onNavigate}>
      <div className="tm-premium-container">
        <div className="tm-premium-bg"></div>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32, flexWrap:'wrap', gap:16, position:'relative', zIndex:1 }}>
          <div>
            <h3 style={{ fontSize:'24px', fontWeight:900, color:'#2D1B38', marginBottom:6, letterSpacing:'-0.02em' }}>
              🌟 All Employees
            </h3>
            <p style={{ fontSize:'14px', color:'#9B6EA0', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
              <Users size={16} /> {team.length} team members
            </p>
          </div>
          <button className="tm-btn-submit" onClick={() => { setForm(defaultForm()); setErrors({}); setModalOpen(true); }} style={{ whiteSpace:'nowrap', flexShrink:0 }}>
            <UserPlus size={16} /> Add Employee
          </button>
        </div>

        {/* Department Stats */}
        <div className="tm-dept-stats">
          {deptStats.map(d => {
            const info = DEPT_COLORS[d.dept] || { bg: '#F0EAF8', icon: '🏢' };
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
              <div className="tm-dept-icon" style={{ background:'#F0EAF8' }}>❌</div>
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
          <div className="tm-filter-tabs">
            {allDepts.map(dept => (
              <button key={dept} className={`tm-filter-tab${filterDept === dept ? ' active' : ''}`}
                onClick={() => setFilterDept(dept)}>{dept}</button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {filteredTeam.length === 0 ? (
          <div className="tm-no-results">
            <Users size={64} strokeWidth={1.5} style={{ color:'#9B6EA0', marginBottom:16, opacity:0.4 }} />
            <h3>No employees found</h3>
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
                        backgroundColor: member.profilePic ? 'transparent' : (member.avatarColor || '#623068'),
                        backgroundSize:'cover', backgroundPosition:'center'
                      }}>
                        {!member.profilePic && (member.avatar || (member.name ? member.name.charAt(0).toUpperCase() : 'E'))}
                      </div>
                      <div>
                        <div className="tm-card-name">{member.name}</div>

                        <div className="tm-role-block">
                          <span className="tm-role-block-icon">
                            <Briefcase size={10} color="#F0EAF8" />
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
                      <div className="tm-contact-row"><MapPin size={14} /><span>{member.location || 'Remote'}</span></div>
                      <div className="tm-contact-row">
                        <GraduationCap size={14} />
                        <span>
                          {member.education
                            ? `${member.education}${member.eduDepartment ? ` — ${member.eduDepartment}` : ''}${member.institute ? `, ${member.institute}` : ''}`
                            : '—'}
                        </span>
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

                  {/* Simple leave toggle — same as Interns */}
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

        {/* ─── ADD MODAL ─── */}
        {modalOpen && (
          <div className="tm-modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
              <div className="tm-modal-header">
                <div>
                  <div className="tm-modal-title"><UserPlus size={22} />Add New Employee</div>
                  <div className="tm-modal-subtitle">Fill in the details to add a new employee to your team</div>
                </div>
                <button className="tm-modal-close" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              <div className="tm-modal-body">
                <EmployeeForm f={form} upd={updForm} errs={errors} picInputId="pic-add" onPicUpload={e => handlePicUpload(e, updForm)} />
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
                  {submitting ? 'Adding...' : <><Sparkles size={16} /> Add Employee</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── EDIT MODAL ─── */}
        {editModal && (
          <div className="tm-modal-overlay" onClick={() => setEditModal(null)}>
            <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
              <div className="tm-modal-header">
                <div>
                  <div className="tm-modal-title"><Edit2 size={22} />Edit Employee</div>
                  <div className="tm-modal-subtitle">Editing: <strong>{editModal.name}</strong></div>
                </div>
                <button className="tm-modal-close" onClick={() => setEditModal(null)}>✕</button>
              </div>
              <div className="tm-modal-body">
                <EmployeeForm f={editForm} upd={updEditForm} errs={editErrors} picInputId="pic-edit" onPicUpload={e => handlePicUpload(e, updEditForm)} />
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

        {/* ─── DELETE CONFIRM ─── */}
        {deleteModal && (
          <div className="tm-delete-overlay" onClick={() => setDeleteModal(null)}>
            <div className="tm-delete-box" onClick={e => e.stopPropagation()}>
              <div className="tm-delete-icon"><Trash2 size={28} color="#8A1C37" /></div>
              <div className="tm-delete-title">Remove Employee</div>
              <div className="tm-delete-text">Remove <strong>{deleteModal.name}</strong>? This cannot be undone.</div>
              <div className="tm-delete-actions">
                <button className="tm-delete-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="tm-delete-confirm" onClick={() => handleDelete(deleteModal.firestoreId || deleteModal.id)}>Remove</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`tm-toast ${toast.type}`}>
            {toast.type === 'success'
              ? <Check size={18} color="#0D7289" />
              : <AlertCircle size={18} color={toast.type === 'warning' ? '#C0854A' : '#8A1C37'} />}
            {toast.message}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Employees;