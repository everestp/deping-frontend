import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Coins, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Button } from '../Common/Button';

type ActionTab = 'stake_more' | 'withdraw_stake' | 'delete_account';

interface StakePanelProps {
  stakedAmount: number;
  walletBalance: number;
  nodePda: string;
  onStakeMore: (amount: number) => Promise<string>;
  onWithdrawStake: (amount: number) => Promise<string>;
  onDeleteAccount: (amount: number) => Promise<string>;
  validateUnstake: (payload: { signature: string; node_pda: string; amount: number }) => Promise<void>;
}

export function StakePanel({
  stakedAmount,
  walletBalance,

  nodePda,
  onStakeMore,
  onWithdrawStake,
  onDeleteAccount
}: StakePanelProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ActionTab>('stake_more');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function handleAction() {
    setFeedback(null);
    const val = parseFloat(amount);

    try {
      setProcessing(true);
      let txSignature = '';

      if (tab === 'stake_more') {
        if (isNaN(val) || val <= 0) throw new Error('Enter a valid amount.');
        txSignature = await onStakeMore(val);
        setFeedback({ type: 'success', msg: `Successfully staked ${val.toFixed(4)} DPNG.` });
      } 
      else if (tab === 'withdraw_stake') {
        if (isNaN(val) || val <= 0) throw new Error('Enter a valid amount.');
        if (val > stakedAmount) throw new Error('Cannot withdraw more than your staked amount.');
        
        txSignature = await onWithdrawStake(val);
        // // Sync with your Web2 DB after successful chain TX
        // await validateUnstake({ signature: txSignature, node_pda: nodePda, amount: val });
        setFeedback({ type: 'success', msg: `Withdrawal of ${val.toFixed(4)} DPNG successful.` });
      } 
      else if (tab === 'delete_account') {
        txSignature = await onDeleteAccount(stakedAmount);
        setFeedback({ type: 'success', msg: 'Account deleted. Redirecting...' });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      setAmount('');
    } catch (err: any) {
      console.error("Action Error:", err);
      setFeedback({ type: 'error', msg: err?.message || 'Transaction failed.' });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border-subtle)' }}>
      {/* Header with detailed metrics */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Staking Controls</h2>
          </div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>PDA: {nodePda.slice(0, 8)}...{nodePda.slice(-4)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Staked</p>
          <p className="font-mono-data font-semibold" style={{ color: 'var(--accent-green)' }}>{stakedAmount.toFixed(4)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg p-0.5 mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
        {(['stake_more', 'withdraw_stake', 'delete_account'] as ActionTab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setFeedback(null); setAmount(t === 'delete_account' ? stakedAmount.toString() : ''); }}
            className="flex-1 py-2 rounded-md text-[10px] font-bold uppercase transition-all"
            style={tab === t ? { background: 'rgba(56,189,248,0.15)', color: 'var(--accent-blue)' } : { color: 'var(--text-muted)' }}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Inputs */}
      {tab !== 'delete_account' ? (
        <div className="mb-5">
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span>Amount to {tab === 'stake_more' ? 'Stake' : 'Withdraw'}</span>
            <span>Wallet: {walletBalance.toFixed(2)}</span>
          </div>
          <div className="relative">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0000"
              className="w-full bg-white/5 border border-border-subtle rounded-lg py-2.5 pl-9 pr-4 outline-none text-sm font-mono-data"
            />
          </div>
        </div>
      ) : (
        <div className="p-3 mb-5 rounded-lg text-[11px] leading-relaxed" style={{ background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          <ShieldAlert className="w-4 h-4 mb-1" />
          <p>Permanently delete node account? This withdraws the full <b>{stakedAmount.toFixed(4)} DPNG</b> and returns rent to your wallet.</p>
        </div>
      )}

      {feedback && (
        <div className={`p-3 rounded-lg text-[11px] mb-4 flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {feedback.msg}
        </div>
      )}

      <Button className="w-full text-xs font-bold uppercase" loading={processing} onClick={handleAction}>
        {tab === 'stake_more' ? 'Confirm Stake' : tab === 'withdraw_stake' ? 'Withdraw Stake' : 'Delete Account Forever'}
      </Button>
    </div>
  );
}