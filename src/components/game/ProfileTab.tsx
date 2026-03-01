import { useState, useRef } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { uploadArtistImage } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Button } from '@/components/ui/button';
import { Camera, Save, Music, Headphones, DollarSign, Users, Activity, Globe, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props {
  profile: Profile;
}

export default function ProfileTab({ profile }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    toast.loading('Uploading avatar...');
    const url = await uploadArtistImage(file, user.id);
    if (url) {
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      toast.dismiss();
      if (!error) {
        toast.success('Avatar updated!');
      } else {
        toast.error('Failed to update avatar');
      }
    } else {
      toast.dismiss();
      toast.error('Upload failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ bio }).eq('user_id', user.id);
    toast.success('Bio updated');
    setSaving(false);
  };

  const genre = (profile as any).genre || 'Pop';
  const age = (profile as any).age || 21;

  const platformStats = [
    { label: 'Spotify', value: formatNumber(profile.spotify_followers), icon: Music },
    { label: 'Apple Music', value: formatNumber(profile.apple_music_listeners), icon: Headphones },
    { label: 'YouTube', value: formatNumber(profile.youtube_subscribers), icon: Users },
    { label: 'X', value: formatNumber(profile.x_followers), icon: Hash },
  ];

  const infoItems = [
    { label: 'Genre', value: genre, icon: Activity },
    { label: 'Age', value: age, icon: Calendar },
    { label: 'Country', value: profile.current_country || 'United States', icon: Globe },
    { label: 'Balance', value: formatMoney(profile.current_money), icon: DollarSign },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3">
        <button onClick={() => fileRef.current?.click()} className="relative group">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden border border-border/50">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-8 h-8 text-muted-foreground hollow-icon" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-5 h-5 hollow-icon" strokeWidth={1.5} />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <h2 className="font-display text-xl font-bold tracking-tight">{profile.artist_name}</h2>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mono">
          <span>{genre}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Age {age}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{formatNumber(profile.total_streams)} streams</span>
        </div>
      </div>

      {/* Bio */}
      <div className="glass-card p-3 space-y-2">
        <h3 className="font-display font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Bio</h3>
        <textarea
          value={bio || ''}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-muted/50 rounded p-2.5 text-xs resize-none h-16 border border-border/30 focus:border-foreground/30 outline-none"
          placeholder="Tell the world about yourself..."
        />
        <Button onClick={handleSaveBio} size="sm" variant="outline" className="text-[10px] h-7" disabled={saving}>
          <Save className="w-3 h-3 mr-1 hollow-icon" strokeWidth={1.5} /> Save
        </Button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2">
        {infoItems.map((item) => (
          <div key={item.label} className="glass-card p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <item.icon className="w-3 h-3 text-muted-foreground hollow-icon" strokeWidth={1.5} />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
            </div>
            <p className="text-xs font-medium mono">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Platform stats */}
      <div className="space-y-2">
        <h3 className="font-display font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Platforms</h3>
        <div className="grid grid-cols-2 gap-2">
          {platformStats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className="w-3 h-3 text-muted-foreground hollow-icon" strokeWidth={1.5} />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-sm font-display font-bold mono">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Financial summary */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <DollarSign className="w-3 h-3 text-muted-foreground hollow-icon" strokeWidth={1.5} />
          <h3 className="font-display font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Finances</h3>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Starting</span>
            <span className="mono">{formatMoney(profile.starting_money)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Current</span>
            <span className="mono font-medium">{formatMoney(profile.current_money)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Revenue (est.)</span>
            <span className="mono">{formatMoney(Math.floor(profile.total_streams * 0.004))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
