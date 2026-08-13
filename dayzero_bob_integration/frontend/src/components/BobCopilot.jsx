import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { chatWithBob } from '../services/api';

/**
 * BobCopilot — floating AI co-pilot chat panel.
 * Renders a chat bubble in the bottom-right corner of every page.
 * Passes the current user's role and the page name so the backend
 * can return context-aware responses.
 *
 * Props:
 *   user        {object}  — current logged-in user (id, role, full_name)
 *   pageContext  {string}  — page identifier e.g. "engineer_dashboard"
 */
function BobCopilot({ user, pageContext = '' }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bob',
      text: user?.role === 'admin'
        ? "Hi! I'm Bob, your onboarding co-pilot 👋  Ask me about pending requests, team status, or say *approve req_0001*."
        : "Hi! I'm Bob, your onboarding co-pilot 👋  Ask me about your modules, learning path, or how to request access.",
      type: 'greeting',
    },
  ]);
  const bottomRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { from: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatWithBob(
        text,
        user?.id || user?.username,
        user?.role,
        pageContext
      );
      const data = res.data;
      setMessages(prev => [
        ...prev,
        {
          from: 'bob',
          text: data.message,
          type: data.type,
          payload: data.data,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          from: 'bob',
          text: "Sorry, I couldn't reach the backend right now. Make sure the server is running on port 8080.",
          type: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /** Render markdown-lite: bold (**text**) and bullet points */
  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split('\n').map((line, i) => {
      // bold
      const segments = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={j}>{seg.slice(2, -2)}</strong>;
        }
        // italic hint (* text *)
        if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
          return <em key={j} style={{ color: '#57606a' }}>{seg.slice(1, -1)}</em>;
        }
        return seg;
      });
      return <span key={i}>{segments}<br /></span>;
    });
    return parts;
  };

  const typeColour = {
    action:   '#166534',
    error:    '#991b1b',
    greeting: '#1e40af',
    status:   '#1e40af',
    requests: '#854d0e',
    progress: '#166534',
    help:     '#4b5563',
    fallback: '#57606a',
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask Bob"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#0f62fe',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(15,98,254,0.45)',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open
          ? <X size={22} color="#fff" />
          : <MessageCircle size={22} color="#fff" />}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: 360,
            maxWidth: 'calc(100vw - 48px)',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: '#0f62fe',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <MessageCircle size={18} color="#fff" />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Bob Co-pilot</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                Onboarding AI assistant
              </div>
            </div>
          </div>

          {/* Message list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 340,
            minHeight: 200,
            background: '#f7f8fa',
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: msg.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.from === 'user' ? '#0f62fe' : '#fff',
                    color: msg.from === 'user' ? '#fff' : (typeColour[msg.type] || '#1f2328'),
                    fontSize: 13,
                    lineHeight: 1.55,
                    border: msg.from === 'bob' ? '1px solid #e5e7eb' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {msg.from === 'bob' ? renderText(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#57606a', fontSize: 12 }}>
                <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                Bob is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #e5e7eb',
            background: '#fff',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Bob…"
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid #d0d7de',
                borderRadius: 8,
                padding: '7px 10px',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? '#0f62fe' : '#e5e7eb',
                border: 'none',
                borderRadius: 8,
                padding: '8px 10px',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <Send size={15} color={input.trim() && !loading ? '#fff' : '#9ca3af'} />
            </button>
          </div>
        </div>
      )}

      {/* Spin keyframe — injected once */}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}

export default BobCopilot;
