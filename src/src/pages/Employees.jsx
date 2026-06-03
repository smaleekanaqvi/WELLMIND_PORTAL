import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageWrapper from '../PageWrapper';
import { GraduationCap, Sparkles, TrendingUp, Users, Building2, Calendar, Clock, Award, Mail, Phone, MapPin, Briefcase, Star, Zap, Heart } from 'lucide-react';
import { db } from "../firebase"; 
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

// ============================================================
// Enhanced WellMind Brand Palette
// #623068 Primary | #331B3F Dark | #47234F Mid
// #8A1C37 Red | #0D7289 Teal | #C0854A Gold
// #F5F0E5 BG | #1A1228 Dark BG | #2D1B38 Text | #F0EAF8 Light
// ============================================================

const RANKS = ['Junior', 'Mid-Level', 'Senior', 'Elite', 'Legend'];
const EMP_TYPES = ['Full Time', 'Part Time', 'Contractor', 'Freelance'];
const AVATAR_COLORS = ['#623068', '#0D7289', '#8A1C37', '#47234F', '#C0854A', '#331B3F', '#623068', '#0D7289', '#8A1C37', '#47234F'];

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TM';
const generateId = () => 'emp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pickColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

const getPerformanceColor = (val) => {
    if (val >= 90) return '#0D7289';
    if (val >= 75) return '#C0854A';
    if (val >= 60) return '#8A1C37';
    return '#623068';
};

const getPerformanceLabel = (val) => {
    if (val >= 90) return 'Excellent';
    if (val >= 75) return 'Good';
    if (val >= 60) return 'Average';
    return 'Needs Improvement';
};

