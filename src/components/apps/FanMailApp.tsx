import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Heart, MessageCircle, Check, Star, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

export default function FanMailApp({ profile }: Props) {
  const { user } = useAuth();
  const [fanMail, setFanMail] = useState<any[]>([]);
  const [tab, setTab] = useState<'inbox' | 'responded'>('inbox');

  useEffect(() => {
    supabase.from('fan_mail').select('*').eq('artist_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setFanMail(data); });
  }, [profile.id]);

  const respond = async (id: string) => {
    await supabase.from('fan_mail').update({ responded: true }).eq('id', id);

    // Boost from fan engagement
    await supabase.from('profiles').update({
      x_followers: profile.x_followers + 50,
      monthly_listeners: profile.monthly_listeners + 25,
    }).eq('id', profile.id);

    toast.success('Fan replied to! +50 followers');
    const { data } = await supabase.from('fan_mail').select('*').eq('artist_id', profile.id).order('created_at', { ascending: false });
    if (data) setFanMail(data);
  };

  const unread = fanMail.filter(m => !m.responded);
  const responded = fanMail.filter(m => m.responded);

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#ec4899]/30 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#be185d] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Fan Mail</h1>
            <p className="text-xs text-white/60">{unread.length} unread • {fanMail.length} total</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#222] mx-4">
        <button onClick={() => setTab('inbox')} className={`flex-1 py-3 text-sm font-medium ${tab === 'inbox' ? 'text-white border-b-2 border-[#ec4899]' : 'text-[#888]'}`}>
          Inbox ({unread.length})
        </button>
        <button onClick={() => setTab('responded')} className={`flex-1 py-3 text-sm font-medium ${tab === 'responded' ? 'text-white border-b-2 border-[#ec4899]' : 'text-[#888]'}`}>
          Responded ({responded.length})
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {tab === 'inbox' && (
          unread.length > 0 ? unread.map((mail) => (
            <div key={mail.id} className="bg-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#ec4899]/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#ec4899]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{mail.fan_name}</p>
                  <p className="text-[10px] text-[#888]">Fan</p>
                </div>
              </div>
              <p className="text-sm text-[#ccc] mb-3 leading-relaxed">"{mail.message}"</p>
              <button onClick={() => respond(mail.id)}
                className="w-full bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/30 rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> Reply
              </button>
            </div>
          )) : (
            <div className="text-center py-12 text-[#888]">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No new fan mail</p>
              <p className="text-xs mt-1">Keep growing to attract more fans!</p>
            </div>
          )
        )}

        {tab === 'responded' && (
          responded.length > 0 ? responded.map((mail) => (
            <div key={mail.id} className="bg-[#1a1a1a] rounded-xl p-4 opacity-70">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#1db954]/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#1db954]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{mail.fan_name}</p>
                  <p className="text-[10px] text-[#888]">Replied</p>
                </div>
              </div>
              <p className="text-xs text-[#888]">"{mail.message}"</p>
            </div>
          )) : <p className="text-center text-sm text-[#888] py-8">No responses yet</p>
        )}
      </div>
    </div>
  );
}
