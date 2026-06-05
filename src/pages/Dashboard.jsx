import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../Sidebar';
import { db } from "../firebase"; 

const PROJECTS_KEY = 'proj_data';
const STORAGE_KEY = 'ach_leaderboard';
const getCurrentMonthKey = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' });

const EMPLOYEES_LIST = [];
const INTERNS_LIST = [];

const svgBase = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

const Icon = ({ type, size = 20, color }) => {
    const p = { ...svgBase, width: size, height: size, style: color ? { color } : undefined };
    switch (type) {
        case 'users': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
        case 'briefcase': return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
        case 'trending-up': return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
        case 'check-circle': return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
        case 'clock': return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
        case 'alert-triangle': return <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
        case 'award': return <svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
        case 'graduation': return <svg {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>;
        case 'calendar': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
        case 'arrow-right': return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
        case 'zap': return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
        case 'layers': return <svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
        case 'target': return <svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
        case 'bar-chart': return <svg {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
        case 'activity': return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
        case 'trending-down': return <svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
        case 'star': return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
        default: return null;
    }
};

const styles = `
:root {
  --primary: #623068;
  --primary-dark: #331B3F;
  --primary-light: #EDE6F0;
  --primary-glow: rgba(98, 48, 104, 0.4);
  --text-dark: #1A1530;
  --text-muted: #64748B;
  --bg-page: linear-gradient(135deg, #F7F5FF 0%, #F3EDF5 50%, #EDE6F0 100%);
  --bg-card: rgba(255, 255, 255, 0.98);
  --success: #10B981;
  --success-light: #D1FAE5;
  --warning: #F59E0B;
  --warning-light: #FEF3C7;
  --danger: #EF4444;
  --danger-light: #FEE2E2;
  --teal: #0D7289;
  --teal-light: #E0F2F1;
  --purple: #7C3AED;
  --pink: #EC4899;
  --border: rgba(98, 48, 104, 0.12);
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 20px rgba(98, 48, 104, 0.08);
  --shadow-lg: 0 8px 32px rgba(98, 48, 104, 0.12);
  --shadow-xl: 0 20px 40px rgba(98, 48, 104, 0.15);
  --sidebar-width: 260px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dash-page {
  margin-left: var(--sidebar-width);
  padding: 2rem 2.5rem;
  min-height: 100vh;
  background: var(--bg-page);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: all 0.3s ease;
  position: relative;
}

/* Animated Background */
.dash-bg-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.dash-bubble {
  position: absolute;
  background: radial-gradient(circle, rgba(98, 48, 104, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  25% { transform: translateY(-20px) translateX(10px) rotate(5deg); }
  75% { transform: translateY(20px) translateX(-10px) rotate(-5deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 5px var(--primary-glow); }
  50% { box-shadow: 0 0 20px var(--primary-glow); }
}

/* Responsive */
@media (max-width: 1200px) {
  .dash-page {
    padding: 1.5rem;
  }
  .dash-stats {
    gap: 1rem;
  }
}

@media (max-width: 992px) {
  .dash-grid {
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
  }
  .dash-bottom-grid {
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
  }
  .dash-stats {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .dash-page {
    margin-left: 0;
    padding: 1rem;
  }
  .dash-stats {
    grid-template-columns: 1fr !important;
  }
  .dash-stat-card {
    padding: 1rem;
  }
  .dash-actions {
    grid-template-columns: 1fr !important;
    gap: 0.75rem;
  }
}

/* Header */
.dash-header {
  margin-bottom: 2rem;
  animation: slideInUp 0.5s ease;
  position: relative;
  z-index: 1;
}

.dash-greeting {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  font-weight: 800;
  background: linear-gradient(135deg, var(--text-dark) 0%, var(--primary) 40%, var(--purple) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.02em;
}

.dash-greeting span {
  background: linear-gradient(135deg, var(--primary) 0%, var(--teal) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
  display: inline-block;
}

.dash-greeting span::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--teal));
  border-radius: 3px;
  animation: pulse 2s ease-in-out infinite;
}

.dash-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.dash-date {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-top: 0.75rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.dash-date:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Stats Cards */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.dash-stat-card {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  animation: slideInUp 0.5s ease backwards;
}

.dash-stat-card:nth-child(1) { animation-delay: 0.1s; }
.dash-stat-card:nth-child(2) { animation-delay: 0.2s; }
.dash-stat-card:nth-child(3) { animation-delay: 0.3s; }
.dash-stat-card:nth-child(4) { animation-delay: 0.4s; }

.dash-stat-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-light);
}

.dash-stat-glow {
  position: absolute;
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  opacity: 0.1;
  top: -3rem;
  right: -3rem;
  pointer-events: none;
  transition: all 0.5s ease;
}

.dash-stat-card:hover .dash-stat-glow {
  opacity: 0.2;
  transform: scale(1.3) rotate(45deg);
}

.dash-stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.dash-stat-card:hover .dash-stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.dash-stat-val {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-dark);
  line-height: 1.2;
  letter-spacing: -0.02em;
  transition: all 0.3s ease;
}

.dash-stat-card:hover .dash-stat-val {
  transform: scale(1.05);
  transform-origin: left;
}

.dash-stat-lbl {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dash-stat-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 2rem;
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--primary-light);
  color: var(--primary);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.dash-stat-card:hover .dash-stat-badge {
  transform: scale(1.05);
}

/* Cards */
.dash-grid, .dash-bottom-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.dash-grid {
  grid-template-columns: 1fr 380px;
}

.dash-bottom-grid {
  grid-template-columns: 1fr 1fr;
}

.dash-card {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: var(--shadow-sm);
  animation: slideInUp 0.5s ease backwards;
}

.dash-card:nth-child(1) { animation-delay: 0.5s; }
.dash-card:nth-child(2) { animation-delay: 0.6s; }

.dash-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
  border-color: var(--primary-light);
}

.dash-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 2px solid var(--border);
  background: linear-gradient(135deg, rgba(98, 48, 104, 0.02), rgba(255, 255, 255, 0.8));
}

.dash-card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--text-dark);
}

.dash-card-count {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary);
  background: var(--primary-light);
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
}

.dash-card-body {
  padding: 0.25rem 0;
  max-height: 400px;
  overflow-y: auto;
}

.dash-card-body::-webkit-scrollbar {
  width: 4px;
}

.dash-card-body::-webkit-scrollbar-track {
  background: var(--border);
}

.dash-card-body::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 4px;
}

.dash-card-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--teal);
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
  transition: all 0.3s ease;
  width: 100%;
  background: transparent;
  border-left: none;
  border-right: none;
  border-bottom: none;
  text-align: left;
}

.dash-card-link:hover {
  background: linear-gradient(135deg, var(--primary-light), rgba(98, 48, 104, 0.05));
  color: var(--primary);
  transform: translateX(4px);
}

/* Activity Items */
.dash-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
  overflow: hidden;
}

.dash-activity-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(98, 48, 104, 0.03), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.dash-activity-item:hover::before {
  transform: translateX(0);
}

.dash-activity-item:hover {
  background: var(--primary-light);
  border-left-color: var(--primary);
  transform: translateX(4px);
}

.dash-activity-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  margin-top: 0.375rem;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.dash-activity-item:hover .dash-activity-dot {
  transform: scale(1.5);
}

.dash-activity-dot.green { background: var(--success); box-shadow: 0 0 0 3px var(--success-light); }
.dash-activity-dot.amber { background: var(--warning); box-shadow: 0 0 0 3px var(--warning-light); }
.dash-activity-dot.blue { background: var(--teal); box-shadow: 0 0 0 3px var(--teal-light); }

.dash-activity-text {
  font-size: 0.8125rem;
  color: var(--text-dark);
  line-height: 1.4;
}

.dash-activity-text strong {
  font-weight: 800;
  color: var(--text-dark);
}

.dash-activity-text span {
  font-weight: 700;
}

.dash-activity-time {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* Deadline Items */
.dash-deadline-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  position: relative;
  overflow: hidden;
}

.dash-deadline-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(98, 48, 104, 0.03), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.dash-deadline-item:hover::before {
  transform: translateX(0);
}

.dash-deadline-item:hover {
  background: var(--primary-light);
  border-left-color: var(--primary);
  transform: translateX(4px);
}

.dash-deadline-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.dash-deadline-item:hover .dash-deadline-avatar {
  transform: scale(1.1) rotate(5deg);
}

.dash-deadline-info {
  flex: 1;
  min-width: 0;
}

.dash-deadline-proj {
  font-size: 0.8125rem;
  font-weight: 800;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-deadline-name {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
}

.dash-deadline-date {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.dash-deadline-item:hover .dash-deadline-date {
  transform: scale(1.05);
}

.dash-deadline-date.overdue {
  background: var(--danger-light);
  color: var(--danger);
  animation: pulse 2s ease-in-out infinite;
}
.dash-deadline-date.soon {
  background: var(--warning-light);
  color: var(--warning);
}
.dash-deadline-date.safe {
  background: var(--success-light);
  color: var(--success);
}

/* Performance Bars */
.dash-perf-bar-wrap {
  padding: 0.5rem 1.25rem;
}

.dash-perf-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 0.75rem;
}

.dash-perf-item:hover {
  transform: translateX(6px);
  background: var(--primary-light);
}

.dash-perf-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.dash-perf-item:hover .dash-perf-avatar {
  transform: scale(1.1);
}

.dash-perf-info {
  flex: 1;
  min-width: 0;
}

.dash-perf-name {
  font-size: 0.8125rem;
  font-weight: 800;
  color: var(--text-dark);
}

.dash-perf-role {
  font-size: 0.625rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
}

.dash-perf-bar-bg {
  width: 100%;
  height: 0.5rem;
  background: rgba(98, 48, 104, 0.1);
  border-radius: 0.5rem;
  margin-top: 0.375rem;
  overflow: hidden;
  position: relative;
}

.dash-perf-bar-fill {
  height: 100%;
  border-radius: 0.5rem;
  transition: width 1s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  position: relative;
  overflow: hidden;
}

.dash-perf-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

.dash-perf-count {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-light);
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  white-space: nowrap;
}

/* Empty State */
.dash-empty {
  text-align: center;
  padding: 2.5rem 1.25rem;
}

.dash-empty p {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* Quick Actions */
.dash-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.dash-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  font-family: inherit;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.dash-action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(98, 48, 104, 0.1), transparent);
  transition: all 0.5s ease;
  transform: translate(-50%, -50%);
}

.dash-action-btn:hover::before {
  width: 200%;
  height: 200%;
}

.dash-action-btn:hover {
  transform: translateY(-6px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.dash-action-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.dash-action-btn:hover .dash-action-icon {
  transform: scale(1.1) rotate(5deg);
}

.dash-action-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-dark);
}

.dash-action-desc {
  font-size: 0.625rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.3;
}

/* Skeleton Loading */
.dash-skel {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  border-radius: 0.5rem;
  animation: shimmer 1.5s infinite;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('dash-styles-premium')) {
    const tag = document.createElement('style');
    tag.id = 'dash-styles-premium';
    tag.textContent = styles;
    document.head.appendChild(tag);
}

const getDateDifference = (deadlineStr) => {
    if (!deadlineStr) return { days: 0, isOverdue: false, label: 'No deadline' };
    
    let deadline;
    if (typeof deadlineStr === 'string') {
        if (deadlineStr.includes('-')) {
            const parts = deadlineStr.split('-');
            deadline = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (deadlineStr.includes('/')) {
            const parts = deadlineStr.split('/');
            deadline = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else {
            deadline = new Date(deadlineStr);
        }
    } else if (deadlineStr.toDate) {
        deadline = deadlineStr.toDate();
    } else {
        deadline = new Date(deadlineStr);
    }
    
    if (isNaN(deadline.getTime())) {
        return { days: 0, isOverdue: false, label: 'Invalid date' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        return { 
            days: diffDays, 
            isOverdue: true, 
            label: overdueDays === 1 ? `🔥 1d overdue` : `🔥 ${overdueDays}d overdue`,
            overdueDays
        };
    } else if (diffDays === 0) {
        return { days: 0, isOverdue: false, label: '⚡ Today' };
    } else if (diffDays === 1) {
        return { days: 1, isOverdue: false, label: '📅 1d left' };
    } else if (diffDays <= 30) {
        return { days: diffDays, isOverdue: false, label: `📅 ${diffDays}d left` };
    } else {
        const formattedDate = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { days: diffDays, isOverdue: false, label: `📅 ${formattedDate}` };
    }
};

const timeAgo = (isoStr) => {
    if (!isoStr) return '';
    const seconds = Math.floor((new Date() - new Date(isoStr)) / 1000);
    if (seconds < 60) return '⚡ Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago ⏱️`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago ⏰`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago 📆`;
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Dashboard = ({ onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({ total_team: 0, active_projects: 0, completed_month: 0, overdue: 0 });
    const [currentDate] = useState(new Date());

    const fetchDashboardData = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const hfToken = import.meta.env.VITE_HF_TOKEN;

            const response = await fetch(`${backendUrl}/dashboard-stats`, {
                method: 'GET', 
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
                if (data.projects_list) {
                    setProjects(data.projects_list);
                }
            }
        } catch (error) {
            console.error("Dashboard data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const inProgress = useMemo(() => projects.filter(p => p.status === 'in-progress'), [projects]);
    const completed = useMemo(() => projects.filter(p => p.status === 'completed'), [projects]);
    const thisMonthCompleted = useMemo(() => {
        const mk = getCurrentMonthKey();
        return completed.filter(p => p.completedAt && new Date(p.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }) === mk);
    }, [completed]);
    
    const completionRate = projects.length > 0 ? Math.round(completed.length / projects.length * 100) : 0;
    
    const overdueCount = useMemo(() => {
        return inProgress.filter(p => {
            if (!p.deadline) return false;
            const { isOverdue } = getDateDifference(p.deadline);
            return isOverdue;
        }).length;
    }, [inProgress]);
    
    const dueSoonCount = useMemo(() => {
        return inProgress.filter(p => {
            if (!p.deadline) return false;
            const { days, isOverdue } = getDateDifference(p.deadline);
            return !isOverdue && days >= 0 && days <= 3;
        }).length;
    }, [inProgress]);

    const workload = useMemo(() => {
        const map = {};
        inProgress.forEach(p => {
            const key = p.personName || "Unknown"; 
            if (!map[key]) map[key] = { 
                personName: p.personName,
                personAvatar: p.personAvatar,
                personAvatarColor: p.personAvatarColor,
                count: 0 
            };
            map[key].count++;
        });
        return Object.values(map).sort((a, b) => b.count - a.count);
    }, [inProgress]);

    const topPerformers = useMemo(() => {
        const map = {};
        thisMonthCompleted.forEach(p => {
            const key = p.personName || "Unknown";
            if (!map[key]) map[key] = { 
                personName: p.personName,
                personAvatar: p.personAvatar,
                personAvatarColor: p.personAvatarColor,
                count: 0 
            };
            map[key].count++;
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [thisMonthCompleted]);

    const upcomingDeadlines = useMemo(() => {
        return [...inProgress]
            .filter(p => p.deadline)
            .sort((a, b) => {
                let dateA, dateB;
                if (typeof a.deadline === 'string') {
                    if (a.deadline.includes('-')) {
                        const parts = a.deadline.split('-');
                        dateA = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else {
                        dateA = new Date(a.deadline);
                    }
                } else if (a.deadline.toDate) {
                    dateA = a.deadline.toDate();
                } else {
                    dateA = new Date(a.deadline);
                }
                if (typeof b.deadline === 'string') {
                    if (b.deadline.includes('-')) {
                        const parts = b.deadline.split('-');
                        dateB = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else {
                        dateB = new Date(b.deadline);
                    }
                } else if (b.deadline.toDate) {
                    dateB = b.deadline.toDate();
                } else {
                    dateB = new Date(b.deadline);
                }
                if (isNaN(dateA) || isNaN(dateB)) return 0;
                return dateA - dateB;
            })
            .slice(0, 6);
    }, [inProgress]);

    const activityFeed = useMemo(() => {
    const items = [];
    const mk = getCurrentMonthKey();

    // Sirf is month ki completed
    const thisMonthActivity = completed.filter(p => 
        p.completedAt && 
        new Date(p.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }) === mk
    );

    thisMonthActivity
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 4)
        .forEach(p => {
            items.push({ 
                type: 'completed', 
                dot: 'green', 
                text: <><strong>{p.personName}</strong> completed <strong>"{p.projectName}"</strong></>, 
                time: p.completedAt 
            });
        });
        inProgress.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3).forEach(p => {
            items.push({ 
                type: 'assigned', 
                dot: 'blue', 
                text: <><strong>{p.personName}</strong> was assigned <strong>"{p.projectName}"</strong></>, 
                time: p.createdAt 
            });
        });
        return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
    }, [completed, inProgress]);

    const greeting = () => {
        const h = currentDate.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <>
                <Sidebar onNavigate={onNavigate} />
                <div className="dash-page">
                    <div className="dash-header">
                        <div className="dash-skel" style={{width:280,height:36,borderRadius:'0.75rem'}}></div>
                        <div className="dash-skel" style={{width:360,height:20,marginTop:8,borderRadius:'0.5rem'}}></div>
                    </div>
                    <div className="dash-stats">
                        {[...Array(4)].map((_,i) => <div key={i} className="dash-skel" style={{height:140, borderRadius:'1.5rem'}}></div>)}
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Sidebar onNavigate={onNavigate} />
            
            {/* Animated Background */}
            <div className="dash-bg-animation">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="dash-bubble"
                        style={{
                            width: Math.random() * 200 + 50,
                            height: Math.random() * 200 + 50,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 20}s`,
                            animationDuration: `${Math.random() * 20 + 15}s`,
                            opacity: Math.random() * 0.3 + 0.1
                        }}
                    />
                ))}
            </div>

            <div className="dash-page">
                <div className="dash-header">
                    <div className="dash-greeting">
                        {greeting()}, <span>Admin</span>
                        <span style={{ fontSize: '1.5rem', marginLeft: '0.5rem' }}>👋</span>
                    </div>
                    <div className="dash-sub">✨ Here's what's happening at WellMind Data Solutions ✨</div>
                    <div className="dash-date">
                        <Icon type="calendar" size={13} color="#623068" />
                        {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                <div className="dash-stats">
                    <div className="dash-stat-card">
                        <div className="dash-stat-glow" style={{background: 'var(--primary)'}}></div>
                        <div className="dash-stat-icon" style={{background: 'var(--primary-light)'}}>
                            <Icon type="users" size={20} color="var(--primary)" />
                        </div>
                        <div className="dash-stat-val">{stats.total_team || (EMPLOYEES_LIST.length + INTERNS_LIST.length)}</div>
                        <div className="dash-stat-lbl">Total Team Members</div>
                        <div className="dash-stat-badge">
                            👥 {EMPLOYEES_LIST.length} emp · {INTERNS_LIST.length} int
                        </div>
                    </div>
                    
                    <div className="dash-stat-card">
                        <div className="dash-stat-glow" style={{background: 'var(--teal)'}}></div>
                        <div className="dash-stat-icon" style={{background: 'var(--teal-light)'}}>
                            <Icon type="briefcase" size={20} color="var(--teal)" />
                        </div>
                        <div className="dash-stat-val">{stats.active_projects || inProgress.length}</div>
                        <div className="dash-stat-lbl">Active Projects</div>
                        <div className="dash-stat-badge" style={{background:'var(--teal-light)', color:'var(--teal)'}}>
                            🟢 Live
                        </div>
                    </div>
                    
                    <div className="dash-stat-card">
                        <div className="dash-stat-glow" style={{background: 'var(--warning)'}}></div>
                        <div className="dash-stat-icon" style={{background: 'var(--warning-light)'}}>
                            <Icon type="check-circle" size={20} color="var(--warning)" />
                        </div>
                        <div className="dash-stat-val">{stats.completed_month || thisMonthCompleted.length}</div>
                        <div className="dash-stat-lbl">Completed This Month</div>
                        <div className="dash-stat-badge" style={{background:'var(--warning-light)', color:'var(--warning)'}}>
                            📊 {completionRate}% rate
                        </div>
                    </div>
                    
                    <div className="dash-stat-card">
                        <div className="dash-stat-glow" style={{background: overdueCount > 0 ? 'var(--danger)' : 'var(--primary)'}}></div>
                        <div className="dash-stat-icon" style={{background: overdueCount > 0 ? 'var(--danger-light)' : 'var(--primary-light)'}}>
                            <Icon type="alert-triangle" size={20} color={overdueCount > 0 ? 'var(--danger)' : 'var(--primary)'} />
                        </div>
                        <div className="dash-stat-val">{overdueCount}</div>
                        <div className="dash-stat-lbl">Overdue Tasks</div>
                        <div className="dash-stat-badge" style={{
                            background: dueSoonCount > 0 ? 'var(--warning-light)' : 'var(--success-light)',
                            color: dueSoonCount > 0 ? 'var(--warning)' : 'var(--success)'
                        }}>
                            {dueSoonCount > 0 ? `⏰ ${dueSoonCount} due soon` : '✅ All clear'}
                        </div>
                    </div>
                </div>

                <div className="dash-grid">
                    <div className="dash-card">
                        <div className="dash-card-head">
                            <div className="dash-card-title">
                                <Icon type="activity" size={16} color="var(--teal)" />
                                Recent Activity Feed
                            </div>
                            <div className="dash-card-count">{activityFeed.length}</div>
                        </div>
                        <div className="dash-card-body">
                            {activityFeed.length === 0 
                                ? <div className="dash-empty"><p>✨ No recent activity ✨</p></div> 
                                : activityFeed.map((item, i) => (
                                    <div key={i} className="dash-activity-item">
                                        <div className={`dash-activity-dot ${item.dot}`}></div>
                                        <div>
                                            <div className="dash-activity-text">{item.text}</div>
                                            <div className="dash-activity-time">{timeAgo(item.time)}</div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        <button className="dash-card-link" onClick={() => onNavigate && onNavigate('projects')}>
                            View all projects <Icon type="arrow-right" size={12} color="var(--teal)" />
                        </button>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-head">
                            <div className="dash-card-title">
                                <Icon type="clock" size={16} color="var(--warning)" />
                                Upcoming Deadlines
                            </div>
                            <div className="dash-card-count">{upcomingDeadlines.length}</div>
                        </div>
                        <div className="dash-card-body">
                            {upcomingDeadlines.length === 0 
                                ? <div className="dash-empty"><p>🎉 No upcoming deadlines! 🎉</p></div> 
                                : upcomingDeadlines.map((proj, idx) => {
                                    const { label, isOverdue, days } = getDateDifference(proj.deadline);
                                    const isSoon = !isOverdue && (label.includes('Today') || (label.includes('d left') && days <= 3));
                                    const className = isOverdue ? 'overdue' : isSoon ? 'soon' : 'safe';
                                    const avatarInitial = proj.personAvatar || (proj.personName ? proj.personName.charAt(0).toUpperCase() : '?');
                                    const avatarColor = isOverdue ? 'var(--danger)' : 'var(--primary)';
                                    
                                    return (
                                        <div key={proj.id || idx} className="dash-deadline-item">
                                            <div className="dash-deadline-avatar" style={{backgroundColor: avatarColor}}>
                                                {avatarInitial}
                                            </div>
                                            <div className="dash-deadline-info">
                                                <div className="dash-deadline-proj">{proj.projectName}</div>
                                                <div className="dash-deadline-name">👤 {proj.personName || 'Unassigned'}</div>
                                            </div>
                                            <div className={`dash-deadline-date ${className}`}>{label}</div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                        <button className="dash-card-link" onClick={() => onNavigate && onNavigate('projects')}>
                            View all deadlines <Icon type="arrow-right" size={12} color="var(--teal)" />
                        </button>
                    </div>
                </div>

                <div className="dash-bottom-grid">
                    <div className="dash-card">
                        <div className="dash-card-head">
                            <div className="dash-card-title">
                                <Icon type="bar-chart" size={16} color="var(--primary)" /> 
                                Team Workload Distribution
                            </div>
                        </div>
                        <div className="dash-perf-bar-wrap">
                            {workload.length === 0 
                                ? <div className="dash-empty"><p>📊 No active projects 📊</p></div>
                                : workload.map((w, i) => {
                                    const maxCount = Math.max(...workload.map(w => w.count));
                                    const widthPercent = maxCount > 0 ? (w.count / maxCount) * 100 : 0;
                                    return (
                                        <div key={i} className="dash-perf-item">
                                            <div className="dash-perf-avatar" style={{backgroundColor: w.personAvatarColor || 'var(--primary)'}}>
                                                {w.personAvatar || (w.personName ? w.personName.charAt(0).toUpperCase() : '?')}
                                            </div>
                                            <div className="dash-perf-info">
                                                <div className="dash-perf-name">{w.personName}</div>
                                                <div className="dash-perf-role">Active Member</div>
                                                <div className="dash-perf-bar-bg">
                                                    <div className="dash-perf-bar-fill" style={{width: `${widthPercent}%`, background:'var(--primary)'}}></div>
                                                </div>
                                            </div>
                                            <div className="dash-perf-count">{w.count} projects</div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>

                    <div className="dash-card">
                        <div className="dash-card-head">
                            <div className="dash-card-title">
                                <Icon type="award" size={16} color="var(--warning)" /> 
                                Top Performers 🏆
                            </div>
                        </div>
                        <div className="dash-perf-bar-wrap">
                            {topPerformers.length === 0 
                                ? <div className="dash-empty"><p>🌟 No completions this month 🌟</p></div>
                                : topPerformers.map((p, i) => {
                                    const maxCount = Math.max(...topPerformers.map(p => p.count));
                                    const widthPercent = maxCount > 0 ? (p.count / maxCount) * 100 : 0;
                                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📈';
                                    return (
                                        <div key={i} className="dash-perf-item">
                                            <div className="dash-perf-avatar" style={{backgroundColor: p.personAvatarColor || 'var(--teal)'}}>
                                                {medal}
                                            </div>
                                            <div className="dash-perf-info">
                                                <div className="dash-perf-name">{p.personName}</div>
                                                <div className="dash-perf-role">Top Performer</div>
                                                <div className="dash-perf-bar-bg">
                                                    <div className="dash-perf-bar-fill" style={{width: `${widthPercent}%`, background:'var(--teal)'}}></div>
                                                </div>
                                            </div>
                                            <div className="dash-perf-count">{p.count} completed</div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                </div>

                <div className="dash-bottom-grid">
                    <div className="dash-card">
                        <div className="dash-card-head">
                            <div className="dash-card-title">
                                <Icon type="target" size={16} color="var(--primary)" /> 
                                Quick Actions
                            </div>
                        </div>
                        <div style={{padding:'1.25rem'}}>
                            <div className="dash-actions">
                                <button className="dash-action-btn" onClick={() => onNavigate && onNavigate('projects')}>
                                    <div className="dash-action-icon" style={{background:'var(--primary-light)'}}>
                                        <Icon type="briefcase" size={20} color="var(--primary)" />
                                    </div>
                                    <div className="dash-action-label">New Project</div>
                                    <div className="dash-action-desc">Create assignment</div>
                                </button>
                                <button className="dash-action-btn" onClick={() => onNavigate && onNavigate('interns')}>
                                    <div className="dash-action-icon" style={{background:'var(--teal-light)'}}>
                                        <Icon type="graduation" size={20} color="var(--teal)" />
                                    </div>
                                    <div className="dash-action-label">Intern Tasks</div>
                                    <div className="dash-action-desc">Manage interns</div>
                                </button>
                                <button className="dash-action-btn" onClick={() => onNavigate && onNavigate('reports')}>
                                    <div className="dash-action-icon" style={{background:'var(--warning-light)'}}>
                                        <Icon type="bar-chart" size={20} color="var(--warning)" />
                                    </div>
                                    <div className="dash-action-label">Analytics</div>
                                    <div className="dash-action-desc">View reports</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;