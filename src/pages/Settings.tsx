import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card } from '../components/Common/Card';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <SettingsIcon className="w-5 h-5 text-sky-400" />
        Settings
      </h1>
      <Card>
        <p className="text-[var(--text-muted)] text-sm">Account and node configuration settings coming soon.</p>
      </Card>
    </div>
  );
}
