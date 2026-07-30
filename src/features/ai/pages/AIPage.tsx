import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, Send, Bot, TrendingUp, AlertTriangle, Lightbulb,
  BarChart3, Target, Activity, LineChart, DollarSign, ScrollText, BrainCircuit, Heart,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { SkeletonCard } from '@/shared/components/Skeleton';
import { aiApi } from '@/services/api';

type AITab = 'chat' | 'analysis' | 'score' | 'predictions' | 'recommendations' | 'insights' | 'summary' | 'health' | 'simulator';

const tabs: { key: AITab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'chat', label: 'Chat', icon: Bot },
  { key: 'analysis', label: 'Análisis', icon: BarChart3 },
  { key: 'score', label: 'Score', icon: Target },
  { key: 'predictions', label: 'Predicciones', icon: LineChart },
  { key: 'recommendations', label: 'Recomendaciones', icon: Lightbulb },
  { key: 'insights', label: 'Insights', icon: Activity },
  { key: 'summary', label: 'Resumen', icon: ScrollText },
  { key: 'health', label: 'Salud Fin.', icon: Heart },
  { key: 'simulator', label: 'Simulador', icon: DollarSign },
];

const chatSuggestions = [
  { icon: TrendingUp, label: 'Análisis de gastos', prompt: 'Analiza mis gastos de este mes y dame un resumen' },
  { icon: Lightbulb, label: 'Recomendaciones', prompt: 'Dame recomendaciones para ahorrar dinero' },
  { icon: AlertTriangle, label: 'Alertas financieras', prompt: '¿Hay alguna alerta financiera que deba conocer?' },
];

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const color = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
      <div style={{
        width: 140, height: 140, borderRadius: '50%', margin: '0 auto var(--space-4)',
        background: `conic-gradient(${color} ${score}%, var(--color-bg-elevated) ${score}%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'var(--color-bg-card)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{grade}</span>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ severity, title, description }: { severity: string; title: string; description: string }) {
  const isPositive = severity === 'positive';
  const isWarning = severity === 'warning';
  const iconBg = isPositive ? 'var(--color-success-dim)' : isWarning ? 'var(--color-warning-dim)' : 'var(--color-danger-dim)';
  const iconColor = isPositive ? 'var(--color-success)' : isWarning ? 'var(--color-warning)' : 'var(--color-danger)';
  return (
    <div className="card" style={{ marginBottom: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-lg)', flexShrink: 0,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}>
          {isPositive ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
        </div>
        <div>
          <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{title}</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function AIPage() {
  const [tab, setTab] = useState<AITab>('chat');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const thisMonth = new Date().getMonth() + 1;
  const thisYear = new Date().getFullYear();

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['ai-analysis', thisMonth, thisYear],
    queryFn: () => aiApi.analyze({ analysis_type: 'monthly', month: thisMonth, year: thisYear }),
    enabled: tab === 'analysis',
  });

  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ['ai-score'],
    queryFn: () => aiApi.getScore(),
    enabled: tab === 'score',
  });

  const { data: predictions, isLoading: predLoading } = useQuery({
    queryKey: ['ai-predictions'],
    queryFn: () => aiApi.getPredictions({ prediction_type: 'monthly', months_ahead: 3 }),
    enabled: tab === 'predictions',
  });

  const { data: recommendationsData, isLoading: recsLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => aiApi.getRecommendations(),
    enabled: tab === 'recommendations',
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiApi.getInsights(),
    enabled: tab === 'insights',
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-summary', thisMonth, thisYear],
    queryFn: () => aiApi.getSummary({ month: thisMonth, year: thisYear }),
    enabled: tab === 'summary',
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['ai-health'],
    queryFn: () => aiApi.getFinancialHealth(),
    enabled: tab === 'health',
  });

  const [simScenario, setSimScenario] = useState('monthly-savings');
  const [simAmount, setSimAmount] = useState('');
  const [simMonths, setSimMonths] = useState('12');
  const [simResult, setSimResult] = useState<{ current_projection?: Record<string, unknown>; simulated_projection?: Record<string, unknown>; difference?: Record<string, unknown>; recommendation?: string } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const handleSend = async (overrideText?: string) => {
    const userMsg = overrideText || input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const response = await aiApi.chat(userMsg);
      setMessages((prev) => [...prev, { role: 'ai', content: response.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Lo siento, ocurrió un error al procesar tu consulta.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!simAmount || Number(simAmount) <= 0) return;
    setSimLoading(true);
    try {
      const result = await aiApi.simulate({ scenario: simScenario, monthly_amount: Number(simAmount), months: Number(simMonths) });
      setSimResult(result);
    } catch {
      setSimResult({ recommendation: 'Error al ejecutar la simulación. Intenta de nuevo.' });
    } finally {
      setSimLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (tab) {
      case 'chat':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h2 style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>¿En qué puedo ayudarte?</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Analiza tus finanzas, obtén recomendaciones y más</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
              {chatSuggestions.map((s) => (
                <button key={s.label} className="btn btn--secondary btn--sm" onClick={() => handleSend(s.prompt)}>
                  <s.icon size={14} /> {s.label}
                </button>
              ))}
            </div>

            {messages.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)', maxHeight: 400, overflowY: 'auto' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)',
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
                      fontSize: 'var(--text-sm)', maxWidth: '80%',
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
          </div>
        );

      case 'analysis':
        if (analysisLoading) return <SkeletonCard count={2} />;
        if (!analysis) return <p style={{ color: 'var(--color-text-muted)' }}>No hay datos de análisis disponibles.</p>;
        return (
          <div>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Análisis mensual</h3>
            {analysis.insights?.map((insight, i) => (
              <div key={i} className="card" style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <BrainCircuit size={18} style={{ color: 'var(--color-brand-500)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>{insight}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'score':
        if (scoreLoading) return <SkeletonCard count={1} />;
        if (!scoreData) return <p style={{ color: 'var(--color-text-muted)' }}>Calculando tu score financiero...</p>;
        return (
          <div>
            <ScoreGauge score={scoreData.score} grade={scoreData.grade} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {scoreData.factors?.map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{f.value}/100</span>
                  </div>
                  <ProgressBar progress={f.value} color={f.value >= 80 ? 'var(--color-success)' : f.value >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'} />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'predictions':
        if (predLoading) return <SkeletonCard count={2} />;
        if (!predictions) return <p style={{ color: 'var(--color-text-muted)' }}>No hay predicciones disponibles.</p>;
        return (
          <div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                Confianza: {Math.round(predictions.confidence * 100)}%
              </p>
            </div>
            {predictions.recommendations?.map((rec, i) => (
              <div key={i} className="card" style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <LineChart size={18} style={{ color: 'var(--color-brand-500)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>{rec}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'recommendations':
        if (recsLoading) return <SkeletonCard count={2} />;
        if (!recommendationsData) return <p style={{ color: 'var(--color-text-muted)' }}>No hay recomendaciones disponibles.</p>;
        return (
          <div>
            {recommendationsData.potential_savings > 0 && (
              <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Ahorro potencial total</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-success)' }}>
                  <MoneyDisplay amount={recommendationsData.potential_savings} />
                </p>
              </div>
            )}
            {recommendationsData.recommendations?.map((rec, i) => (
              <div key={i} className="card" style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{rec.title}</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>{rec.description}</p>
                  </div>
                  {rec.potential_savings > 0 && (
                    <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 'var(--text-sm)', flexShrink: 0, marginLeft: 'var(--space-3)' }}>
                      <MoneyDisplay amount={rec.potential_savings} />
                    </span>
                  )}
                </div>
                <span style={{
                  display: 'inline-block', marginTop: 'var(--space-2)',
                  padding: '1px var(--space-2)', borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)', fontWeight: 600,
                  background: rec.priority === 'high' ? 'var(--color-danger-dim)' : rec.priority === 'medium' ? 'var(--color-warning-dim)' : 'var(--color-success-dim)',
                  color: rec.priority === 'high' ? 'var(--color-danger)' : rec.priority === 'medium' ? 'var(--color-warning)' : 'var(--color-success)',
                }}>
                  {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
              </div>
            ))}
          </div>
        );

      case 'insights':
        if (insightsLoading) return <SkeletonCard count={2} />;
        if (!insightsData) return <p style={{ color: 'var(--color-text-muted)' }}>No hay insights disponibles.</p>;
        return (
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              Periodo: {insightsData.period}
            </p>
            {insightsData.insights?.map((insight, i) => (
              <InsightCard
                key={i}
                severity={insight.severity}
                title={insight.title}
                description={insight.description}
              />
            ))}
          </div>
        );

      case 'summary':
        if (summaryLoading) return <SkeletonCard count={2} />;
        if (!summaryData) return <p style={{ color: 'var(--color-text-muted)' }}>No hay resumen disponible para este mes.</p>;
        return (
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              Periodo: {summaryData.period}
            </p>
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{summaryData.summary}</p>
            </div>
            {summaryData.highlights?.length > 0 && (
              <div>
                <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>Destacados</h4>
                {summaryData.highlights.map((h, i) => (
                  <div key={i} className="card" style={{ marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <Sparkles size={16} style={{ color: 'var(--color-brand-500)', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 'var(--text-sm)' }}>{h}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'health':
        if (healthLoading) return <SkeletonCard count={2} />;
        if (!healthData) return <p style={{ color: 'var(--color-text-muted)' }}>No hay datos de salud financiera.</p>;
        return (
          <div>
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-lg)', flexShrink: 0,
                  background: healthData.status === 'healthy' ? 'var(--color-success-dim)' : healthData.status === 'warning' ? 'var(--color-warning-dim)' : 'var(--color-danger-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: healthData.status === 'healthy' ? 'var(--color-success)' : healthData.status === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)',
                }}>
                  <Heart size={24} />
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Salud Financiera</p>
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, textTransform: 'capitalize' }}>
                    {healthData.status === 'healthy' ? 'Saludable' : healthData.status === 'warning' ? 'En alerta' : 'En riesgo'}
                  </p>
                </div>
              </div>
            </div>
            <ProgressBar progress={healthData.score} color={healthData.score >= 80 ? 'var(--color-success)' : healthData.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'} />
            {healthData.recommendations?.map((rec, i) => (
              <div key={i} className="card" style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <Lightbulb size={16} style={{ color: 'var(--color-brand-500)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 'var(--text-sm)' }}>{rec}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'simulator':
        return (
          <div>
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Simulador financiero</h3>
              <div className="form-group">
                <label className="form-label">Escenario</label>
                <select value={simScenario} onChange={(e) => setSimScenario(e.target.value)}>
                  <option value="monthly-savings">Ahorro mensual</option>
                  <option value="expense-reduction">Reducción de gastos</option>
                  <option value="goal-acceleration">Acelerar meta de ahorro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto mensual</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={simAmount} onChange={(e) => setSimAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Meses a proyectar</label>
                <input type="number" min="1" max="60" value={simMonths} onChange={(e) => setSimMonths(e.target.value)} />
              </div>
              <button className="btn btn--primary" onClick={handleSimulate} disabled={simLoading || !simAmount}>
                <Target size={16} /> {simLoading ? 'Simulando...' : 'Simular'}
              </button>
            </div>

            {simResult && (
              <div className="card">
                <h3 style={{ marginBottom: 'var(--space-3)' }}>Resultado de la simulación</h3>
                {simResult.recommendation && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-elevated)', marginBottom: 'var(--space-3)' }}>
                    <Lightbulb size={16} style={{ color: 'var(--color-brand-500)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 'var(--text-sm)' }}>{simResult.recommendation}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Proyección actual</p>
                    <pre style={{ fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>
                      {JSON.stringify(simResult.current_projection, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Proyección simulada</p>
                    <pre style={{ fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>
                      {JSON.stringify(simResult.simulated_projection, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1>Asistente IA</h1>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', overflowX: 'auto', paddingBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.key} className={`chip ${tab === t.key ? 'chip--active' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <Card hover={false}>
        {renderTabContent()}
      </Card>
    </div>
  );
}
