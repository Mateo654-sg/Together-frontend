import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Smile, Heart, Target, DollarSign } from 'lucide-react';
import { chatApi, couplesApi } from '@/services/api';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import type { ChatMessage } from '@/types/api';

const motivationalMessages = [
  '¡Vamos juntos por esa meta! 💪',
  'Cada día estamos más cerca de nuestros sueños 🌟',
  'Gracias por ser mi compañero financiero ❤️',
  'Lo estamos haciendo increíble 🎉',
  'Juntos podemos lograrlo todo 🤝',
];

const quickEmojis = ['💰', '❤️', '🔥', '🎉', '💪', '🙌', '😊', '🤗', '🌟', '📈'];

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: couple } = useQuery({
    queryKey: ['couple-status'],
    queryFn: () => couplesApi.getStatus(),
  });

  const partnerId = couple?.partner?.id;

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['chat', partnerId],
    queryFn: () => chatApi.getAll({ partner_id: partnerId }),
    enabled: Boolean(partnerId),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.send({ receiver_id: partnerId!, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      setMessage('');
    },
  });

  const shareMutation = useMutation({
    mutationFn: (content: string) => chatApi.send({
      receiver_id: partnerId!,
      content,
      message_type: 'share',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      toast('success', 'Información compartida');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.data]);

  const messages = messagesData?.data || [];

  if (!partnerId) {
    return (
      <div>
        <div className="dashboard-header"><h1>Chat de Pareja</h1></div>
        <EmptyState
          icon={Heart}
          title="Vincula una pareja primero"
          message="Necesitas tener una pareja vinculada para usar el chat."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Chat de Pareja</h1>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--space-4)', padding: 'var(--space-2)' }}>
          {messages.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
              <Heart size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
              <p>No hay mensajes aún. ¡Empieza a conversar con tu pareja!</p>
            </div>
          )}
          {messages.map((msg: ChatMessage) => {
            const isMe = msg.sender_id !== partnerId;
            const isShare = msg.message_type === 'share';
            return (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                marginBottom: 'var(--space-2)',
              }}>
                <div style={{
                  maxWidth: '75%',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: isMe ? 'var(--radius-2xl) var(--radius-2xl) var(--space-2) var(--radius-2xl)' : 'var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--space-2)',
                  background: isMe ? 'var(--gradient-brand)' : 'var(--color-bg-elevated)',
                  color: isMe ? 'white' : 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)',
                  ...(isShare ? { border: '1px solid var(--color-brand-500)', background: isMe ? 'var(--gradient-brand)' : 'var(--color-brand-50)' } : {}),
                }}>
                  {isShare && <DollarSign size={12} style={{ marginRight: 'var(--space-1)' }} />}
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowEmojis(!showEmojis)}>
              <Smile size={18} />
            </button>
            {showEmojis && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, marginBottom: 'var(--space-2)',
                display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap',
                padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)',
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)',
                width: 200, zIndex: 10,
              }}>
                {quickEmojis.map((emoji) => (
                  <button key={emoji} className="btn btn--ghost btn--sm" style={{ fontSize: 'var(--text-lg)' }}
                    onClick={() => { setMessage(m => m + emoji); setShowEmojis(false); }}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            style={{ flex: 1 }}
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && message.trim() && sendMutation.mutate(message.trim())}
          />

          <button className="btn btn--primary btn--sm" onClick={() => message.trim() && sendMutation.mutate(message.trim())} disabled={!message.trim() || sendMutation.isPending}>
            <Send size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button className="btn btn--ghost btn--sm" style={{ fontSize: 'var(--text-xs)' }}
            onClick={() => shareMutation.mutate(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)])}>
            <Heart size={12} /> Motivación
          </button>
          <button className="btn btn--ghost btn--sm" style={{ fontSize: 'var(--text-xs)' }}
            onClick={() => shareMutation.mutate('¡Mira nuestra meta! 🎯 Vamos a lograrlo juntos 💪')}>
            <Target size={12} /> Compartir meta
          </button>
          <button className="btn btn--ghost btn--sm" style={{ fontSize: 'var(--text-xs)' }}
            onClick={() => shareMutation.mutate('Revisa nuestras finanzas compartidas 📊 ¡Vamos muy bien!')}>
            <DollarSign size={12} /> Compartir finanzas
          </button>
        </div>
      </div>
    </div>
  );
}
