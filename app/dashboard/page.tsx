'use client';

import { useState, useEffect } from 'react';

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const conversations = [
  {
    id: 1,
    name: 'Floyd Miles',
    initials: 'F',
    color: '#3b82f6',
    time: '11:42',
    preview: 'Du: Takk for at du bruker vår tjeneste! Vi hjelper deg gjerne...',
    unread: 3,
    status: 'open' as const,
    email: 'floyd.miles@gmail.com',
    phone: '(208) 555-0112',
  },
  {
    id: 2,
    name: 'Marvin Johansen',
    initials: 'M',
    color: '#8b5cf6',
    time: '10:15',
    preview: 'Hvordan kan jeg integrere chatboten på min nettside?',
    unread: 0,
    status: 'open' as const,
    email: 'marvin.johansen@outlook.no',
    phone: '(47) 912 34 567',
  },
  {
    id: 3,
    name: 'Astrid Nilsen',
    initials: 'A',
    color: '#f59e0b',
    time: '09:30',
    preview: 'Du: Vi har oppdatert prisplanen din. Sjekk...',
    unread: 1,
    status: 'open' as const,
    email: 'astrid.nilsen@bedrift.no',
    phone: '(47) 922 55 891',
  },
  {
    id: 4,
    name: 'Erik Svendsen',
    initials: 'E',
    color: '#ef4444',
    time: 'I går',
    preview: 'Kan dere hjelpe meg med å sette opp en kunnskapsbase?',
    unread: 0,
    status: 'open' as const,
    email: 'erik.svendsen@firma.no',
    phone: '(47) 933 44 221',
  },
  {
    id: 5,
    name: 'Ingrid Haugen',
    initials: 'I',
    color: '#10b981',
    time: 'I går',
    preview: 'Du: Hei! Velkommen til NorskBot. Hvordan kan vi...',
    unread: 0,
    status: 'open' as const,
    email: 'ingrid.haugen@skole.no',
    phone: '(47) 955 66 778',
  },
];

const messages = [
  { id: 1, sender: 'system', text: '🎯 VENNLIG TONE VALGT', time: '' },
  {
    id: 2,
    sender: 'bot',
    text: 'Hei Floyd! Velkommen til NorskBot. Jeg er her for å hjelpe deg med alt du lurer på. Hva kan jeg gjøre for deg i dag?',
    time: 'Torsdag 11:30',
  },
  {
    id: 3,
    sender: 'user',
    text: 'Hei! Jeg vil gjerne vite mer om hvordan chatboten fungerer på nettsiden min.',
    time: 'Torsdag 11:31',
  },
  {
    id: 4,
    sender: 'bot',
    text: 'Selvfølgelig! NorskBot er enkel å sette opp. Du legger til en liten kodebit på nettsiden din, og chatboten dukker opp automatisk. Den lærer fra innholdet ditt og kan svare kunders spørsmål 24/7.',
    time: 'Torsdag 11:32',
  },
  {
    id: 5,
    sender: 'user',
    text: 'Kan den håndtere spørsmål på norsk?',
    time: 'Torsdag 11:33',
  },
  {
    id: 6,
    sender: 'bot',
    text: 'Absolutt! NorskBot er spesialisert for norsk språk. Den forstår bokmål og nynorsk, og kan til og med håndtere dialektuttrykk. AI-modellen er trent på norsk innhold for best mulig forståelse.',
    time: 'Torsdag 11:35',
  },
  {
    id: 7,
    sender: 'user',
    text: 'Flott! Hva med priser?',
    time: 'Torsdag 11:37',
  },
  {
    id: 8,
    sender: 'bot',
    text: 'Vi har tre planer:\n\n• Starter: 499 kr/mnd — 1 chatbot, 1000 meldinger\n• Pro: 999 kr/mnd — 5 chatboter, ubegrenset meldinger\n• Enterprise: Tilpasset — Alle funksjoner + dedikert support\n\nVil du prøve gratis i 14 dager?',
    time: 'Torsdag 11:38',
  },
  {
    id: 9,
    sender: 'user',
    text: 'Ja, det høres bra ut! Kan du sende meg en lenke?',
    time: 'Torsdag 11:40',
  },
  {
    id: 10,
    sender: 'bot',
    text: 'Takk for at du bruker vår tjeneste! Vi hjelper deg gjerne videre. Du kan registrere deg her: norskbot.no/registrer 🚀',
    time: 'Torsdag 11:41',
  },
];

// ─── ICONS (SVG as inline components) ───────────────────────────────────────

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  text: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M16 13H8 M16 17H8 M10 9H8',
  qa: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  quickMsg: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  persona: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  appearance: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  chat: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  playground: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  functions: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
  members: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  check: 'M20 6L9 17l-5-5',
  robot: 'M12 2a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2z M9 13h0 M15 13h0',
  dots: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  chevronDown: 'M6 9l6 6 6-6',
  chatbot: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  demo: 'M5 3l14 9-14 9V3z',
  plan: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  usage: 'M18 20V10 M12 20V4 M6 20v-6',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  calendar: 'M16 2v4 M8 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  smile: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M8 14s1.5 2 4 2 4-2 4-2',
  frown: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M16 16s-1.5-2-4-2-4 2-4 2',
  hash: 'M4 9h16 M4 15h16 M10 3L8 21 M16 3l-2 18',
  msg: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
};

