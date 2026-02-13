import { useState, useRef } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { uploadArtistImage } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Save, Music, Headphones, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

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
    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ bio }).eq('user_id', user.id);
    toast.success('Bio updated!');
    setSaving(false);
  };

  const platformStats = [
    { label: 'Spotify Followers', value: formatNumber(profile.spotify_followers), icon: Music, color: 'text-spotify' },
    { label: 'Apple Music Listeners', value: formatNumber(profile.apple_music_listeners), icon: Headphones, color: 'text-apple-red' },
    { label: 'YouTube Subscribers', value: formatNumber(profile.youtube_subscribers), icon: Users, color: 'text-youtube-red' },
    { label: 'X Followers', value: formatNumber(profile.x_followers), icon: Users, color: 'text-foreground' },
  ];

  const genre = (profile as any).genre || 'Pop';
  const age = (profile as any).age || 21;

  return (
    <div className="p-4 space-y-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-4">
        <button onClick={() => fileRef.current?.click()} className="relative group">
          <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-2 border-border">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-6 h-6" />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <h2 className="font-display text-2xl font-bold">{profile.artist_name}</h2>
        <p className="text-muted-foreground text-sm">{genre} • Age {age}</p>
      </div>

      {/* Bio */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="font-display font-semibold text-sm">Bio</h3>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-secondary rounded-lg p-3 text-sm resize-none h-20 border border-border focus:border-primary outline-none"
          placeholder="Tell the world about yourself..."
        />
        <Button onClick={handleSaveBio} size="sm" className="bg-primary text-primary-foreground" disabled={saving}>
          <Save className="w-3.5 h-3.5 mr-1" /> Save
        </Button>
      </div>

      {/* Platform stats */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-sm">Platform Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {platformStats.map((stat) => (
            <div key={stat.label} className="glass-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="font-display text-lg font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Finances</h3>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Starting Budget</span>
          <span>{formatMoney(profile.starting_money)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">Current Balance</span>
          <span className="text-primary font-semibold">{formatMoney(profile.current_money)}</span>
        </div>
      </div>
    </div>
  );
}