const getPerformanceIcon = (val) => {
    if (val >= 90) return <Sparkles size={14} />;
    if (val >= 75) return <TrendingUp size={14} />;
    if (val >= 60) return <Zap size={14} />;
    return <Heart size={14} />;
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'Active':   return { bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', color: '#065F46', dot: '#10B981', glow: 'rgba(16,185,129,0.2)' };
        case 'On Leave': return { bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', color: '#92400E', dot: '#F59E0B', glow: 'rgba(245,158,11,0.2)' };
        case 'Inactive': return { bg: 'linear-gradient(135deg, #FEE2E2, #FECACA)', color: '#991F1B', dot: '#EF4444', glow: 'rgba(239,68,68,0.2)' };
        default:         return { bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', color: '#5B21B6', dot: '#8B5CF6', glow: 'rgba(139,92,246,0.2)' };
    }
};

const svgBase = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Icon = ({ type, size = 20, color }) => {
    const p = { ...svgBase, width: size, height: size, style: color ? { color } : undefined };
    switch (type) {
        case 'search': return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
        case 'plus': return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
        case 'close': return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
        case 'mail': return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
        case 'phone': return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
        case 'folder': return <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
        case 'clock': return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
        case 'alert': return <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
        case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
        case 'building': return <svg {...p}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
        case 'award': return <svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
        case 'edit': return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
        case 'trash': return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
        case 'info': return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
        case 'leave': return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;
        case 'calendar-off': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
        case 'trending-up': return <svg {...p}><polyline points="23 6 13.5 15.5 8 10 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
        case 'users': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
        default: return null;
    }
};

const DEPT_COLORS = {
    Engineering: { bg: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)', color: '#0369A1', icon: '#0284C7' },
    Design:      { bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', color: '#5B21B6', icon: '#7C3AED' },
    Marketing:   { bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', color: '#92400E', icon: '#F59E0B' },
    QA:          { bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', color: '#065F46', icon: '#10B981' },
    DevOps:      { bg: 'linear-gradient(135deg, #FEE2E2, #FECACA)', color: '#991F1B', icon: '#EF4444' },
    HR:          { bg: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)', color: '#6B21A5', icon: '#9333EA' },
    Finance:     { bg: 'linear-gradient(135deg, #FFE4E6, #FECDD3)', color: '#9F1239', icon: '#E11D48' },
};

// ─── Enhanced Premium CSS Styles ──────────────────────────────────────────────
const styles = `
.tm-premium-container {
  position: relative;
  overflow: hidden;
}

.tm-premium-bg {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 100% 0%, rgba(98,48,104,0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.tm-dept-stats { display: flex; gap: 14px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-dept-chip { display: inline-flex; align-items: center; gap: 12px; padding: 12px 24px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border: 1px solid rgba(98,48,104,0.15); border-radius: 60px; font-size: 13px; font-weight: 500; color: #47234F; transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1); cursor: default; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.tm-dept-chip:hover { border-color: #623068; transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 24px rgba(98,48,104,0.15); background: #ffffff; }
.tm-dept-chip .tm-dept-icon { width: 38px; height: 38px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s ease; }
.tm-dept-chip:hover .tm-dept-icon { transform: scale(1.05) rotate(5deg); }
.tm-dept-chip .tm-dept-name { font-weight: 800; color: #2D1B38; }
.tm-dept-chip .tm-dept-count { font-weight: 900; color: #623068; background: linear-gradient(135deg, #EDE9FE, #DDD6FE); padding: 3px 10px; border-radius: 30px; margin-left: 6px; font-size: 12px; }

.tm-filter-bar { display: flex; align-items: center; gap: 18px; margin-bottom: 32px; flex-wrap: wrap; }
.tm-search-box { flex: 1; max-width: 400px; position: relative; }
.tm-search-box input { width: 100%; padding: 13px 18px 13px 48px; font-size: 14px; color: #2D1B38; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border: 2px solid rgba(98,48,104,0.15); border-radius: 60px; outline: none; transition: all 0.3s ease; font-family: inherit; }
.tm-search-box input:focus { border-color: #0D7289; box-shadow: 0 0 0 4px rgba(13,114,137,0.12), 0 4px 12px rgba(0,0,0,0.05); background: #ffffff; }
.tm-search-box input::placeholder { color: #9B6EA0; }
.tm-search-box svg { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #623068; pointer-events: none; opacity: 0.7; transition: opacity 0.3s ease; }
.tm-search-box:focus-within svg { opacity: 1; }
.tm-filter-tabs { display: flex; gap: 8px; background: rgba(245,240,229,0.8); backdrop-filter: blur(10px); border-radius: 60px; padding: 5px; }
.tm-filter-tab { padding: 9px 22px; font-size: 13px; font-weight: 700; color: #47234F; background: none; border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1); font-family: inherit; white-space: nowrap; }
.tm-filter-tab:hover { color: #2D1B38; background: rgba(98,48,104,0.08); transform: translateY(-1px); }
.tm-filter-tab.active { color: #F0EAF8; background: linear-gradient(135deg, #623068 0%, #0D7289 100%); box-shadow: 0 4px 12px rgba(98,48,104,0.3); transform: scale(1.02); }

.tm-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 28px; position: relative; z-index: 1; }
.tm-emp-card { background: rgba(255,255,255,0.98); backdrop-filter: blur(10px); border-radius: 28px; overflow: hidden; transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1); position: relative; border: 1px solid rgba(98,48,104,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.04); animation: cardFadeIn 0.5s ease backwards; }
@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.tm-emp-card:nth-child(1) { animation-delay: 0.05s; }
.tm-emp-card:nth-child(2) { animation-delay: 0.1s; }
.tm-emp-card:nth-child(3) { animation-delay: 0.15s; }
.tm-emp-card:nth-child(4) { animation-delay: 0.2s; }
.tm-emp-card:hover { box-shadow: 0 25px 45px -12px rgba(98,48,104,0.25); transform: translateY(-8px) scale(1.01); border-color: rgba(98,48,104,0.2); }
.tm-emp-card.tm-on-leave { background: linear-gradient(135deg, rgba(254,243,199,0.2), rgba(253,230,138,0.1)); }
.tm-leave-stripe { position: absolute; top: 0; left: 0; right: 0; height: 5px; background: repeating-linear-gradient(90deg, #C0854A 0px, #C0854A 10px, #FDE68A 10px, #FDE68A 20px); opacity: 0; transition: opacity 0.4s ease; }
.tm-emp-card.tm-on-leave .tm-leave-stripe { opacity: 1; }
.tm-card-top { padding: 24px 24px 0; display: flex; align-items: flex-start; justify-content: space-between; }
.tm-card-emp-info { display: flex; align-items: center; gap: 18px; }
.tm-card-avatar { width: 64px; height: 64px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #F0EAF8; flex-shrink: 0; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(0,0,0,0.1); position: relative; }
.tm-emp-card:hover .tm-card-avatar { transform: scale(1.05) rotate(3deg); }
.tm-card-avatar::after { content: ''; position: absolute; inset: 0; border-radius: 22px; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.3); pointer-events: none; }
.tm-card-name-wrap { display: flex; flex-direction: column; }
.tm-card-name { font-size: 18px; font-weight: 900; color: #2D1B38; letter-spacing: -0.3px; background: linear-gradient(135deg, #2D1B38, #623068); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tm-card-role { font-size: 12px; color: #0D7289; margin-top: 5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.tm-status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 60px; font-size: 11px; font-weight: 800; white-space: nowrap; backdrop-filter: blur(4px); transition: all 0.3s ease; }
.tm-status-dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); } }

.tm-card-body { padding: 20px 24px; }
.tm-card-contact { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.tm-contact-row { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #47234F; padding: 6px 0; transition: transform 0.2s ease; }
.tm-contact-row:hover { transform: translateX(4px); }
.tm-contact-row svg { color: #9B6EA0; flex-shrink: 0; transition: color 0.2s ease; }
.tm-contact-row:hover svg { color: #0D7289; }
.tm-contact-row span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }

.tm-card-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(98,48,104,0.15), rgba(13,114,137,0.15), rgba(98,48,104,0.15), transparent); margin: 0 24px; }

.tm-card-stats { display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; padding: 20px 24px; }
.tm-stat-item { display: flex; flex-direction: column; gap: 10px; }
.tm-stat-label { font-size: 11px; font-weight: 800; color: #9B6EA0; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px; }
.tm-stat-value { font-size: 26px; font-weight: 900; color: #2D1B38; line-height: 1.1; transition: all 0.3s ease; }
.tm-perf-bar-track { height: 8px; background: rgba(98,48,104,0.08); border-radius: 10px; overflow: hidden; }
.tm-perf-bar-fill { height: 100%; border-radius: 10px; transition: width 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1); position: relative; overflow: hidden; }
.tm-perf-bar-fill::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite; }
@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.tm-perf-label { font-size: 11px; font-weight: 800; margin-top: 6px; display: flex; align-items: center; gap: 4px; }

.tm-skills-wrap { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px 24px 20px; }
.tm-skill-tag { padding: 6px 14px; background: linear-gradient(135deg, #F5F0E5, #EDE9FE); border-radius: 30px; font-size: 11px; font-weight: 700; color: #47234F; border: 1px solid rgba(98,48,104,0.12); transition: all 0.25s ease; cursor: default; }
.tm-skill-tag:hover { background: linear-gradient(135deg, #623068, #0D7289); color: #F0EAF8; transform: translateY(-2px) scale(1.05); border-color: transparent; }

.tm-card-leave-section { padding: 14px 24px; border-top: 1px solid rgba(98,48,104,0.08); display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, rgba(254,243,199,0.3), rgba(253,230,138,0.1)); }
.tm-leave-toggle-wrap { display: flex; align-items: center; gap: 14px; }
.tm-leave-toggle-label { font-size: 13px; font-weight: 800; color: #47234F; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; }
.tm-leave-toggle-label.tm-active { color: #C0854A; }
.tm-leave-toggle { position: relative; width: 52px; height: 26px; cursor: pointer; flex-shrink: 0; }
.tm-leave-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.tm-leave-track { position: absolute; inset: 0; background: #d8c8dc; border-radius: 26px; transition: all 0.3s ease; }
.tm-leave-toggle input:checked + .tm-leave-track { background: #C0854A; box-shadow: 0 0 8px rgba(192,133,74,0.5); }
.tm-leave-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #ffffff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.tm-leave-toggle input:checked ~ .tm-leave-thumb { transform: translateX(26px); }
.tm-leave-duration { font-size: 12px; font-weight: 800; color: #C0854A; background: linear-gradient(135deg, #FEF3C7, #FDE68A); border: 1px solid rgba(192,133,74,0.4); border-radius: 40px; padding: 5px 14px; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; }

.tm-card-actions { display: flex; gap: 14px; padding: 18px 24px; border-top: 1px solid rgba(98,48,104,0.08); background: rgba(252,250,245,0.8); }
.tm-card-action-btn { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 12px; font-weight: 800; color: #47234F; background: rgba(245,240,229,0.9); border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1); font-family: inherit; }
.tm-card-action-btn:hover { transform: translateY(-2px) scale(1.02); }
.tm-card-action-btn.tm-action-edit:hover { background: linear-gradient(135deg, #E0F2FE, #BAE6FD); color: #0369A1; box-shadow: 0 6px 14px rgba(13,114,137,0.2); }
.tm-card-action-btn.tm-action-delete:hover { background: linear-gradient(135deg, #FEE2E2, #FECACA); color: #991F1B; box-shadow: 0 6px 14px rgba(138,28,55,0.15); }

.tm-checkin-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: linear-gradient(135deg, #E0F2FE, #BAE6FD); border-radius: 30px; font-size: 10px; font-weight: 800; color: #0369A1; margin-top: 8px; width: fit-content; transition: all 0.2s ease; }

.tm-no-results { text-align: center; padding: 80px 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 32px; border: 2px dashed rgba(98,48,104,0.2); }
.tm-no-results svg { color: #d8c8dc; margin-bottom: 20px; opacity: 0.6; }
.tm-no-results h3 { font-size: 20px; font-weight: 900; color: #623068; margin-bottom: 10px; }
.tm-no-results p { font-size: 14px; color: #9B6EA0; }

/* Modal Styles */
.tm-modal-overlay { position: fixed; inset: 0; z-index: 900; background: rgba(26,18,40,0.75); backdrop-filter: blur(12px); display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; animation: tmFadeIn 0.3s ease; }
.tm-modal-box { background: linear-gradient(135deg, #F5F0E5, #FCFAF5); border-radius: 32px; width: 720px; max-width: 100%; box-shadow: 0 40px 80px rgba(26,18,40,0.4); animation: tmModalIn 0.4s ease-out; border: 1px solid rgba(98,48,104,0.2); overflow: hidden; }
@keyframes tmFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes tmModalIn { from { opacity: 0; transform: scale(0.96) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.tm-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 32px 32px 0; }
.tm-modal-title { font-size: 26px; font-weight: 900; color: #2D1B38; letter-spacing: -0.4px; background: linear-gradient(135deg, #2D1B38, #623068); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tm-modal-subtitle { font-size: 14px; color: #9B6EA0; margin-top: 8px; font-weight: 500; }
.tm-modal-close { background: rgba(98,48,104,0.1); border: none; width: 44px; height: 44px; border-radius: 60px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #623068; transition: all 0.3s ease; flex-shrink: 0; }
.tm-modal-close:hover { background: rgba(98,48,104,0.2); transform: rotate(90deg) scale(1.05); }
.tm-modal-body { padding: 28px 32px; }
.tm-form-section-title { font-size: 18px; font-weight: 900; color: #2D1B38; margin-bottom: 28px; display: flex; align-items: center; gap: 14px; }
.tm-form-section-title::after { content: ''; flex: 1; height: 3px; background: linear-gradient(90deg, #623068 0%, #0D7289 50%, #C0854A 100%); border-radius: 3px; }
.tm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
.tm-form-group { display: flex; flex-direction: column; }
.tm-form-label { font-size: 13px; font-weight: 800; color: #47234F; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.tm-form-label .tm-required { color: #8A1C37; font-size: 14px; }
.tm-form-input, .tm-form-select { width: 100%; padding: 13px 18px; font-size: 14px; color: #2D1B38; background: #ffffff; border: 2px solid rgba(98,48,104,0.12); border-radius: 16px; outline: none; transition: all 0.3s ease; font-family: inherit; box-sizing: border-box; }
.tm-form-input:focus, .tm-form-select:focus { border-color: #0D7289; box-shadow: 0 0 0 4px rgba(13,114,137,0.1); background: #ffffff; transform: translateY(-1px); }
.tm-form-input.tm-error, .tm-form-select.tm-error { border-color: #8A1C37; background: #FFF5F5; }
.tm-form-error { font-size: 11px; color: #8A1C37; margin-top: 6px; font-weight: 700; }
.tm-form-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23623068' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 18px center; padding-right: 44px; }

.tm-pic-upload-wrap { grid-column: 1 / -1; margin-bottom: 6px; }
.tm-pic-preview { width: 88px; height: 88px; border-radius: 24px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #F0EAF8; border: 3px dashed rgba(98,48,104,0.3); cursor: pointer; flex-shrink: 0; transition: all 0.3s ease; background: linear-gradient(135deg, #F5F0E5, #EDE9FE); }
.tm-pic-preview:hover { border-color: #623068; transform: scale(1.03); background: #EDE9FE; }

.tm-info-box { margin: 20px 32px 0; padding: 18px 26px; background: linear-gradient(135deg, rgba(13,114,137,0.06) 0%, rgba(13,114,137,0.12) 100%); border: 1px solid rgba(13,114,137,0.2); border-radius: 24px; }
.tm-info-box-title { font-size: 14px; font-weight: 900; color: #0D7289; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
.tm-info-box ul { margin: 0; padding-left: 22px; font-size: 13px; line-height: 1.8; color: #0a5a6e; font-weight: 500; }

.tm-modal-footer { padding: 0 32px 32px; display: flex; gap: 18px; justify-content: flex-end; }
.tm-btn-cancel { padding: 12px 30px; font-size: 14px; font-weight: 800; color: #47234F; background: #ede4ee; border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.tm-btn-cancel:hover { background: #d8c8dc; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.tm-btn-submit { padding: 12px 36px; font-size: 14px; font-weight: 800; color: #F0EAF8; background: linear-gradient(135deg, #623068 0%, #0D7289 100%); border: none; border-radius: 60px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 4px 15px rgba(98,48,104,0.4); }
.tm-btn-submit:hover { background: linear-gradient(135deg, #47234F 0%, #0a5a6e 100%); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(98,48,104,0.5); }
.tm-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.tm-toast { position: fixed; top: 24px; right: 24px; z-index: 1000; padding: 16px 28px; border-radius: 60px; font-size: 14px; font-weight: 700; background: rgba(255,255,255,0.98); backdrop-filter: blur(10px); border: 1px solid rgba(98,48,104,0.2); box-shadow: 0 15px 35px rgba(26,18,40,0.2); display: flex; align-items: center; gap: 14px; animation: tmToastIn 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
.tm-toast.success { border-left: 5px solid #0D7289; }
.tm-toast.error   { border-left: 5px solid #8A1C37; }
.tm-toast.warning { border-left: 5px solid #C0854A; }
@keyframes tmToastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }

/* Delete & Leave Confirm Modals */
.tm-delete-overlay, .tm-leave-confirm-overlay { position: fixed; inset: 0; z-index: 950; background: rgba(26,18,40,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; animation: tmFadeIn 0.2s ease; }
.tm-delete-box, .tm-leave-confirm-box { background: linear-gradient(135deg, #F5F0E5, #FCFAF5); border-radius: 32px; width: 440px; max-width: 90vw; padding: 36px; box-shadow: 0 40px 70px rgba(26,18,40,0.4); animation: tmModalIn 0.3s ease-out; text-align: center; border: 1px solid rgba(98,48,104,0.15); }
.tm-delete-icon, .tm-leave-confirm-icon { width: 70px; height: 70px; border-radius: 60px; background: linear-gradient(135deg, #FEE2E2, #FECACA); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; animation: pulse 1s infinite; }
.tm-delete-title, .tm-leave-confirm-title { font-size: 22px; font-weight: 900; color: #2D1B38; margin-bottom: 10px; }
.tm-delete-text, .tm-leave-confirm-text { font-size: 14px; color: #47234F; margin-bottom: 30px; line-height: 1.6; }
.tm-delete-actions, .tm-leave-confirm-actions { display: flex; gap: 16px; }
.tm-delete-actions button, .tm-leave-confirm-actions button { flex: 1; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 60px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; border: none; }
.tm-delete-cancel, .tm-leave-confirm-cancel { background: #ede4ee; color: #47234F; }
.tm-delete-cancel:hover, .tm-leave-confirm-cancel:hover { background: #d8c8dc; transform: translateY(-2px); }
.tm-delete-confirm { background: linear-gradient(135deg, #8A1C37, #6e1530); color: #F0EAF8; }
.tm-delete-confirm:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(138,28,55,0.3); }
.tm-leave-confirm-approve { background: linear-gradient(135deg, #C0854A, #a36b38); color: #F0EAF8; }
.tm-leave-confirm-approve:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(192,133,74,0.3); }

.tm-leave-days-group { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; justify-content: center; }
.tm-leave-days-group label { font-size: 14px; font-weight: 800; color: #47234F; }
.tm-leave-days-input { width: 100px; padding: 12px 16px; font-size: 18px; font-weight: 900; text-align: center; color: #C0854A; background: linear-gradient(135deg, #FEF3C7, #FDE68A); border: 2px solid rgba(192,133,74,0.5); border-radius: 16px; outline: none; font-family: inherit; }
.tm-leave-days-input:focus { border-color: #C0854A; box-shadow: 0 0 0 4px rgba(192,133,74,0.15); }

.tm-skeleton { background: linear-gradient(90deg, #E8DEE8 25%, #D8C8DC 50%, #E8DEE8 75%); background-size: 200% 100%; border-radius: 16px; animation: tmSkelPulse 1.5s ease-in-out infinite; }
@keyframes tmSkelPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 768px) {
    .tm-filter-bar { flex-direction: column; align-items: stretch; }
    .tm-search-box { max-width: 100%; }
    .tm-filter-tabs { overflow-x: auto; justify-content: flex-start; }
    .tm-cards-grid { grid-template-columns: 1fr; gap: 20px; }
    .tm-form-grid { grid-template-columns: 1fr; }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('emp-tm-styles-premium')) {
    const tag = document.createElement('style');
    tag.id = 'emp-tm-styles-premium';
    tag.textContent = styles;
    document.head.appendChild(tag);
}

const Employees = ({ onNavigate }) => {
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
        name: '', email: '', phone: '', type: 'Employee', role: '', rank: '',
        department: '', location: '', checkInTime: '09:00', checkOutTime: '17:30',
        education: '', institute: '', profilePic: null
    });
    const [editForm, setEditForm] = useState({});
    const [errors, setErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
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
                skills: d.data().skills || ['React', 'Node.js', 'Python'].slice(0, Math.floor(Math.random() * 3) + 1)
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
        const docId = member.firestoreId || member.id;
        if (member.status === 'On Leave') {
            try {
                await updateDoc(doc(db, "employees", docId), { status: 'Active', leaveDays: null });
                setTeam(prev => prev.map(m => (m.firestoreId || m.id) === docId ? { ...m, status: 'Active', leaveDays: null } : m));
                showToast(`${member.name} is back — marked as Active`, 'success');
            } catch (e) {
                console.error(e);
                showToast('Failed to update status', 'error');
            }
        } else {
            setLeaveModal(member);
            setLeaveDays(1);
        }
    };

    const confirmLeave = async () => {
        if (!leaveModal) return;
        const docId = leaveModal.firestoreId || leaveModal.id;
        const days = Math.max(1, parseInt(leaveDays) || 1);
        try {
            await updateDoc(doc(db, "employees", docId), { status: 'On Leave', leaveDays: days });
            setTeam(prev => prev.map(m => (m.firestoreId || m.id) === docId ? { ...m, status: 'On Leave', leaveDays: days } : m));
            showToast(`${leaveModal.name} marked on leave for ${days} day${days > 1 ? 's' : ''}`, 'warning');
            setLeaveModal(null);
        } catch (e) {
            console.error(e);
            showToast('Failed to approve leave', 'error');
        }
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
        if (!f.name || !f.name.trim()) e.name = 'Full name is required';
        if (!f.email || !f.email.trim()) e.email = 'Email is required';
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
            name: '', email: '', phone: '', type: 'Employee', role: '', rank: '',
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
            type: member.type || 'Employee',
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
            await setDoc(doc(db, "employees", newId), memberData);
            setTeam(prev => [...prev, memberData]);
            showToast(`${memberData.name} added to team`, 'success');
            resetForm();
            setModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to add employee', 'error');
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
        const docId = editModal.firestoreId || editModal.id;
        try {
            await updateDoc(doc(db, "employees", docId), updatedData);
            setTeam(prev => prev.map(m => (m.firestoreId || m.id) === docId ? { ...m, ...updatedData } : m));
            showToast(`${updatedData.name} updated successfully`, 'success');
            setEditModal(null);
        } catch (error) {
            console.error("Failed to update employee:", error);
            showToast('Failed to update employee', 'error');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const member = team.find(m => (m.firestoreId || m.id) === id);
        const docId = member?.firestoreId || id;
        try {
            await deleteDoc(doc(db, "employees", docId));
            setTeam(prev => prev.filter(m => (m.firestoreId || m.id) !== id));
            showToast(`${member?.name || 'Employee'} removed`, 'error');
            setDeleteModal(null);
        } catch (error) {
            console.error(error);
            showToast('Failed to remove employee', 'error');
        }
    };

    const renderFormFields = (f, upd, errs, picInputId, onPicUpload) => (
        <div className="tm-form-grid">
            <div className="tm-pic-upload-wrap">
                <label className="tm-form-label">Profile Picture</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div
                        className="tm-pic-preview"
                        style={{ backgroundColor: (f.profilePic && f.profilePic !== 'null') ? 'transparent' : '#623068' }}
                        onClick={() => document.getElementById(picInputId).click()}
                    >
                        {(f.profilePic && f.profilePic !== 'null')
                            ? <img src={f.profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : getInitials(f.name || 'TM')
                        }
                    </div>
                    <div>
                        <input id={picInputId} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPicUpload} />
                        <button type="button" className="tm-btn-cancel" style={{ fontSize: 13, padding: '9px 20px' }}
                            onClick={() => document.getElementById(picInputId).click()}>
                            📁 Upload Photo
                        </button>
                        {(f.profilePic && f.profilePic !== 'null') && (
                            <button type="button" className="tm-card-action-btn tm-action-delete"
                                style={{ fontSize: 13, padding: '9px 18px', marginLeft: 12 }}
                                onClick={() => upd('profilePic', null)}>
                                Remove
                            </button>
                        )}
                        <p style={{ fontSize: 11, color: '#9B6EA0', marginTop: 10 }}>JPG, PNG, WEBP — max 700KB</p>
                    </div>
                </div>
            </div>

            <div className="tm-form-group">
                <label className="tm-form-label">Full Name <span className="tm-required">*</span></label>
                <input className={`tm-form-input${errs.name ? ' tm-error' : ''}`} type="text" placeholder="e.g. Ali Hassan"
                    value={f.name || ''} onChange={e => upd('name', e.target.value)} />
                {errs.name && <span className="tm-form-error">{errs.name}</span>}
            </div>

            <div className="tm-form-group">
                <label className="tm-form-label">Email Address <span className="tm-required">*</span></label>
                <input className={`tm-form-input${errs.email ? ' tm-error' : ''}`} type="email" placeholder="e.g. ali@company.com"
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
                <label className="tm-form-label">Institute Name</label>
                <input className="tm-form-input" type="text" placeholder="e.g. FAST NUCES"
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
                    placeholder="Enter department name..."
                    value={f.department || ''}
                    onChange={e => upd('department', e.target.value)} />
                {errs.department && <span className="tm-form-error">{errs.department}</span>}
            </div>

            <div className="tm-form-group">
                <label className="tm-form-label">Employee Type</label>
                <select className="tm-form-select" value={f.type || 'Employee'} onChange={e => upd('type', e.target.value)}>
                    {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="tm-form-group">
                <label className="tm-form-label">Role <span className="tm-required">*</span></label>
                <input type="text" placeholder="Enter role (e.g. Developer, Designer)"
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={16} color="#9B6EA0" />
                    <input className={`tm-form-input${errs.checkInTime ? ' tm-error' : ''}`} type="time"
                        value={f.checkInTime || '09:00'} onChange={e => upd('checkInTime', e.target.value)} />
                </div>
                {errs.checkInTime && <span className="tm-form-error">{errs.checkInTime}</span>}
            </div>

            <div className="tm-form-group">
                <label className="tm-form-label">Check-out Time <span className="tm-required">*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={16} color="#9B6EA0" />
                    <input className={`tm-form-input${errs.checkOutTime ? ' tm-error' : ''}`} type="time"
                        value={f.checkOutTime || '17:30'} onChange={e => upd('checkOutTime', e.target.value)} />
                </div>
                {errs.checkOutTime && <span className="tm-form-error">{errs.checkOutTime}</span>}
            </div>
        </div>
    );

    if (loading) {
        return (
            <PageWrapper pageId="employees" pageLabel="Employees" description="Manage your employees" onNavigate={onNavigate}>
                <div style={{ padding: '0 0 24px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div><div className="tm-skeleton" style={{ width: 160, height: 32, borderRadius: 14 }}></div><div className="tm-skeleton" style={{ width: 260, height: 18, marginTop: 10, borderRadius: 10 }}></div></div>
                        <div className="tm-skeleton" style={{ width: 200, height: 48, borderRadius: 60 }}></div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>{[1,2,3,4].map(i => <div key={i} className="tm-skeleton" style={{ width: 120, height: 52, borderRadius: 60 }}></div>)}</div>
                    <div className="tm-skeleton" style={{ height: 56, borderRadius: 60, marginBottom: 32 }}></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 28 }}>{[1,2,3,4,5,6].map(i => <div key={i} className="tm-skeleton" style={{ height: 380, borderRadius: 28 }}></div>)}</div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper pageId="employees" pageLabel="Employees" description="Manage your employees" onNavigate={onNavigate}>
            <div className="tm-premium-container">
                <div className="tm-premium-bg"></div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
                    <div>
                        <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#2D1B38', marginBottom: 6, letterSpacing: '-0.02em' }}>
                            🌟 All Employees
                        </h3>
                        <p style={{ fontSize: '14px', color: '#9B6EA0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={16} /> {team.length} active team members
                        </p>
                    </div>
                    <button
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 32px', background: 'linear-gradient(135deg, #623068 0%, #0D7289 100%)', color: '#F0EAF8', border: 'none', borderRadius: 60, fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)', boxShadow: '0 6px 18px rgba(98,48,104,0.35)', position: 'relative', overflow: 'hidden' }}
                        onClick={() => { resetForm(); setModalOpen(true); }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(98,48,104,0.45)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(98,48,104,0.35)'; }}
                    >
                        <Sparkles size={20} /> Add New Employee
                    </button>
                </div>

                {/* Department Stats */}
                <div className="tm-dept-stats">
                    {deptStats.map(d => {
                        const dc = DEPT_COLORS[d.dept] || { bg: 'linear-gradient(135deg, #F5F0E5, #EDE9FE)', color: '#47234F', icon: '#9B6EA0' };
                        return (
                            <div className="tm-dept-chip" key={d.dept}>
                                <div className="tm-dept-icon" style={{ background: dc.bg, color: dc.icon }}><Building2 size={18} /></div>
                                <span className="tm-dept-name">{d.dept}</span>
                                <span className="tm-dept-count">{d.count}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Search & Filters */}
                <div className="tm-filter-bar">
                    <div className="tm-search-box">
                        <Icon type="search" size={20} />
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

                {/* Employee Cards */}
                {filteredTeam.length === 0 ? (
                    <div className="tm-no-results">
                        <Search size={64} strokeWidth={1.5} />
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
                                <div className={`tm-emp-card${isOnLeave ? ' tm-on-leave' : ''}`} key={member.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <div className="tm-leave-stripe"></div>

                                    {/* Card Top */}
                                    <div className="tm-card-top">
                                        <div className="tm-card-emp-info">
                                            <div className="tm-card-avatar" style={{
                                                backgroundColor: (member.profilePic && member.profilePic !== '' && member.profilePic !== 'null')
                                                    ? 'transparent' : (member.avatarColor || '#623068')
                                            }}>
                                                {(member.profilePic && member.profilePic !== '' && member.profilePic !== 'null')
                                                    ? <img src={member.profilePic} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : (member.avatar || (member.name ? member.name.charAt(0).toUpperCase() : 'E'))
                                                }
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
                                        <span className="tm-status-badge" style={{ background: ss.bg, color: ss.color, boxShadow: `0 2px 8px ${ss.glow}` }}>
                                            <span className="tm-status-dot" style={{ backgroundColor: ss.dot }}></span>{member.status}
                                        </span>
                                    </div>

                                    {/* Card Body */}
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

                                    {/* Stats */}
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

                                    {/* Skills */}
                                    {member.skills && member.skills.length > 0 && (
                                        <div className="tm-skills-wrap">
                                            {member.skills.map(s => <span className="tm-skill-tag" key={s}>{s}</span>)}
                                        </div>
                                    )}

                                    {/* Leave Section */}
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

                                    {/* Actions */}
                                    <div className="tm-card-actions">
                                        <button className="tm-card-action-btn tm-action-edit" onClick={() => openEditModal(member)}>
                                            ✏️ Edit
                                        </button>
                                        <button className="tm-card-action-btn tm-action-delete" onClick={() => setDeleteModal(member)}>
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ─── ADD MODAL ── */}
                {modalOpen && (
                    <div className="tm-modal-overlay" onClick={() => setModalOpen(false)}>
                        <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
                            <div className="tm-modal-header">
                                <div>
                                    <div className="tm-modal-title">✨ Add New Employee</div>
                                    <div className="tm-modal-subtitle">Add a new employee to your team</div>
                                </div>
                                <button className="tm-modal-close" onClick={() => setModalOpen(false)}>✕</button>
                            </div>
                            <div className="tm-modal-body">
                                <div className="tm-form-section-title">📋 Employee Information</div>
                                {renderFormFields(form, updateForm, errors, 'emp-pic-add-input', handlePicUpload)}
                            </div>
                            <div className="tm-info-box">
                                <div className="tm-info-box-title"><Info size={16} /> Adding Employees</div>
                                <ul>
                                    <li>All fields marked with * are required</li>
                                    <li>Check-in/Check-out times appear in Attendance page</li>
                                </ul>
                            </div>
                            <div className="tm-modal-footer">
                                <button className="tm-btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button className="tm-btn-submit" onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'Adding...' : <><Sparkles size={18} /> Add Employee</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── EDIT MODAL ── */}
                {editModal && (
                    <div className="tm-modal-overlay" onClick={() => setEditModal(null)}>
                        <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
                            <div className="tm-modal-header">
                                <div>
                                    <div className="tm-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        ✏️ Edit Employee
                                    </div>
                                    <div className="tm-modal-subtitle">Editing: <strong style={{ color: '#2D1B38' }}>{editModal.name}</strong></div>
                                </div>
                                <button className="tm-modal-close" onClick={() => setEditModal(null)}>✕</button>
                            </div>
                            <div className="tm-modal-body">
                                <div className="tm-form-section-title">📋 Employee Information</div>
                                {renderFormFields(editForm, updateEditForm, editErrors, 'emp-pic-edit-input', handleEditPicUpload)}
                            </div>
                            <div className="tm-info-box">
                                <div className="tm-info-box-title"><Info size={16} /> Editing Employee</div>
                                <ul>
                                    <li>All fields marked with * are required</li>
                                    <li>Changes will be saved to Firebase immediately</li>
                                </ul>
                            </div>
                            <div className="tm-modal-footer">
                                <button className="tm-btn-cancel" onClick={() => setEditModal(null)}>Cancel</button>
                                <button className="tm-btn-submit" onClick={handleEditSubmit} disabled={editSubmitting}>
                                    {editSubmitting ? 'Saving...' : <><Check size={18} /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── LEAVE CONFIRM ── */}
                {leaveModal && (
                    <div className="tm-leave-confirm-overlay" onClick={() => setLeaveModal(null)}>
                        <div className="tm-leave-confirm-box" onClick={e => e.stopPropagation()}>
                            <div className="tm-leave-confirm-icon"><Calendar size={32} color="#C0854A" /></div>
                            <div className="tm-leave-confirm-title">Mark {leaveModal.name} On Leave</div>
                            <div className="tm-leave-confirm-text">This will update their status to <strong>On Leave</strong>.</div>
                            <div className="tm-leave-days-group">
                                <label>Duration:</label>
                                <input className="tm-leave-days-input" type="number" min="1" max="90"
                                    value={leaveDays} onChange={e => setLeaveDays(e.target.value)} />
                                <span>day{leaveDays > 1 ? 's' : ''}</span>
                            </div>
                            <div className="tm-leave-confirm-actions">
                                <button className="tm-leave-confirm-cancel" onClick={() => setLeaveModal(null)}>Cancel</button>
                                <button className="tm-leave-confirm-approve" onClick={confirmLeave}>Approve Leave</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DELETE CONFIRM ── */}
                {deleteModal && (
                    <div className="tm-delete-overlay" onClick={() => setDeleteModal(null)}>
                        <div className="tm-delete-box" onClick={e => e.stopPropagation()}>
                            <div className="tm-delete-icon"><Trash size={32} color="#8A1C37" /></div>
                            <div className="tm-delete-title">Remove Employee</div>
                            <div className="tm-delete-text">
                                Are you sure you want to remove <strong>{deleteModal.name}</strong>? This action cannot be undone.
                            </div>
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
                        {toast.type === 'success' ? <Check size={18} color="#0D7289" /> : <AlertCircle size={18} color={toast.type === 'warning' ? '#C0854A' : '#8A1C37'} />}
                        {toast.message}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

export default Employees;