import { useState, useEffect, useRef } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { uploadArtistImage } from '@/lib/supabase-helpers';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Music, Mic2, Home, Lock, Camera, Star, Zap, TrendingUp, DollarSign, Check, Archive } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

interface Studio {
  id: string;
  name: string;
  description: string;
  quality_level: number;
  cost_per_session: number;
  image_emoji: string;
}

type Section = 'main' | 'record' | 'vault' | 'home-studio';

const PROMOTION_OPTIONS = [
  { id: 'none', name: 'No Promotion', cost: 0, multiplier: 1.0, icon: '🎵', desc: 'Organic growth only' },
  { id: 'social', name: 'Social Media Ads', cost: 1000, multiplier: 1.5, icon: '📱', desc: '+50% stream boost' },
  { id: 'playlist', name: 'Playlist Placement', cost: 3000, multiplier: 2.0, icon: '📋', desc: '2x stream boost' },
  { id: 'radio', name: 'Radio Campaign', cost: 8000, multiplier: 3.0, icon: '📻', desc: '3x stream boost' },
  { id: 'billboard', name: 'Billboard + Press', cost: 20000, multiplier: 5.0, icon: '🏙️', desc: '5x stream boost' },
];

const HOME_STUDIO_UPGRADES = [
  { level: 1, name: 'Basic Setup', cost: 2000, desc: 'Laptop, headphones, free DAW. Quality: ★', quality: 1 },
  { level: 2, name: 'Upgraded Gear', cost: 5000, desc: 'Audio interface, condenser mic, monitors. Quality: ★★', quality: 2 },
  { level: 3, name: 'Pro Home Studio', cost: 15000, desc: 'Soundproofing, pro gear, premium plugins. Quality: ★★★', quality: 3 },
  { level: 4, name: 'Elite Studio', cost: 40000, desc: 'Industry-grade everything. Quality: ★★★★', quality: 4 },
];

const SONG_NAME_TEMPLATES = [
  'Midnight Dreams', 'On My Way', 'Feel the Vibe', 'Neon Lights', 'Lost in You',
  'City Lights', 'Ocean Eyes', 'Electric', 'Gravity', 'Wildfire',
  'Runaway', 'Paradise', 'Levitate', 'Euphoria', 'Afterglow',
  'Golden Hour', 'Starlight', 'Faded', 'Unstoppable', 'Eclipse',
];

