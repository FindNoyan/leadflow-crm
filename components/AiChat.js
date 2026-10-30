'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Chat panel for the dashboard. The browser sends its Supabase access token
// with the question, so the server route can answer from the user's own
// leads only. Logged out (or no Gemini key configured) still works: the
// route returns a clearly labelled demo answer instead of failing.
// Answers come only from the user's own leads and notes, never from the
// internet, and the AI never changes any lead.
export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    try {
      let token = null;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token || null;
      }
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: text }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Could not get an answer.');
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: json.answer, demo: json.demo, sources: json.sources || [] },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="form-card">
      <h2>AI Assistant</h2>
      <p className="muted">
        Ask about your own leads, for example: “Which leads need a follow-up this
        week?” Answers come only from your leads and notes.
      </p>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="muted">No questions yet.</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`chat-msg ${message.role === 'user' ? 'chat-msg-user' : ''}`}
            >
              {message.role === 'ai' && message.demo ? (
                <span className="demo-tag">Demo answer — </span>
              ) : null}
              <span>{message.text}</span>
              {message.role === 'ai' && message.sources && message.sources.length > 0 ? (
                <p className="muted">
                  Sources: {message.sources.map((source) => source.name).join(', ')}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <form onSubmit={handleSend} className="chat-form">
        <input
          className="input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about your leads…"
          aria-label="Ask the AI assistant about your leads"
        />
        <button className="btn btn-primary" type="submit" disabled={sending}>
          {sending ? 'Thinking…' : 'Ask'}
        </button>
      </form>
    </section>
  );
}
