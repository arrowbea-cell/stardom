import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { uploadArtistImage } from '@/lib/supabase-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Camera, Disc3 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const MONEY_OPTIONS = [5000, 10000, 50000, 100000, 500000];

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [artistName, setArtistName] = useState('');
  const [selectedMoney, setSelectedMoney] = useState(10000);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !artistName.trim()) return;
    setLoading(true);

    let avatarUrl: string | null = null;
    if (avatarFile) {
      avatarUrl = await uploadArtistImage(avatarFile, user.id);
    }

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      artist_name: artistName.trim(),
      avatar_url: avatarUrl,
      starting_money: selectedMoney,
      current_money: selectedMoney,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome to the industry!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-lg"
      >
        <div className="text-center mb-6">
          <Disc3 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" style={{ animationDuration: '3s' }} />
          <h1 className="text-2xl font-display font-bold">Create Your Artist</h1>
          <p className="text-muted-foreground text-sm mt-1">Set up your music career</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <Input
            placeholder="Artist Name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="bg-secondary border-border text-center text-lg"
            required
          />

          {/* Starting money */}
          <div>
            <p className="text-sm text-muted-foreground mb-3 text-center">Starting Budget</p>
            <div className="grid grid-cols-5 gap-2">
              {MONEY_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedMoney(amount)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedMoney === amount
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ${amount >= 1000 ? `${amount / 1000}K` : amount}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-semibold" disabled={loading}>
            {loading ? 'Creating...' : 'Start Career'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
