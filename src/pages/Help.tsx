import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Card } from '../components/Common/Card';

export default function Help() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-sky-400" />
        Help & Documentation
      </h1>
      <Card>
        <p className="text-[var(--text-muted)] text-sm">Documentation and support resources coming soon.</p>
      </Card>
    </div>
  );
}
