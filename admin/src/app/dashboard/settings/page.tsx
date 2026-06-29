'use client';
import { useState } from 'react';
import { Globe, Webhook, Key, Copy, Check } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';
const WEBHOOK_URL = `${API_URL}/api/v1/webhooks/exely`;

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Backend info */}
      <Section icon={Globe} title="Backend Connection">
        <InfoRow label="API Base URL" value={API_URL} />
        <InfoRow label="Hotel ID" value={process.env.NEXT_PUBLIC_HOTEL_ID ?? 'Not configured'} />
        <p className="text-xs text-slate-500 mt-3">
          Configure these in <code className="bg-slate-100 px-1 py-0.5 rounded">.env.local</code>
          &nbsp;(NEXT_PUBLIC_API_URL, NEXT_PUBLIC_HOTEL_ID).
        </p>
      </Section>

      {/* Exely webhook */}
      <Section icon={Webhook} title="Exely PMS Integration">
        <p className="text-sm text-slate-600 mb-3">
          Enter this URL in your Exely channel manager under Webhooks / Notifications:
        </p>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <code className="flex-1 text-sm text-slate-800 truncate">{WEBHOOK_URL}</code>
          <button onClick={() => copy(WEBHOOK_URL)} className="shrink-0 text-slate-400 hover:text-slate-700">
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Set <code className="bg-slate-100 px-1 py-0.5 rounded">EXELY_WEBHOOK_SECRET</code> in your
          backend <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code> to match the secret configured in Exely.
        </p>
      </Section>

      {/* Env vars reference */}
      <Section icon={Key} title="Backend Environment Variables">
        <div className="space-y-2">
          {[
            ['DATABASE_URL',          'PostgreSQL connection string'],
            ['REDIS_URL',             'Redis connection string'],
            ['JWT_SECRET',            'Admin JWT signing secret (min 64 chars)'],
            ['EXELY_WEBHOOK_SECRET',  'Shared secret for Exely HMAC validation'],
            ['OPENWEATHER_API_KEY',   'OpenWeatherMap API key'],
            ['S3_ENDPOINT',           'S3-compatible storage endpoint'],
            ['S3_BUCKET',             'Media storage bucket name'],
            ['ADMIN_EMAIL',           'Admin login email'],
            ['ADMIN_PASSWORD_HASH',   'bcrypt hash of admin password'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-start gap-3 text-sm">
              <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-mono shrink-0">{key}</code>
              <span className="text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <Icon size={16} className="text-blue-600" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 font-mono text-xs">{value}</span>
    </div>
  );
}
