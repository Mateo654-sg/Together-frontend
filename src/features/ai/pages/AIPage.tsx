import { useState } from 'react';
import { Sparkles, Send, Bot, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { aiApi } from '@/services/api';

const suggestions = [
  { icon: TrendingUp, label: 'Análisis de gastos', prompt: 'Analiza mis gastos de este mes y dame un resumen' },
  { icon: Lightbulb, label: 'Recomendaciones', prompt: 'Dame recomendaciones para ahorrar dinero' },
  { icon: AlertTriangle, label: 'Alertas financieras', prompt: '¿Hay alguna alerta financiera que deba conocer?' },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (overrideText?: string) => {
    const userMsg = overrideText || input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const response = await aiApi.chat(userMsg);
      setMessages((prev) => [...prev, { role: 'ai', content: response.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Lo siento, ocurrió un error al procesar tu consulta. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Asistente IA
        </h1>
      </div>

      <Card hover={false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>¿En qué puedo ayudarte?</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Analiza tus finanzas, obtén recomendaciones y más
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          {suggestions.map((s) => (
            <button
              key={s.label}
              className="btn btn--secondary btn--sm"
              onClick={() => handleSend(s.prompt)}
            >
              <s.icon size={14} /> {s.label}
            </button>
          ))}
        </div>

        {messages.length > 0 && (
          <div style={{ marginBottom: 'var(--space-4)', maxHeight: 400, overflowY: 'auto' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-3)',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--radius-full)',
                  background: msg.role === 'user' ? 'var(--gradient-brand)' : 'var(--color-bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: msg.role === 'user' ? 'white' : 'var(--color-brand-500)',
                }}>
                  {msg.role === 'user' ? 'T' : <Bot size={16} />}
                </div>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: msg.role === 'user' ? 'var(--radius-2xl) var(--radius-2xl) var(--space-2) var(--radius-2xl)' : 'var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--space-2)',
                  background: msg.role === 'user' ? 'var(--gradient-brand)' : 'var(--color-bg-elevated)',
                  color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)',
                  maxWidth: '80%',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="var(--color-brand-500)" />
                </div>
                <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 'var(--radius-2xl)' }} />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            className="topbar__search"
            style={{ flex: 1, width: 'auto' }}
            placeholder="Escribe tu consulta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn--primary" onClick={() => handleSend()} disabled={!input.trim() || loading}>
            <Send size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}