// ─── SIDEBAR NAV ITEMS ─────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: string;
  badge?: number;
  section?: string;
}

const navItems: NavItem[] = [
  { label: 'Kontrollpanel', icon: 'dashboard' },
  { section: 'INNHOLD', label: 'Lenker', icon: 'link' },
  { label: 'Filer', icon: 'file' },
  { label: 'Tekst', icon: 'text' },
  { label: 'Spørsmål & Svar', icon: 'qa' },
  { section: 'TILPASNING', label: 'Hurtigmeldinger', icon: 'quickMsg' },
  { label: 'Personas', icon: 'persona' },
  { label: 'Utseende', icon: 'appearance' },
  { section: 'AVANSERT', label: 'Chattehistorikk', icon: 'chat', badge: 12 },
  { label: 'Lekeplass', icon: 'playground' },
  { label: 'Funksjoner', icon: 'functions' },
  { label: 'Medlemmer', icon: 'members' },
  { label: 'Innstillinger', icon: 'settings' },
];

const topNavItems = [
  { label: 'Chatbots', icon: 'chatbot' },
  { label: 'Demo', icon: 'demo' },
  { label: 'Planer', icon: 'plan' },
  { label: 'Kontobruk', icon: 'usage' },
  { label: 'Profil', icon: 'profile' },
];

