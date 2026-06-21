'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ServiceRequest } from '@/types';
import { AlarmClock, BellRing, Car, Check, X, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

const TYPE_META: Record<
  string,
  { label: string; icon: typeof AlarmClock; color: string }
> = {
  ALARM:     { label: 'Wake-up call', icon: AlarmClock, color: 'bg-rose-100 text-rose-600' },
  RECEPTION: { label: 'Reception',    icon: BellRing,   color: 'bg-amber-100 text-amber-600' },
  TAXI:      { label: 'Taxi',         icon: Car,        color: 'bg-yellow-100 text-yellow-700' },
};

const STATUS_META: Record<string, string> = {
  PENDING:      'bg-blue-100 text-blue-700',
  ACKNOWLEDGED: 'bg-amber-100 text-amber-700',
  RESOLVED:     'bg-emerald-100 text-emerald-700',
  CANCELLED:    'bg-slate-100 text-slate-500',
};

const FILTERS = ['ALL', 'PENDING', 'ACKNOWLEDGED', 'RESOLVED'] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function RequestsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['requests', filter],
    queryFn: () => api.getRequests(filter === 'ALL' ? undefined : filter),
    refetchInterval: 4000, // near-live without SSE
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateRequest(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });

  const pendingCount = requests.filter(
    (r: ServiceRequest) => r.status === 'PENDING',
  ).length;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Service requests</h1>
          <p className="text-sm text-slate-500">
            {pendingCount > 0
              ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}`
              : 'No pending requests'}{' '}
            · auto-refreshes
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                filter === f
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No requests {filter !== 'ALL' ? `with status ${filter.toLowerCase()}` : 'yet'}.
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((r: ServiceRequest) => {
            const meta = TYPE_META[r.type] ?? {
              label: r.type,
              icon: HelpCircle,
              color: 'bg-slate-100 text-slate-600',
            };
            const Icon = meta.icon;
            const isOpen = r.status === 'PENDING' || r.status === 'ACKNOWLEDGED';
            return (
              <div
                key={r.id}
                className={clsx(
                  'flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm',
                  r.status === 'PENDING' ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200',
                )}
              >
                <div className={clsx('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', meta.color)}>
                  <Icon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800">{meta.label}</p>
                    <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-bold', STATUS_META[r.status] ?? 'bg-slate-100 text-slate-500')}>
                      {r.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      via {r.source}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {r.hotelName} · Room <span className="font-semibold">{r.roomNumber}</span>
                    {r.guestName ? ` · ${r.guestName}` : ''} · {timeAgo(r.createdAt)}
                  </p>
                  {r.note && <p className="mt-1 truncate text-xs text-slate-400">“{r.note}”</p>}
                </div>

                {isOpen && (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => update.mutate({ id: r.id, status: 'ACKNOWLEDGED' })}
                        disabled={update.isPending}
                        className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => update.mutate({ id: r.id, status: 'RESOLVED' })}
                      disabled={update.isPending}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <Check size={14} /> Resolve
                    </button>
                    <button
                      onClick={() => update.mutate({ id: r.id, status: 'CANCELLED' })}
                      disabled={update.isPending}
                      title="Cancel"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
