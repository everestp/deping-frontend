// ─────────────────────────────────────────────
// components/miner/RegForm.tsx
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Cpu, Key, MapPin, Globe, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../Common/Button';
import type { RegisterPayload } from '../../types/miner';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria',
  'Bangladesh','Belgium','Bolivia','Brazil','Canada','Chile','China',
  'Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt',
  'Ethiopia','Finland','France','Germany','Ghana','Greece','Hungary',
  'India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Japan','Jordan','Kazakhstan','Kenya','Malaysia','Mexico','Morocco',
  'Nepal','Netherlands','New Zealand','Nigeria','Norway','Pakistan',
  'Peru','Philippines','Poland','Portugal','Romania','Russia',
  'Saudi Arabia','Serbia','Singapore','South Africa','South Korea',
  'Spain','Sri Lanka','Sweden','Switzerland','Taiwan','Thailand',
  'Turkey','Ukraine','United Arab Emirates','United Kingdom',
  'United States','Uruguay','Venezuela','Vietnam',
];

interface RegFormProps {
  ownerPubkey: string;
  registering: boolean;
  error: string | null;
  onRegister: (payload: RegisterPayload) => Promise<void>;
}

const inputClass = [
  'w-full font-mono-data text-sm rounded-lg py-2.5 pl-9 pr-4 outline-none transition-colors',
  'bg-white/5',
].join(' ');

const inputStyle = {
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
};

export function RegForm({ ownerPubkey, registering, error, onRegister }: RegFormProps) {
  const [nodePubkey, setNodePubkey] = useState('');
  const [latitude, setLatitude]     = useState('');
  const [longitude, setLongitude]   = useState('');
  const [region, setRegion]         = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function validate(): boolean {
    if (!nodePubkey.trim())                         { setLocalError('Node public key is required.'); return false; }
    if (!latitude.trim() || isNaN(Number(latitude))){ setLocalError('Enter a valid latitude.'); return false; }
    if (!longitude.trim()||isNaN(Number(longitude))){ setLocalError('Enter a valid longitude.'); return false; }
    if (!region)                                     { setLocalError('Select a region (country).'); return false; }
    return true;
  }

  async function handleSubmit() {
    setLocalError(null);
    if (!validate()) return;
   await onRegister({
      owner_pubkey: ownerPubkey, // From props
      node_pubkey: nodePubkey.trim(), // Correctly mapped to node_pubkey
      region: region,
      latitude: latitude,
      longitude: longitude,
    });
  }

  const displayError = localError ?? error;

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <Cpu className="w-7 h-7" style={{ color: 'var(--accent-green)' }} />
        </div>
        <h2 className="font-mono-data text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Register Validator Node
        </h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Fill in your node details to register. Staking comes next.
        </p>
      </div>

      {/* Form card */}
      <div className="glass rounded-2xl p-5 space-y-4">
        {/* Owner pubkey — read only */}
        <div>
          <label className="block text-xs font-mono-data font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Owner Public Key
          </label>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
          >
            <Key className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span className="font-mono-data text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {ownerPubkey}
            </span>
          </div>
        </div>

        {/* Node pubkey */}
        <div>
          <label className="block text-xs font-mono-data font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Node Public Key
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={nodePubkey}
              onChange={(e) => setNodePubkey(e.target.value)}
              placeholder="Enter node public key..."
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Lat / Lng */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Latitude',  val: latitude,  set: setLatitude,  ph: '0.0000' },
            { label: 'Longitude', val: longitude, set: setLongitude, ph: '0.0000' },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <label className="block text-xs font-mono-data font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  step="0.0001"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Region / Country */}
        <div>
          <label className="block text-xs font-mono-data font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Region (Country)
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={`${inputClass} appearance-none`}
              style={{ ...inputStyle, background: 'rgba(255,255,255,0.05)' }}
            >
              <option value="" style={{ background: 'var(--bg-primary)' }}>Select country...</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} style={{ background: 'var(--bg-primary)' }}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {displayError && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono-data animate-fade-in-up"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--accent-red)' }}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {displayError}
          </div>
        )}

        <Button className="w-full" loading={registering} onClick={handleSubmit}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {registering ? 'Registering...' : 'Register Node'}
        </Button>
      </div>
    </div>
  );
}
