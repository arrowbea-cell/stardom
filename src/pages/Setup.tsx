import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadArtistImage } from '@/lib/supabase-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Camera, Disc3, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const MONEY_OPTIONS = [5000, 10000, 50000, 100000, 500000];
const GENRES = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Latin', 'EDM', 'Indie', 'K-Pop', 'Country', 'Jazz', 'Afrobeats', 'Alternative'];
const AGE_OPTIONS = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 35, 40];

export default function Setup() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [artistName, setArtistName] = useState('');
  const [selectedMoney, setSelectedMoney] = useState(10000);
  const [selectedGenre, setSelectedGenre] = useState('Pop');
  const [selectedAge, setSelectedAge] = useState(21);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileLoading && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, profileLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
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
      genre: selectedGenre,
      age: selectedAge,
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
          <p className="text-muted-foreground text-sm mt-1">Step {step} of 3</p>
          {/* Progress bar */}
          <div className="flex gap-1 mt-3">
            {[1,2,3].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Name + Avatar */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
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
            />

            <Button
              onClick={() => { if (artistName.trim()) setStep(2); else toast.error('Enter your artist name'); }}
              className="w-full bg-primary text-primary-foreground font-semibold"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Genre + Age */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3 text-center">What's your genre?</p>
              <div className="grid grid-cols-3 gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedGenre === genre
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3 text-center">How old is your artist?</p>
              <div className="grid grid-cols-4 gap-2">
                {AGE_OPTIONS.map((age) => (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedAge === age
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-primary text-primary-foreground font-semibold">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3 text-center">Starting Budget</p>
              <div className="grid grid-cols-5 gap-2">
                {MONEY_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedMoney(amount)}
                    className={`py-3 px-1 rounded-lg text-xs font-semibold transition-all ${
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

            {/* Summary */}
            <div className="bg-secondary rounded-xl p-4 space-y-2">
              <h3 className="font-display font-semibold text-sm text-center mb-3">Your Artist</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{artistName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Genre</span>
                <span className="font-medium">{selectedGenre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">{selectedAge}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium text-primary">${selectedMoney.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground font-semibold" disabled={loading}>
                {loading ? 'Creating...' : 'Start Career 🚀'}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
