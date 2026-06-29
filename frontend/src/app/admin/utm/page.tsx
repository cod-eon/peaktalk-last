'use client';

import { useQuery } from '@tanstack/react-query';
import { Globe, ExternalLink, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { AdminPageHeader, AdminPanel, AdminMetricCard, AdminEmptyState } from '@/components/admin/AdminPrimitives';

interface UtmSourceRow {
  source: string;
  count: number;
  pct: number;
  first_at: string | null;
  latest_at: string | null;
}

interface UtmMediumRow {
  medium: string;
  count: number;
}

interface UtmCampaignRow {
  campaign: string;
  count: number;
}

interface UtmDayPoint {
  date: string;
  source: string;
  count: number;
}

interface UtmStats {
  sources: UtmSourceRow[];
  mediums: UtmMediumRow[];
  campaigns: UtmCampaignRow[];
  by_day: UtmDayPoint[];
  total_tracked: number;
  total_direct: number;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function UtmAdminPage() {
  const { data, isLoading, error } = useQuery<UtmStats>({
    queryKey: ['admin-utm-stats'],
    queryFn: () => api.get('/admin/utm/stats'),
  });

  const topSource = data?.sources?.[0];

  // Build chart data: pivot by_day into series per source
  const chartData = (() => {
    if (!data?.by_day?.length) return [];
    const dates = [...new Set(data.by_day.map((d) => d.date))].sort();
    const sources = [...new Set(data.by_day.map((d) => d.source))];
    return dates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (const source of sources) {
        const point = data.by_day.find((d) => d.date === date && d.source === source);
        row[source] = point?.count ?? 0;
      }
      return row;
    });
  })();

  const chartSources = [...new Set(data?.by_day?.map((d) => d.source) ?? [])];

  const CHART_COLORS = ['#E8600A', '#171717', '#059669', '#7C3AED', '#DC2626', '#0891B2', '#CA8A04'];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Аналитика"
        title="UTM-каналы"
        description="Откуда приходят пользователи. First-touch атрибуция — первый UTM, который увидел посетитель."
        index="04"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-neutral-400" />
        </div>
      )}

      {error && (
        <AdminPanel title="Ошибка">
          <p className="px-5 py-8 text-sm text-red-500">
            Не удалось загрузить UTM-статистику. Попробуйте обновить страницу.
          </p>
        </AdminPanel>
      )}

      {data && (
        <>
          {/* Metrics */}
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminMetricCard
              label="Всего с UTM"
              value={String(data.total_tracked)}
              helper="Зарегистрированных с UTM-данными"
              icon={Globe}
            />
            <AdminMetricCard
              label="Direct / Organic"
              value={String(data.total_direct)}
              helper="Без UTM-параметров"
              icon={ExternalLink}
            />
            <AdminMetricCard
              label="Топ источник"
              value={topSource?.source ?? '—'}
              helper={topSource ? `${topSource.count} регистраций (${topSource.pct}%)` : 'Нет данных'}
              icon={Globe}
            />
          </div>

          {/* Source table */}
          <AdminPanel title="Источники" subtitle="Распределение регистраций по utm_source">
            {data.sources.length === 0 ? (
              <AdminEmptyState
                title="Нет данных"
                description="UTM-данные появятся после первых регистраций с UTM-параметрами."
                icon={Globe}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/8 bg-[rgba(17,24,39,0.02)]">
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Источник</th>
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 text-right">Регистрации</th>
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 text-right">Доля</th>
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Первая</th>
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Последняя</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sources.map((row) => (
                      <tr key={row.source} className="border-b border-black/5 hover:bg-[rgba(17,24,39,0.02)] transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-neutral-900">{row.source}</td>
                        <td className="px-5 py-3 text-sm text-neutral-700 text-right font-mono">{row.count}</td>
                        <td className="px-5 py-3 text-sm text-neutral-500 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-1.5 bg-[#E8600A]" />
                            {row.pct}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-neutral-500">{formatDate(row.first_at)}</td>
                        <td className="px-5 py-3 text-sm text-neutral-500">{formatDate(row.latest_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>

          {/* Chart */}
          {chartData.length > 0 && (
            <AdminPanel title="Динамика по источникам" subtitle="Регистрации за последние 30 дней">
              <div className="px-4 py-4" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return `${d.getDate()}.${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(v) => {
                        const d = new Date(String(v));
                        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                      }}
                    />
                    <Legend />
                    {chartSources.map((source, i) => (
                      <Bar
                        key={source}
                        dataKey={source}
                        stackId="a"
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        radius={i === chartSources.length - 1 ? [2, 2, 0, 0] : undefined}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>
          )}

          {/* Mediums & Campaigns side by side */}
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminPanel title="Каналы (utm_medium)" subtitle="Тип трафика">
              {data.mediums.length === 0 ? (
                <p className="px-5 py-6 text-sm text-neutral-400">Нет данных</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black/8 bg-[rgba(17,24,39,0.02)]">
                        <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Канал</th>
                        <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 text-right">Кол-во</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mediums.map((row) => (
                        <tr key={row.medium} className="border-b border-black/5">
                          <td className="px-5 py-2.5 text-sm text-neutral-900">{row.medium}</td>
                          <td className="px-5 py-2.5 text-sm text-neutral-700 text-right font-mono">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminPanel>

            <AdminPanel title="Кампании (utm_campaign)" subtitle="Названия кампаний">
              {data.campaigns.length === 0 ? (
                <p className="px-5 py-6 text-sm text-neutral-400">Нет данных</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black/8 bg-[rgba(17,24,39,0.02)]">
                        <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Кампания</th>
                        <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 text-right">Кол-во</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.campaigns.map((row) => (
                        <tr key={row.campaign} className="border-b border-black/5">
                          <td className="px-5 py-2.5 text-sm text-neutral-900">{row.campaign}</td>
                          <td className="px-5 py-2.5 text-sm text-neutral-700 text-right font-mono">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminPanel>
          </div>
        </>
      )}
    </div>
  );
}
