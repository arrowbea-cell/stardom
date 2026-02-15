import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Handshake, Send, Check, X, Music, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props {
  profile: Profile;
}

interface Collab {
  id: string;
  sender_id: string;
  receiver_id: string;
  song_title: string;
  fee: number;
  status: string;
  created_at: string;
  sender?: { artist_name: string; avatar_url: string | null };
  receiver?: { artist_name: string; avatar_url: string | null };
}

export default function CollabApp({ profile }: Props) {
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [fee, setFee] = useState('1000');
  const [tab, setTab] = useState<'send' | 'incoming' | 'sent'>('incoming');

  useEffect(() => {
    loadCollabs();
    supabase.from('profiles').select('id, artist_name, avatar_url')
      .neq('id', profile.id)
      .then(({ data }) => { if (data) setArtists(data); });
  }, [profile.id]);

  const loadCollabs = async () => {
    const { data } = await supabase
      .from('collaborations')
      .select('*, sender:profiles!collaborations_sender_id_fkey(artist_name, avatar_url), receiver:profiles!collaborations_receiver_id_fkey(artist_name, avatar_url)')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    if (data) setCollabs(data as any);
  };

  const sendCollab = async () => {
    if (!selectedArtist || !songTitle) { toast.error('Select an artist and song title'); return; }
    const feeNum = parseInt(fee) || 0;
    if (feeNum > profile.current_money) { toast.error('Not enough money'); return; }

    await supabase.from('collaborations').insert({
      sender_id: profile.id,
      receiver_id: selectedArtist,
      song_title: songTitle,
      fee: feeNum,
    });
    toast.success('Feature request sent!');
    setSongTitle('');
    setFee('1000');
    loadCollabs();
  };

  const respondCollab = async (id: string, status: 'accepted' | 'rejected') => {
    await supabase.from('collaborations').update({ status }).eq('id', id);
    toast.success(status === 'accepted' ? 'Feature accepted! 🎉' : 'Feature declined');
    loadCollabs();
  };

  const incoming = collabs.filter(c => c.receiver_id === profile.id && c.status === 'pending');
  const sent = collabs.filter(c => c.sender_id === profile.id);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Handshake className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Collaborations</h2>
        </div>
        <p className="text-xs text-muted-foreground">Send feature requests to other artists</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {(['incoming', 'send', 'sent'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize ${tab === t ? 'tab-active' : 'tab-inactive'}`}>
            {t === 'incoming' ? `Inbox (${incoming.length})` : t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {tab === 'send' && (
          <div className="space-y-3">
            <select
              value={selectedArtist}
              onChange={e => setSelectedArtist(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Select artist...</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.artist_name}</option>)}
            </select>
            <Input placeholder="Song title" value={songTitle} onChange={e => setSongTitle(e.target.value)} />
            <Input type="number" placeholder="Fee offered ($)" value={fee} onChange={e => setFee(e.target.value)} />
            <p className="text-xs text-muted-foreground">Offering ${parseInt(fee || '0').toLocaleString()} for the feature</p>
            <Button onClick={sendCollab} className="w-full"><Send className="w-4 h-4 mr-1" /> Send Request</Button>
          </div>
        )}

        {tab === 'incoming' && (
          incoming.length > 0 ? incoming.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                  {c.sender?.avatar_url ? <img src={c.sender.avatar_url} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{c.sender?.artist_name}</p>
                  <p className="text-xs text-muted-foreground">wants you on "{c.song_title}"</p>
                </div>
                <span className="text-xs text-primary font-mono">{formatMoney(c.fee)}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => respondCollab(c.id, 'accepted')} className="flex-1">
                  <Check className="w-3.5 h-3.5 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => respondCollab(c.id, 'rejected')} className="flex-1">
                  <X className="w-3.5 h-3.5 mr-1" /> Decline
                </Button>
              </div>
            </motion.div>
          )) : <p className="text-center text-sm text-muted-foreground py-8">No pending requests</p>
        )}

        {tab === 'sent' && (
          sent.length > 0 ? sent.map(c => (
            <div key={c.id} className="glass-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{c.song_title}</p>
                  <p className="text-xs text-muted-foreground">To: {c.receiver?.artist_name} • {formatMoney(c.fee)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === 'accepted' ? 'bg-primary/20 text-primary' :
                  c.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                  'bg-secondary text-muted-foreground'
                }`}>{c.status}</span>
              </div>
            </div>
          )) : <p className="text-center text-sm text-muted-foreground py-8">No sent requests</p>
        )}
      </div>
    </div>
  );
}