// ─── STYLES ─────────────────────────────────────────────────────────────────

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState('Chattehistorikk');
  const [selectedConvo, setSelectedConvo] = useState(1);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredConvo, setHoveredConvo] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(1400);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showRightPanel = windowWidth > 1100;
  const collapseSidebar = windowWidth < 800;
  const sidebarWidth = collapseSidebar ? 56 : 240;

  const selectedConversation = conversations.find((c) => c.id === selectedConvo) || conversations[0];

  // ─── RENDER ───────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily, color: '#0f172a', fontSize: 14, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
      {/* ─── TOP NAV BAR ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', height: 56, background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', flexShrink: 0, zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
            N
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>NorskBot</span>
        </div>

        {/* Center nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
          {topNavItems.map((item) => (
            <div
              key={item.label}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLDivElement).style.color = '#0f172a'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = '#64748b'; }}
            >
              <Icon d={(icons as any)[item.icon]} size={16} />
              {!collapseSidebar && <span>{item.label}</span>}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 500 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fef2f2'; (e.currentTarget as HTMLDivElement).style.color = '#ef4444'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = '#64748b'; }}
        >
          <Icon d={icons.logout} size={16} />
          <span>Logg ut</span>
        </div>
      </div>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ─── COLUMN 1: SIDEBAR ─────────────────────────────────────── */}
        <div style={{ width: sidebarWidth, background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ padding: collapseSidebar ? '16px 8px' : '16px' }}>
            {navItems.map((item, i) => {
              const isActive = activeNav === item.label;
              const isHovered = hoveredNav === item.label;

              return (
                <div key={i}>
                  {item.section && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', padding: collapseSidebar ? '16px 4px 6px' : '16px 12px 6px', textTransform: 'uppercase' as const }}>
                      {collapseSidebar ? '' : item.section}
                      {collapseSidebar && <div style={{ borderBottom: '1px solid #e2e8f0', marginTop: 4 }} />}
                    </div>
                  )}
                  <div
                    onClick={() => setActiveNav(item.label)}
                    onMouseEnter={() => setHoveredNav(item.label)}
                    onMouseLeave={() => setHoveredNav(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: collapseSidebar ? '10px 0' : '10px 12px',
                      justifyContent: collapseSidebar ? 'center' : 'flex-start',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#2563eb' : '#334155',
                      background: isActive ? '#eff6ff' : isHovered ? '#f8fafc' : 'transparent',
                      transition: 'all 0.15s',
                      position: 'relative' as const,
                    }}
                  >
                    <span style={{ color: isActive ? '#2563eb' : '#64748b', flexShrink: 0 }}>
                      <Icon d={(icons as any)[item.icon]} size={18} />
                    </span>
                    {!collapseSidebar && <span style={{ flex: 1 }}>{item.label}</span>}
                    {item.badge && !collapseSidebar && (
                      <span style={{ background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 10, padding: '2px 7px', minWidth: 18, textAlign: 'center' as const }}>
                        {item.badge}
                      </span>
                    )}
                    {item.badge && collapseSidebar && (
                      <span style={{ position: 'absolute' as const, top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── COLUMN 2: CONVERSATION LIST ───────────────────────────── */}
        <div style={{ width: 320, background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0f172a', background: '#ffffff' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span>Åpen</span>
              <Icon d={icons.chevronDown} size={14} />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, color: '#64748b', background: '#ffffff' }}
            >
              <Icon d={icons.filter} size={14} />
              <span>Filter</span>
            </div>
            <div style={{ marginLeft: 'auto', color: '#64748b', cursor: 'pointer', padding: 4 }}>
              <Icon d={icons.download} size={16} />
            </div>
          </div>

          {/* Conversations */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map((convo) => {
              const isSelected = selectedConvo === convo.id;
              const isHovered = hoveredConvo === convo.id;

              return (
                <div
                  key={convo.id}
                  onClick={() => setSelectedConvo(convo.id)}
                  onMouseEnter={() => setHoveredConvo(convo.id)}
                  onMouseLeave={() => setHoveredConvo(null)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    background: isSelected ? '#eff6ff' : isHovered ? '#f8fafc' : 'transparent',
                    borderBottom: '1px solid #f1f5f9',
                    borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: convo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>
                    {convo.initials}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{convo.name}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{convo.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1, marginRight: 8 }}>
                        {convo.preview}
                      </span>
                      {convo.unread > 0 && (
                        <span style={{ background: '#22c55e', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', flexShrink: 0 }}>
                          {convo.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── COLUMN 3: CHAT AREA ───────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: selectedConversation.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 15 }}>
                {selectedConversation.initials}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>{selectedConversation.name}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#22c55e', background: '#f0fdf4', padding: '2px 10px', borderRadius: 12 }}>Åpen</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[icons.star, icons.check, icons.robot, icons.dots].map((iconPath, i) => (
                <div
                  key={i}
                  style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLDivElement).style.color = '#0f172a'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = '#64748b'; }}
                >
                  <Icon d={iconPath} size={18} />
                </div>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Date separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>I dag</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {messages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} style={{ textAlign: 'center' as const, padding: '8px 0' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isBot = msg.sender === 'bot';

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isBot ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    maxWidth: '85%',
                    alignSelf: isBot ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Avatar for user messages */}
                  {!isBot && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: selectedConversation.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                      {selectedConversation.initials}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isBot ? 'flex-end' : 'flex-start' }}>
                    {/* Sender label */}
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, paddingLeft: isBot ? 0 : 2, paddingRight: isBot ? 2 : 0 }}>
                      {isBot ? 'Bot' : selectedConversation.name}
                    </span>

                    {/* Message bubble */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: isBot ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isBot ? '#1e293b' : '#ffffff',
                        color: isBot ? '#ffffff' : '#0f172a',
                        border: isBot ? 'none' : '1px solid #e2e8f0',
                        fontSize: 14,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line' as const,
                        boxShadow: isBot ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                        maxWidth: '100%',
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* Timestamp */}
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, paddingLeft: isBot ? 0 : 2, paddingRight: isBot ? 2 : 0 }}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message input */}
          <div style={{ padding: '16px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '10px 16px' }}>
              <input
                type="text"
                placeholder="Skriv en melding..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: '#0f172a', fontFamily }}
              />
              <div
                style={{ width: 36, height: 36, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ─── COLUMN 4: DETAIL PANEL ────────────────────────────────── */}
        {showRightPanel && (
          <div style={{ width: 300, background: '#ffffff', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: 24 }}>
              {/* Tags section */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#64748b' }}><Icon d={icons.tag} size={15} /></span>
                  Tagger
                </h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                  {['Kundeservice', 'Ny bruker'].map((tag) => (
                    <span key={tag} style={{ fontSize: 12, background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  style={{ fontSize: 12, color: '#2563eb', background: 'none', border: '1px dashed #cbd5e1', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500, width: '100%', fontFamily }}
                >
                  + Legg til tagger
                </button>
              </div>

              {/* Summary */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Sammendrag</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>AI-generert</span>
                </div>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  Brukeren spurte om chatbot-funksjonalitet, norsk språkstøtte og priser. Boten ga detaljert informasjon om oppsettet, språkhåndtering og tre prisplaner. Brukeren viste interesse for en gratis prøveperiode.
                </p>
              </div>

              {/* Conversation details */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Samtaledetaljer</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: icons.smile, label: 'Tone', value: 'Vennlig' },
                    { icon: icons.msg, label: 'Totale meldinger', value: '19' },
                    { icon: icons.smile, label: 'Positive', value: '11 (~57%)', color: '#22c55e' },
                    { icon: icons.frown, label: 'Negative', value: '8 (~43%)', color: '#ef4444' },
                    { icon: icons.hash, label: 'ID', value: '#12345' },
                    { icon: icons.calendar, label: 'Startet', value: '23. mai 2023' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                        <Icon d={item.icon} size={15} />
                        <span style={{ fontSize: 13 }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: (item as any).color || '#0f172a' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User details */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Brukerdetaljer</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#64748b' }}><Icon d={icons.mail} size={15} /></span>
                    <span style={{ fontSize: 13, color: '#475569' }}>{selectedConversation.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#64748b' }}><Icon d={icons.phone} size={15} /></span>
                    <span style={{ fontSize: 13, color: '#475569' }}>{selectedConversation.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