export default function StudioApp({ profile }: Props) {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('main');
  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [songTitle, setSongTitle] = useState('');
  const [selectedPromo, setSelectedPromo] = useState('none');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [vaultSongs, setVaultSongs] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('studios').select('*').order('quality_level', { ascending: true })
      .then(({ data }) => { if (data) setStudios(data as Studio[]); });
    // Fetch vault songs (unreleased)
    supabase.from('songs').select('*').eq('artist_id', profile.id).eq('streams', 0).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVaultSongs(data); });
  }, [profile.id]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const generateSongName = () => {
    setSongTitle(SONG_NAME_TEMPLATES[Math.floor(Math.random() * SONG_NAME_TEMPLATES.length)]);
  };

  const handleRecord = async () => {
    if (!user || !selectedStudio || !songTitle.trim()) {
      toast.error('Enter a song title first');
      return;
    }

    const totalCost = selectedStudio.cost_per_session;
    if (profile.current_money < totalCost) {
      toast.error("You can't afford this studio session!");
      return;
    }

    setRecording(true);
    // Simulate recording time
    await new Promise(r => setTimeout(r, 2000));

    let coverUrl: string | null = null;
    if (coverFile && user) {
      coverUrl = await uploadArtistImage(coverFile, user.id);
    }

    // Create the song
    const { data: songData, error: songError } = await supabase.from('songs').insert({
      artist_id: profile.id,
      title: songTitle.trim(),
      cover_url: coverUrl,
      streams: 0,
    }).select().single();

    if (songError) {
      toast.error(songError.message);
      setRecording(false);
      return;
    }

    // Deduct studio cost
    if (totalCost > 0) {
      await supabase.from('profiles').update({
        current_money: profile.current_money - totalCost,
      }).eq('id', profile.id);
    }

    toast.success(`"${songTitle}" recorded at ${selectedStudio.name}! 🎵`);
    setRecording(false);
    setSongTitle('');
    setCoverFile(null);
    setCoverPreview(null);

    // Refresh vault
    const { data: newVault } = await supabase.from('songs').select('*').eq('artist_id', profile.id).eq('streams', 0).order('created_at', { ascending: false });
    if (newVault) setVaultSongs(newVault);
  };

  const handleRelease = async (songId: string) => {
    if (!user) return;
    setReleasing(true);

    const promo = PROMOTION_OPTIONS.find(p => p.id === selectedPromo);
    const promoCost = promo?.cost || 0;

    if (profile.current_money < promoCost) {
      toast.error("You can't afford this promotion!");
      setReleasing(false);
      return;
    }

    // Set initial streams based on studio quality and promotion
    const baseStreams = Math.floor(Math.random() * 500) + 100;
    const studioBonus = selectedStudio ? selectedStudio.quality_level * 200 : 100;
    const promoMultiplier = promo?.multiplier || 1;
    const initialStreams = Math.floor((baseStreams + studioBonus) * promoMultiplier);

    await supabase.from('songs').update({ streams: initialStreams }).eq('id', songId);

    // Update profile streams
    await supabase.from('profiles').update({
      total_streams: profile.total_streams + initialStreams,
      current_money: profile.current_money - promoCost,
      monthly_listeners: profile.monthly_listeners + Math.floor(initialStreams * 0.3),
      spotify_followers: profile.spotify_followers + Math.floor(initialStreams * 0.05),
      apple_music_listeners: profile.apple_music_listeners + Math.floor(initialStreams * 0.03),
      youtube_subscribers: profile.youtube_subscribers + Math.floor(initialStreams * 0.02),
      x_followers: profile.x_followers + Math.floor(initialStreams * 0.01),
    }).eq('id', profile.id);

    // Create promotion record if applicable
    if (promo && promo.id !== 'none') {
      await supabase.from('promotions').insert({
        song_id: songId,
        artist_id: profile.id,
        promotion_type: promo.id,
        cost: promoCost,
        boost_multiplier: promoMultiplier,
      });
    }

    toast.success(`Song released! 🚀 ${formatNumber(initialStreams)} initial streams!`);
    setReleasing(false);
    setSelectedPromo('none');

    // Refresh vault
    const { data: newVault } = await supabase.from('songs').select('*').eq('artist_id', profile.id).eq('streams', 0).order('created_at', { ascending: false });
    if (newVault) setVaultSongs(newVault);
  };

  const upgradeHomeStudio = async (level: number, cost: number) => {
    if (!user) return;
    if (profile.current_money < cost) {
      toast.error("You can't afford this upgrade!");
      return;
    }

    await supabase.from('profiles').update({
      has_home_studio: true,
      home_studio_level: level,
      current_money: profile.current_money - cost,
    }).eq('id', profile.id);

    toast.success(`Home studio upgraded to Level ${level}! 🏠`);
  };

  const homeStudioLevel = (profile as any).home_studio_level || 0;
  const hasHomeStudio = (profile as any).has_home_studio || false;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fff]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Studio</h1>
          <div className="flex items-center gap-2 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-[#1db954]" />
            <span className="text-[#1db954] font-mono">{formatMoney(profile.current_money)}</span>
          </div>
        </div>
      </div>

      {section === 'main' && (
        <div className="px-4 space-y-4 pb-20">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSection('record')} className="bg-gradient-to-br from-[#1db954] to-[#148a3c] rounded-xl p-5 text-left">
              <Mic2 className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-sm">Record Song</h3>
              <p className="text-[10px] text-white/70 mt-1">Choose a studio and record</p>
            </button>
            <button onClick={() => setSection('vault')} className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] rounded-xl p-5 text-left">
              <Archive className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-sm">Vault</h3>
              <p className="text-[10px] text-white/70 mt-1">{vaultSongs.length} unreleased songs</p>
            </button>
            <button onClick={() => setSection('home-studio')} className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-xl p-5 text-left">
              <Home className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-sm">Home Studio</h3>
              <p className="text-[10px] text-white/70 mt-1">{hasHomeStudio ? `Level ${homeStudioLevel}` : 'Not built yet'}</p>
            </button>
            <div className="bg-[#1a1a1a] rounded-xl p-5 text-left">
              <TrendingUp className="w-8 h-8 mb-3 text-[#ff375f]" />
              <h3 className="font-bold text-sm">Stats</h3>
              <p className="text-[10px] text-white/70 mt-1">{formatNumber(profile.total_streams)} total streams</p>
            </div>
          </div>

          {/* Studios list */}
          <div>
            <h2 className="text-lg font-bold mb-3">Available Studios</h2>
            <div className="space-y-3">
              {studios.map((studio) => (
                <button
                  key={studio.id}
                  onClick={() => { setSelectedStudio(studio); setSection('record'); }}
                  className={`w-full bg-[#1a1a1a] rounded-xl p-4 text-left flex items-center gap-4 hover:bg-[#222] transition-colors ${
                    selectedStudio?.id === studio.id ? 'ring-2 ring-[#1db954]' : ''
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-[#282828] flex items-center justify-center text-2xl">
                    {studio.image_emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{studio.name}</h3>
                      <div className="flex">
                        {Array.from({ length: studio.quality_level }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#888] mt-0.5">{studio.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${studio.cost_per_session === 0 ? 'text-[#1db954]' : 'text-white'}`}>
                      {studio.cost_per_session === 0 ? 'FREE' : formatMoney(studio.cost_per_session)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECORD */}
      {section === 'record' && (
        <div className="px-4 space-y-6 pb-20">
          <button onClick={() => setSection('main')} className="text-sm text-[#888] hover:text-white">← Back</button>

          {/* Studio selection */}
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Recording at:</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {studios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudio(s)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap ${
                    selectedStudio?.id === s.id ? 'bg-[#1db954] text-black font-bold' : 'bg-[#1a1a1a] text-white'
                  }`}
                >
                  <span>{s.image_emoji}</span>
                  <span>{s.name}</span>
                  <span className="opacity-70">{s.cost_per_session === 0 ? 'Free' : formatMoney(s.cost_per_session)}</span>
                </button>
              ))}
              {hasHomeStudio && (
                <button
                  onClick={() => setSelectedStudio({ id: 'home', name: 'Home Studio', description: '', quality_level: homeStudioLevel, cost_per_session: 0, image_emoji: '🏠' })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap ${
                    selectedStudio?.id === 'home' ? 'bg-[#1db954] text-black font-bold' : 'bg-[#1a1a1a] text-white'
                  }`}
                >
                  🏠 Home Studio (Free)
                </button>
              )}
            </div>
          </div>

          {/* Song title */}
          <div>
            <label className="text-sm font-bold text-[#888] mb-2 block">Song Title</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="Enter song title..."
                className="flex-1 bg-[#1a1a1a] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 ring-[#1db954]"
              />
              <button onClick={generateSongName} className="bg-[#282828] rounded-lg px-3 text-xs hover:bg-[#333]">🎲</button>
            </div>
          </div>

          {/* Cover art */}
          <div>
            <label className="text-sm font-bold text-[#888] mb-2 block">Cover Art (optional)</label>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-32 h-32 rounded-xl bg-[#1a1a1a] border-2 border-dashed border-[#333] flex items-center justify-center overflow-hidden hover:border-[#1db954] transition-colors"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-[#555]" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Record button */}
          <button
            onClick={handleRecord}
            disabled={recording || !songTitle.trim() || !selectedStudio}
            className="w-full bg-gradient-to-r from-[#1db954] to-[#148a3c] rounded-xl py-4 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {recording ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Mic2 className="w-5 h-5" />
                Record Song {selectedStudio && selectedStudio.cost_per_session > 0 && `(${formatMoney(selectedStudio.cost_per_session)})`}
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#666]">Song will be saved to your Vault. Release it when you're ready!</p>
        </div>
      )}

      {/* VAULT */}
      {section === 'vault' && (
        <div className="px-4 space-y-4 pb-20">
          <button onClick={() => setSection('main')} className="text-sm text-[#888] hover:text-white">← Back</button>
          <h2 className="text-xl font-bold">Your Vault</h2>
          <p className="text-sm text-[#888]">Unreleased songs ready to drop. Choose a promotion strategy and release!</p>

          {vaultSongs.length > 0 ? (
            <div className="space-y-4">
              {vaultSongs.map((song) => (
                <div key={song.id} className="bg-[#1a1a1a] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-lg bg-[#282828] overflow-hidden flex-shrink-0">
                      {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-[#555]" /></div>}
                    </div>
                    <div>
                      <h3 className="font-bold">{song.title}</h3>
                      <p className="text-xs text-[#888]">Unreleased • In Vault</p>
                    </div>
                  </div>

                  {/* Promotion options */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-bold text-[#888]">Promotion Strategy:</p>
                    {PROMOTION_OPTIONS.map((promo) => (
                      <button
                        key={promo.id}
                        onClick={() => setSelectedPromo(promo.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs ${
                          selectedPromo === promo.id ? 'bg-[#1db954]/20 ring-1 ring-[#1db954]' : 'bg-[#282828]'
                        }`}
                      >
                        <span className="text-lg">{promo.icon}</span>
                        <div className="flex-1">
                          <span className="font-medium">{promo.name}</span>
                          <p className="text-[#888] text-[10px]">{promo.desc}</p>
                        </div>
                        <span className={promo.cost === 0 ? 'text-[#1db954]' : 'text-white'}>
                          {promo.cost === 0 ? 'Free' : formatMoney(promo.cost)}
                        </span>
                        {selectedPromo === promo.id && <Check className="w-4 h-4 text-[#1db954]" />}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleRelease(song.id)}
                    disabled={releasing}
                    className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] rounded-lg py-3 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {releasing ? 'Releasing...' : '🚀 Release Song'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <p className="text-sm text-[#888]">Your vault is empty. Record some songs first!</p>
              <button onClick={() => setSection('record')} className="mt-4 bg-[#1db954] text-black px-6 py-2 rounded-full text-sm font-bold">
                Record a Song
              </button>
            </div>
          )}
        </div>
      )}

      {/* HOME STUDIO */}
      {section === 'home-studio' && (
        <div className="px-4 space-y-4 pb-20">
          <button onClick={() => setSection('main')} className="text-sm text-[#888] hover:text-white">← Back</button>
          <h2 className="text-xl font-bold">Home Studio</h2>
          <p className="text-sm text-[#888]">Build and upgrade your personal studio. Record for free anytime!</p>

          <div className="space-y-3">
            {HOME_STUDIO_UPGRADES.map((upgrade) => {
              const isUnlocked = homeStudioLevel >= upgrade.level;
              const isNext = homeStudioLevel === upgrade.level - 1;
              const canAfford = profile.current_money >= upgrade.cost;

              return (
                <div key={upgrade.level} className={`bg-[#1a1a1a] rounded-xl p-4 ${isUnlocked ? 'ring-1 ring-[#1db954]' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{upgrade.name}</h3>
                      {isUnlocked && <Check className="w-4 h-4 text-[#1db954]" />}
                    </div>
                    <span className="text-sm font-bold">{formatMoney(upgrade.cost)}</span>
                  </div>
                  <p className="text-xs text-[#888] mb-3">{upgrade.desc}</p>
                  {isUnlocked ? (
                    <div className="text-xs text-[#1db954] font-medium">✓ Unlocked</div>
                  ) : isNext ? (
                    <button
                      onClick={() => upgradeHomeStudio(upgrade.level, upgrade.cost)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-lg text-sm font-bold ${
                        canAfford ? 'bg-[#f59e0b] text-black' : 'bg-[#333] text-[#666]'
                      }`}
                    >
                      {canAfford ? `Upgrade (${formatMoney(upgrade.cost)})` : 'Not enough money'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-[#555]">
                      <Lock className="w-3 h-3" /> Unlock previous level first
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
