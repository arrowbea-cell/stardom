import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Swords, Flame, Mic2, Users, TrendingUp, Zap, Shield, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

const DISS_TEMPLATES = [
  'No Cap (Diss)', 'Clout Chaser', 'Fake Fame', 'Ghost Writer', 'Paper Chains',
  'Smoke Signal', 'Fallen Star', 'End of Era', 'Copycat', 'Overrated',
];

export default function BeefApp({ profile }: Props) {
  const { user } = useAuth();
  const [beefs, setBeefs] = useState<any[]>([]);
  const [artists, setArtists] = useState<Profile[]>([]);
  const [tab, setTab] = useState<'start' | 'active' | 'history'>('active');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [dissTitle, setDissTitle] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadBeefs();
    supabase.from('profiles').select('*').neq('id', profile.id).order('total_streams', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setArtists(data as Profile[]); });
  }, [profile.id]);

  const loadBeefs = async () => {
    const { data } = await supabase.from('beefs').select('*, initiator:profiles!beefs_initiator_id_fkey(artist_name, avatar_url), target:profiles!beefs_target_id_fkey(artist_name, avatar_url)')
      .or(`initiator_id.eq.${profile.id},target_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    if (data) setBeefs(data);
  };

  const startBeef = async () => {
    if (!user || !selectedTarget) return;
    const title = dissTitle.trim() || DISS_TEMPLATES[Math.floor(Math.random() * DISS_TEMPLATES.length)];
    setStarting(true);
    await new Promise(r => setTimeout(r, 2000));

    const cloutGained = Math.floor(Math.random() * 5000 + 1000);

    const { error } = await supabase.from('beefs').insert({
      initiator_id: profile.id, target_id: selectedTarget,
      diss_track_title: title, intensity: 1, clout_gained: cloutGained,
    });
    if (error) { toast.error(error.message); setStarting(false); return; }

    // Boost from drama
    await supabase.from('profiles').update({
      x_followers: profile.x_followers + cloutGained,
      monthly_listeners: profile.monthly_listeners + Math.floor(cloutGained * 0.5),
    }).eq('id', profile.id);

    toast.success(`Beef started! "${title}" dropped! +${formatNumber(cloutGained)} clout!`);
    setStarting(false);
    setDissTitle('');
    setSelectedTarget('');
    loadBeefs();
  };

  const escalate = async (beefId: string) => {
    const beef = beefs.find(b => b.id === beefId);
    if (!beef) return;
    const newIntensity = Math.min(5, beef.intensity + 1);
    const extraClout = Math.floor(Math.random() * 3000 + 500) * newIntensity;

    await supabase.from('beefs').update({
      intensity: newIntensity, clout_gained: beef.clout_gained + extraClout,
    }).eq('id', beefId);

    await supabase.from('profiles').update({
      x_followers: profile.x_followers + extraClout,
      monthly_listeners: profile.monthly_listeners + Math.floor(extraClout * 0.3),
    }).eq('id', profile.id);

    toast.success(`Beef escalated to level ${newIntensity}! +${formatNumber(extraClout)} clout!`);
    loadBeefs();
  };

  const squash = async (beefId: string) => {
    await supabase.from('beefs').update({ status: 'squashed' }).eq('id', beefId);
    toast.success('Beef squashed. Respect earned.');
    loadBeefs();
  };

  const activeBeefs = beefs.filter(b => b.status === 'active');
  const pastBeefs = beefs.filter(b => b.status !== 'active');

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#ef4444]/30 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#b91c1c] flex items-center justify-center">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Beef & Drama</h1>
            <p className="text-xs text-white/60">{activeBeefs.length} active beefs</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#222] mx-4">
        {(['active', 'start', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium capitalize ${tab === t ? 'text-white border-b-2 border-[#ef4444]' : 'text-[#888]'}`}>
            {t === 'active' ? `Active (${activeBeefs.length})` : t}
          </button>
        ))}
      </div>

      {tab === 'start' && (
        <div className="px-4 py-4 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Pick Your Target</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {artists.map((a) => (
                <button key={a.id} onClick={() => setSelectedTarget(a.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                    selectedTarget === a.id ? 'bg-[#ef4444]/20 ring-1 ring-[#ef4444]' : 'bg-[#1a1a1a]'
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-[#555] m-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.artist_name}</p>
                    <p className="text-xs text-[#888]">{formatNumber(a.total_streams)} streams</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Diss Track Title (optional)</h3>
            <div className="flex gap-2">
              <input type="text" value={dissTitle} onChange={(e) => setDissTitle(e.target.value)}
                placeholder="Auto-generated if empty..."
                className="flex-1 bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-[#ef4444]" />
              <button onClick={() => setDissTitle(DISS_TEMPLATES[Math.floor(Math.random() * DISS_TEMPLATES.length)])}
                className="bg-[#282828] rounded-xl px-3 flex items-center"><Zap className="w-4 h-4 text-[#f59e0b]" /></button>
            </div>
          </div>

          <button onClick={startBeef} disabled={starting || !selectedTarget}
            className="w-full bg-gradient-to-r from-[#ef4444] to-[#b91c1c] rounded-xl py-4 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {starting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting Beef...</>
              : <><Flame className="w-5 h-5" /> Start Beef</>}
          </button>
        </div>
      )}

      {tab === 'active' && (
        <div className="px-4 py-4 space-y-3">
          {activeBeefs.length > 0 ? activeBeefs.map((beef) => {
            const isInitiator = beef.initiator_id === profile.id;
            const opponent = isInitiator ? beef.target : beef.initiator;
            return (
              <div key={beef.id} className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                    {opponent?.avatar_url ? <img src={opponent.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-[#555] m-3.5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">vs. {opponent?.artist_name}</p>
                    <p className="text-xs text-[#888]">"{beef.diss_track_title}"</p>
                  </div>
                  <div className="flex">
                    {Array.from({ length: beef.intensity }).map((_, i) => (
                      <Flame key={i} className="w-4 h-4 text-[#ef4444]" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#888] mb-3">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{formatNumber(beef.clout_gained)} clout gained</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => escalate(beef.id)} disabled={beef.intensity >= 5}
                    className="flex-1 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 rounded-lg py-2 text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Escalate
                  </button>
                  <button onClick={() => squash(beef.id)}
                    className="flex-1 bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Squash
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12 text-[#888]">
              <Swords className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active beefs</p>
              <p className="text-xs mt-1">Start some drama to gain clout!</p>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="px-4 py-4 space-y-3">
          {pastBeefs.length > 0 ? pastBeefs.map((beef) => {
            const isInitiator = beef.initiator_id === profile.id;
            const opponent = isInitiator ? beef.target : beef.initiator;
            return (
              <div key={beef.id} className="bg-[#1a1a1a] rounded-xl p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">vs. {opponent?.artist_name}</p>
                    <p className="text-xs text-[#888]">"{beef.diss_track_title}" • +{formatNumber(beef.clout_gained)} clout</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#333] text-[#888] capitalize">{beef.status}</span>
                </div>
              </div>
            );
          }) : <p className="text-center text-sm text-[#888] py-8">No past beefs</p>}
        </div>
      )}
    </div>
  );
}
