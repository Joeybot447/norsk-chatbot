'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../_lib/supabase/client';
import { useAuth } from '../_lib/supabase/hooks';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Conversation {
  id: string;
  visitor_id: string;
  status: string;
  started_at: string;
  metadata: Record<string, unknown> | null;
  site_name: string;
  last_message: string;
  last_role: string;
  message_count: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  check: 'M20 6L9 17l-5-5',
  dots: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  chevronDown: 'M6 9l6 6 6-6',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  calendar: 'M16 2v4 M8 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  smile: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M8 14s1.5 2 4 2 4-2 4-2',
  frown: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M16 16s-1.5-2-4-2-4 2-4 2',
  hash: 'M4 9h16 M4 15h16 M10 3L8 21 M16 3l-2 18',
  msg: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
};

function truncateVisitorId(id: string): string {
  if (id.length <= 12) return id;
  return id.substring(0, 6) + '…' + id.substring(id.length - 4);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'I går';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('nb-NO', { weekday: 'long' });
  }
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

function getVisitorColor(id: string): string {
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getVisitorInitial(id: string): string {
  return id.charAt(0).toUpperCase();
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [hoveredConvo, setHoveredConvo] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(1400);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Get user's sites
        const { data: sites, error: sitesErr } = await supabase
          .from('sites')
          .select('id')
          .eq('user_id', user.id);
        if (sitesErr) throw sitesErr;
        if (!sites || sites.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const siteIds = sites.map((s: { id: string }) => s.id);

        // Get conversations with latest messages
        const { data: convos, error: convosErr } = await supabase
          .from('conversations')
          .select('id, visitor_id, status, started_at, metadata, sites(name), messages(content, role, created_at)')
          .in('site_id', siteIds)
          .order('started_at', { ascending: false })
          .limit(50);
        if (convosErr) throw convosErr;

        const mapped: Conversation[] = (convos || []).map((c: any) => {
          const msgs = c.messages || [];
          // Sort messages by created_at descending to get latest
          const sorted = [...msgs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const lastMsg = sorted[0];
          return {
            id: c.id,
            visitor_id: c.visitor_id || 'ukjent',
            status: c.status || 'active',
            started_at: c.started_at,
            metadata: c.metadata,
            site_name: c.sites?.name || 'Ukjent nettsted',
            last_message: lastMsg?.content || '',
            last_role: lastMsg?.role || '',
            message_count: msgs.length,
          };
        });

        setConversations(mapped);
        if (mapped.length > 0 && !selectedConvo) {
          setSelectedConvo(mapped[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Kunne ikke laste samtaler');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConvo) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);

    (async () => {
      try {
        const { data, error: msgErr } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', selectedConvo)
          .order('created_at', { ascending: true });
        if (msgErr) throw msgErr;
        setMessages((data || []) as Message[]);
      } catch (err: any) {
        console.error('Failed to load messages:', err);
      } finally {
        setMessagesLoading(false);
      }
    })();
  }, [selectedConvo]);

  const showRightPanel = windowWidth > 1100;
  const selectedConversation = conversations.find((c) => c.id === selectedConvo) || null;

  if (authLoading || loading) {
    return (
      <div style={{ fontFamily, color: '#0f172a', fontSize: 14, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Laster...</div>
          <div style={{ fontSize: 13 }}>Henter samtaler</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily, color: '#0f172a', fontSize: 14, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#ef4444', maxWidth: 400, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Feil</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>{error}</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div style={{ fontFamily, color: '#0f172a', fontSize: 14, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>Ingen samtaler ennå</div>
          <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            Installer widget-koden på nettstedet ditt for å begynne.
          </div>
          <a href="/dashboard/sites" style={{ display: 'inline-block', marginTop: 20, padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Gå til nettsteder
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily, color: '#0f172a', fontSize: 14, height: '100vh', display: 'flex', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Samtaler-liste */}
      <div style={{ width: 320, background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0f172a', background: '#ffffff' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span>Åpen</span>
            <Icon d={icons.chevronDown} size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, color: '#64748b', background: '#ffffff' }}>
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
            const color = getVisitorColor(convo.visitor_id);
            const initial = getVisitorInitial(convo.visitor_id);
            const preview = convo.last_role === 'assistant'
              ? 'Bot: ' + (convo.last_message || '').substring(0, 60)
              : (convo.last_message || '').substring(0, 60);

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
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>
                  {initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{truncateVisitorId(convo.visitor_id)}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{formatTime(convo.started_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1, marginRight: 8 }}>
                      {preview || 'Ingen meldinger'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{convo.site_name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat-område */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat header */}
        {selectedConversation && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: getVisitorColor(selectedConversation.visitor_id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 15 }}>
                {getVisitorInitial(selectedConversation.visitor_id)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>{truncateVisitorId(selectedConversation.visitor_id)}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedConversation.status === 'active' ? '#22c55e' : '#94a3b8' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: selectedConversation.status === 'active' ? '#22c55e' : '#94a3b8', background: selectedConversation.status === 'active' ? '#f0fdf4' : '#f1f5f9', padding: '2px 10px', borderRadius: 12 }}>
                    {selectedConversation.status === 'active' ? 'Åpen' : 'Lukket'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{selectedConversation.site_name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[icons.star, icons.check, icons.dots].map((iconPath, i) => (
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
        )}

        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messagesLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>Laster meldinger...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>Ingen meldinger i denne samtalen</div>
          ) : (
            <>
              {/* Date separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  {messages.length > 0 ? new Date(messages[0].created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              {messages.map((msg) => {
                if (msg.role === 'system') {
                  return (
                    <div key={msg.id} style={{ textAlign: 'center' as const, padding: '8px 0' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                const isBot = msg.role === 'assistant';

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
                    {!isBot && selectedConversation && (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: getVisitorColor(selectedConversation.visitor_id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                        {getVisitorInitial(selectedConversation.visitor_id)}
                      </div>
                    )}

                    {isBot && (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        N
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isBot ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, paddingLeft: isBot ? 0 : 2, paddingRight: isBot ? 2 : 0 }}>
                        {isBot ? 'Bot' : (selectedConversation ? truncateVisitorId(selectedConversation.visitor_id) : 'Besøkende')}
                      </span>
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
                        {msg.content}
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, paddingLeft: isBot ? 0 : 2, paddingRight: isBot ? 2 : 0 }}>
                        {new Date(msg.created_at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Message input (read-only view for now) */}
        <div style={{ padding: '16px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '10px 16px' }}>
            <input
              type="text"
              placeholder="Skriv en melding..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: '#0f172a', fontFamily }}
            />
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detaljpanel */}
      {showRightPanel && selectedConversation && (
        <div style={{ width: 300, background: '#ffffff', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: 24 }}>
            {/* Tags section */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#64748b' }}><Icon d={icons.tag} size={15} /></span>
                Tagger
              </h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                <span style={{ fontSize: 12, background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>
                  {selectedConversation.site_name}
                </span>
              </div>
              <button style={{ fontSize: 12, color: '#2563eb', background: 'none', border: '1px dashed #cbd5e1', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500, width: '100%', fontFamily }}>
                + Legg til tagger
              </button>
            </div>

            {/* Conversation details */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Samtaledetaljer</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: icons.msg, label: 'Totale meldinger', value: String(messages.length) },
                  { icon: icons.hash, label: 'ID', value: '#' + selectedConversation.id.substring(0, 8) },
                  { icon: icons.calendar, label: 'Startet', value: new Date(selectedConversation.started_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                      <Icon d={item.icon} size={15} />
                      <span style={{ fontSize: 13 }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visitor details */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Besøkende</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748b' }}><Icon d={icons.hash} size={15} /></span>
                  <span style={{ fontSize: 13, color: '#475569' }}>{selectedConversation.visitor_id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748b' }}><Icon d={icons.msg} size={15} /></span>
                  <span style={{ fontSize: 13, color: '#475569' }}>{selectedConversation.status === 'active' ? 'Aktiv samtale' : 'Avsluttet'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
