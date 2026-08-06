import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, DollarSign, Heart, Send, Share2, Smile, Target } from 'lucide-react';
import { chatApi, couplesApi } from '@/services/api';
import { useToast } from '@/shared/components/Toast';
import { useAuthStore } from '@/features/auth/store/auth-store';

const motivationalMessages = [
  '¡Vamos juntos por esa meta! 💪',
  'Cada día estamos más cerca de nuestros sueños 🌟',
  'Gracias por ser mi compañero financiero ❤️',
  'Lo estamos haciendo increíble 🎉',
  'Juntos podemos lograrlo todo 🤝',
];

const quickEmojis = ['💰', '❤️', '🔥', '🎉', '💪', '🙌', '😊', '🤗', '🌟', '📈'];

function getDayLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((startToday - startDate) / 86_400_000);

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);

  const { data: couple, isLoading: coupleLoading } = useQuery({
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

  const orderedMessages = useMemo(() => {
    const list = messagesData?.data || [];
    return [...list].reverse();
  }, [messagesData]);

  const lastMessageId = orderedMessages.length > 0
    ? orderedMessages[orderedMessages.length - 1].id
    : undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lastMessageId, isLoading]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiWrapRef.current && !emojiWrapRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [message]);

  const handleSend = () => {
    const content = message.trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate(content);
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage((m) => m + emoji);
    textareaRef.current?.focus();
  };

  if (!partnerId && !coupleLoading) {
    return (
      <div>
        <div className="dashboard-header"><h1>Chat de Pareja</h1></div>
        <div className="card chat-empty-screen">
          <Heart size={34} />
          <p>Vincula una pareja primero</p>
          <span>Necesitas tener una pareja vinculada para usar el chat.</span>
        </div>
      </div>
    );
  }

  const partnerName = [couple?.partner?.first_name, couple?.partner?.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <div className="dashboard-header">
        <h1>Chat de Pareja</h1>
      </div>

      <div className="card chat-shell">
        <div className="chat-header">
          <div className="chat-header__avatar">
            {couple?.partner?.first_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="chat-header__info">
            <span className="chat-header__name">{partnerName || 'Mi pareja'}</span>
            <span className="chat-header__status">En pareja</span>
          </div>
        </div>

        <div className="chat-messages">
          {isLoading ? (
            <div className="chat-skeletons" aria-hidden="true">
              <span className="skeleton chat-skeleton chat-skeleton--own" />
              <span className="skeleton chat-skeleton" />
              <span className="skeleton chat-skeleton" />
              <span className="skeleton chat-skeleton--own" />
            </div>
          ) : orderedMessages.length === 0 ? (
            <div className="chat-empty">
              <Heart size={34} />
              <p>No hay mensajes todavía</p>
              <span>¡Empieza la conversación con tu pareja!</span>
            </div>
          ) : (
            orderedMessages.map((msg, index) => {
              const isMe = msg.sender_id === user?.id;
              const isShare = msg.message_type === 'share';
              const prev = orderedMessages[index - 1];
              const next = orderedMessages[index + 1];
              const isFirstInGroup = !prev || prev.sender_id !== msg.sender_id;
              const isLastInGroup = !next || next.sender_id !== msg.sender_id;
              const showDateDivider = !prev || getDayLabel(prev.created_at) !== getDayLabel(msg.created_at);

              return (
                <div key={msg.id} className="chat-group">
                  {showDateDivider && (
                    <div className="chat-date-divider">{getDayLabel(msg.created_at)}</div>
                  )}
                  <div className={`chat-row ${isFirstInGroup ? 'chat-row--start' : ''} ${isMe ? 'chat-row--own' : ''}`}>
                    <div className={[
                      'chat-bubble',
                      isMe ? 'chat-bubble--own' : '',
                      isLastInGroup ? 'chat-bubble--tail' : '',
                      !isLastInGroup ? 'chat-bubble--grouped' : '',
                      isShare ? 'chat-bubble--share' : '',
                    ].filter(Boolean).join(' ')}>
                      {isShare && (
                        <span className="chat-bubble__tag">
                          <Share2 size={11} /> Información compartida
                        </span>
                      )}
                      <div className="chat-bubble__text">{msg.content}</div>
                      <div className="chat-bubble__meta">
                        <span className="chat-bubble__time">{formatTime(msg.created_at)}</span>
                        {isMe && <Check className="chat-bubble__check" size={12} />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-composer">
          <div className="chat-quickbar">
            <button className="chat-quick-btn" type="button"
              onClick={() => shareMutation.mutate(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)])}>
              <Heart size={12} /> Motivación
            </button>
            <button className="chat-quick-btn" type="button"
              onClick={() => shareMutation.mutate('¡Mira nuestra meta! 🎯 Vamos a lograrlo juntos 💪')}>
              <Target size={12} /> Compartir meta
            </button>
            <button className="chat-quick-btn" type="button"
              onClick={() => shareMutation.mutate('Revisa nuestras finanzas compartidas 📊 ¡Vamos muy bien!')}>
              <DollarSign size={12} /> Compartir finanzas
            </button>
          </div>

          <div className="chat-composer__row">
            <div className="chat-emoji-wrap" ref={emojiWrapRef}>
              <button className="chat-icon-btn" type="button" onClick={() => setShowEmojis((v) => !v)} aria-label="Emojis">
                <Smile size={20} />
              </button>
              {showEmojis && (
                <div className="chat-emoji-picker">
                  {quickEmojis.map((emoji) => (
                    <button key={emoji} className="chat-emoji" type="button" onClick={() => addEmoji(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <button
              className="chat-send-btn"
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              aria-label="Enviar mensaje"
            >
              {sendMutation.isPending ? <span className="btn__loader" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
