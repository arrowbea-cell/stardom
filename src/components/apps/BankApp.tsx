import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/supabase-helpers';
import { Landmark, Send, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props { profile: Profile; }

export default function BankApp({ profile }: Props) {
  const [artists, setArtists] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'send' | 'history'>('send');

  useEffect(() => {
    supabase.from('profiles').select('id, artist_name, avatar_url').neq('id', profile.id)
      .then(({ data }) => { if (data) setArtists(data); });
    loadTransactions();
  }, [profile.id]);

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('bank_transactions')
      .select('*, sender:profiles!bank_transactions_sender_id_fkey(artist_name), receiver:profiles!bank_transactions_receiver_id_fkey(artist_name)')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
  };

  const sendMoney = async () => {
    const amt = parseInt(amount);
    if (!selectedArtist || !amt || amt <= 0) { toast.error('Enter valid amount and recipient'); return; }
    if (amt > profile.current_money) { toast.error('Insufficient funds'); return; }

    // Deduct from sender
    await supabase.from('profiles').update({ current_money: profile.current_money - amt }).eq('id', profile.id);
    // Add to receiver
    const { data: recv } = await supabase.from('profiles').select('current_money').eq('id', selectedArtist).single();
    if (recv) {
      await supabase.from('profiles').update({ current_money: recv.current_money + amt }).eq('id', selectedArtist);
    }
    // Record transaction
    await supabase.from('bank_transactions').insert({
      sender_id: profile.id, receiver_id: selectedArtist, amount: amt, note
    });
    toast.success(`Sent ${formatMoney(amt)}!`);
    setAmount(''); setNote('');
    loadTransactions();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-4 pb-3 text-center">
        <Landmark className="w-8 h-8 text-primary mx-auto mb-2" />
        <h2 className="font-display text-lg font-bold">STARDOM Bank</h2>
        <p className="text-2xl font-display font-bold text-primary mt-2">{formatMoney(profile.current_money)}</p>
        <p className="text-xs text-muted-foreground">Available Balance</p>
      </div>

      <div className="flex border-b border-border">
        {(['send', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize ${tab === t ? 'tab-active' : 'tab-inactive'}`}>{t}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {tab === 'send' && (
          <div className="space-y-3">
            <select value={selectedArtist} onChange={e => setSelectedArtist(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm">
              <option value="">Select recipient...</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.artist_name}</option>)}
            </select>
            <Input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} />
            <Input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
            <Button onClick={sendMoney} className="w-full"><Send className="w-4 h-4 mr-1" /> Send Money</Button>
          </div>
        )}
        {tab === 'history' && (
          transactions.length > 0 ? transactions.map(t => {
            const isSender = t.sender_id === profile.id;
            return (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSender ? 'bg-destructive/20' : 'bg-primary/20'}`}>
                  {isSender ? <ArrowUpRight className="w-4 h-4 text-destructive" /> : <ArrowDownLeft className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{isSender ? `To ${t.receiver?.artist_name}` : `From ${t.sender?.artist_name}`}</p>
                  {t.note && <p className="text-xs text-muted-foreground truncate">{t.note}</p>}
                </div>
                <span className={`text-sm font-mono ${isSender ? 'text-destructive' : 'text-primary'}`}>
                  {isSender ? '-' : '+'}{formatMoney(t.amount)}
                </span>
              </motion.div>
            );
          }) : <p className="text-center text-sm text-muted-foreground py-8">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
