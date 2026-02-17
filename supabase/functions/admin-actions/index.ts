import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminPassword = Deno.env.get("ADMIN_PANEL_PASSWORD")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (body.password !== adminPassword) return json({ error: "Unauthorized" }, 401);

  const { action, artist_id, song_id, amount } = body;

  try {
    switch (action) {
      // ─── AUTH ───
      case "test":
        return json({ success: true, message: "Authenticated" });

      // ─── ARTIST MANAGEMENT ───
      case "delete_artist": {
        const tables = ["promotions","stream_history","charts","music_videos","merch_items","fan_mail","awards","pitchfork_reviews","concerts","record_deals","travels","visas","artist_items"];
        for (const t of tables) await supabase.from(t).delete().eq("artist_id", artist_id);
        await supabase.from("post_likes").delete().or(`liker_id.eq.${artist_id},liked_artist_id.eq.${artist_id}`);
        await supabase.from("beefs").delete().or(`initiator_id.eq.${artist_id},target_id.eq.${artist_id}`);
        await supabase.from("bank_transactions").delete().or(`sender_id.eq.${artist_id},receiver_id.eq.${artist_id}`);
        await supabase.from("collaborations").delete().or(`sender_id.eq.${artist_id},receiver_id.eq.${artist_id}`);
        const { data: artistSongs } = await supabase.from("songs").select("id").eq("artist_id", artist_id);
        if (artistSongs) for (const s of artistSongs) await supabase.from("album_songs").delete().eq("song_id", s.id);
        await supabase.from("songs").delete().eq("artist_id", artist_id);
        const { data: artistAlbums } = await supabase.from("albums").select("id").eq("artist_id", artist_id);
        if (artistAlbums) for (const a of artistAlbums) await supabase.from("album_songs").delete().eq("album_id", a.id);
        await supabase.from("albums").delete().eq("artist_id", artist_id);
        await supabase.from("profiles").delete().eq("id", artist_id);
        return json({ success: true, message: "Artist and all data deleted" });
      }

      case "boost_streams": {
        const boost = amount || 100000;
        const { data: song } = await supabase.from("songs").select("streams, artist_id").eq("id", song_id).single();
        if (song) {
          await supabase.from("songs").update({ streams: song.streams + boost }).eq("id", song_id);
          const { data: p } = await supabase.from("profiles").select("total_streams").eq("id", song.artist_id).single();
          if (p) await supabase.from("profiles").update({ total_streams: p.total_streams + boost }).eq("id", song.artist_id);
        }
        return json({ success: true, message: `Boosted song by ${boost} streams` });
      }

      case "boost_listeners": {
        const boost = amount || 50000;
        const { data: p } = await supabase.from("profiles").select("monthly_listeners").eq("id", artist_id).single();
        if (p) await supabase.from("profiles").update({ monthly_listeners: p.monthly_listeners + boost }).eq("id", artist_id);
        return json({ success: true, message: `Boosted monthly listeners by ${boost}` });
      }

      case "payola": {
        const pay = amount || 500000;
        const { data: p } = await supabase.from("profiles").select("current_money, monthly_listeners, spotify_followers").eq("id", artist_id).single();
        if (p) {
          await supabase.from("profiles").update({
            current_money: p.current_money + pay,
            monthly_listeners: p.monthly_listeners + Math.floor(pay * 0.1),
            spotify_followers: p.spotify_followers + Math.floor(pay * 0.05),
          }).eq("id", artist_id);
        }
        const { data: songs } = await supabase.from("songs").select("id, streams").eq("artist_id", artist_id);
        if (songs) for (const s of songs) await supabase.from("songs").update({ streams: s.streams + Math.floor(pay * 0.5) }).eq("id", s.id);
        return json({ success: true, message: `Payola applied: $${pay}` });
      }

      case "industry_plant": {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", artist_id).single();
        if (p) {
          await supabase.from("profiles").update({
            monthly_listeners: p.monthly_listeners + 1000000, spotify_followers: p.spotify_followers + 500000,
            apple_music_listeners: p.apple_music_listeners + 300000, youtube_subscribers: p.youtube_subscribers + 200000,
            x_followers: p.x_followers + 150000, total_streams: p.total_streams + 5000000,
          }).eq("id", artist_id);
        }
        const { data: songs } = await supabase.from("songs").select("id, streams, radio_spins").eq("artist_id", artist_id);
        if (songs) for (const s of songs) await supabase.from("songs").update({ streams: s.streams + 1000000, radio_spins: (s.radio_spins || 0) + 50000 }).eq("id", s.id);
        return json({ success: true, message: "Industry plant activated" });
      }

      case "chart_placement": {
        const position = amount || 1;
        const { data: song } = await supabase.from("songs").select("artist_id").eq("id", song_id).single();
        if (song) {
          const { data: gs } = await supabase.from("game_state").select("current_turn").limit(1).single();
          const turn = gs?.current_turn || 1;
          for (const ct of ["top_songs", "hot_100_daily", "hot_100_weekly"]) {
            await supabase.from("charts").insert({ turn_number: turn, position, song_id, artist_id: song.artist_id, streams: 99999999, chart_type: ct });
          }
        }
        return json({ success: true, message: `Song placed at #${position}` });
      }

      case "give_money": {
        const cash = amount || 100000;
        const { data: p } = await supabase.from("profiles").select("current_money").eq("id", artist_id).single();
        if (p) await supabase.from("profiles").update({ current_money: p.current_money + cash }).eq("id", artist_id);
        return json({ success: true, message: `Gave $${cash}` });
      }

      case "set_followers": {
        const { platform, count } = body;
        const map: Record<string, string> = { spotify: "spotify_followers", apple: "apple_music_listeners", youtube: "youtube_subscribers", x: "x_followers", monthly: "monthly_listeners" };
        if (map[platform]) await supabase.from("profiles").update({ [map[platform]]: count }).eq("id", artist_id);
        return json({ success: true, message: `Set ${platform} to ${count}` });
      }

      // ─── GAME CONTROLS ───
      case "set_turn_duration": {
        await supabase.from("game_state").update({ turn_duration_minutes: amount || 60 }).neq("id", "");
        return json({ success: true, message: `Turn duration set to ${amount || 60} minutes` });
      }

      case "reset_timer": {
        await supabase.from("game_state").update({ turn_started_at: new Date().toISOString() }).neq("id", "");
        return json({ success: true, message: "Timer reset" });
      }

      case "force_next_turn": {
        const { data: gs } = await supabase.from("game_state").select("*").limit(1).single();
        if (gs) await supabase.from("game_state").update({ current_turn: gs.current_turn + 1, turn_started_at: new Date().toISOString() }).eq("id", gs.id);
        return json({ success: true, message: "Skipped to next turn" });
      }

      // ─── ECONOMY ───
      case "give_money_all": {
        const cash = amount || 10000;
        const { data: all } = await supabase.from("profiles").select("id, current_money");
        if (all) for (const p of all) await supabase.from("profiles").update({ current_money: p.current_money + cash }).eq("id", p.id);
        return json({ success: true, message: `Gave $${cash} to all` });
      }

      case "reset_economy": {
        const { data: all } = await supabase.from("profiles").select("id, starting_money");
        if (all) for (const p of all) await supabase.from("profiles").update({ current_money: p.starting_money }).eq("id", p.id);
        return json({ success: true, message: "Economy reset" });
      }

      case "boost_all_streams": {
        const boost = amount || 50000;
        const { data: allSongs } = await supabase.from("songs").select("id, streams, artist_id");
        if (allSongs) {
          for (const s of allSongs) await supabase.from("songs").update({ streams: s.streams + boost }).eq("id", s.id);
          const map: Record<string, number> = {};
          for (const s of allSongs) map[s.artist_id] = (map[s.artist_id] || 0) + boost;
          for (const [aid, total] of Object.entries(map)) {
            const { data: p } = await supabase.from("profiles").select("total_streams").eq("id", aid).single();
            if (p) await supabase.from("profiles").update({ total_streams: p.total_streams + total }).eq("id", aid);
          }
        }
        return json({ success: true, message: `Boosted all songs by ${boost}` });
      }

      // ─── NEW ADVANCED ACTIONS ───
      case "set_streams": {
        await supabase.from("songs").update({ streams: amount || 0 }).eq("id", song_id);
        return json({ success: true, message: `Set streams to ${amount}` });
      }

      case "set_money": {
        await supabase.from("profiles").update({ current_money: amount || 0 }).eq("id", artist_id);
        return json({ success: true, message: `Set money to $${amount}` });
      }

      case "set_total_streams": {
        await supabase.from("profiles").update({ total_streams: amount || 0 }).eq("id", artist_id);
        return json({ success: true, message: `Set total streams to ${amount}` });
      }

      case "nuke_charts": {
        await supabase.from("charts").delete().neq("id", "");
        return json({ success: true, message: "All chart data wiped" });
      }

      case "nuke_stream_history": {
        await supabase.from("stream_history").delete().neq("id", "");
        return json({ success: true, message: "All stream history wiped" });
      }

      case "nuke_reviews": {
        await supabase.from("pitchfork_reviews").delete().neq("id", "");
        return json({ success: true, message: "All Pitchfork reviews wiped" });
      }

      case "reset_all_streams": {
        await supabase.from("songs").update({ streams: 0, radio_spins: 0 }).neq("id", "");
        await supabase.from("profiles").update({ total_streams: 0, monthly_listeners: 0 }).neq("id", "");
        return json({ success: true, message: "All streams reset to 0" });
      }

      case "ban_artist": {
        // Set money to 0 and wipe all stats
        await supabase.from("profiles").update({
          current_money: 0, total_streams: 0, monthly_listeners: 0,
          spotify_followers: 0, apple_music_listeners: 0, youtube_subscribers: 0, x_followers: 0,
        }).eq("id", artist_id);
        await supabase.from("songs").update({ streams: 0, radio_spins: 0 }).eq("artist_id", artist_id);
        return json({ success: true, message: "Artist banned (all stats wiped)" });
      }

      case "multiply_stats": {
        const mult = amount || 2;
        const { data: p } = await supabase.from("profiles").select("*").eq("id", artist_id).single();
        if (p) {
          await supabase.from("profiles").update({
            total_streams: Math.floor(p.total_streams * mult),
            monthly_listeners: Math.floor(p.monthly_listeners * mult),
            spotify_followers: Math.floor(p.spotify_followers * mult),
            apple_music_listeners: Math.floor(p.apple_music_listeners * mult),
            youtube_subscribers: Math.floor(p.youtube_subscribers * mult),
            x_followers: Math.floor(p.x_followers * mult),
          }).eq("id", artist_id);
        }
        const { data: songs } = await supabase.from("songs").select("id, streams, radio_spins").eq("artist_id", artist_id);
        if (songs) for (const s of songs) await supabase.from("songs").update({ streams: Math.floor(s.streams * mult), radio_spins: Math.floor((s.radio_spins || 0) * mult) }).eq("id", s.id);
        return json({ success: true, message: `Stats multiplied by ${mult}x` });
      }

      case "set_turn": {
        await supabase.from("game_state").update({ current_turn: amount || 1 }).neq("id", "");
        return json({ success: true, message: `Turn set to ${amount}` });
      }

      case "get_analytics": {
        const { data: profiles } = await supabase.from("profiles").select("*").order("total_streams", { ascending: false });
        const { data: songs } = await supabase.from("songs").select("*").order("streams", { ascending: false });
        const { data: gs } = await supabase.from("game_state").select("*").limit(1).single();
        const { count: chartCount } = await supabase.from("charts").select("*", { count: "exact", head: true });
        const { count: reviewCount } = await supabase.from("pitchfork_reviews").select("*", { count: "exact", head: true });
        const { count: historyCount } = await supabase.from("stream_history").select("*", { count: "exact", head: true });
        const { count: concertCount } = await supabase.from("concerts").select("*", { count: "exact", head: true });
        const { count: beefCount } = await supabase.from("beefs").select("*", { count: "exact", head: true });
        const { count: dealCount } = await supabase.from("record_deals").select("*", { count: "exact", head: true });

        const totalStreams = profiles?.reduce((s, p) => s + p.total_streams, 0) || 0;
        const totalMoney = profiles?.reduce((s, p) => s + p.current_money, 0) || 0;
        const totalListeners = profiles?.reduce((s, p) => s + p.monthly_listeners, 0) || 0;
        const avgMoney = profiles?.length ? Math.floor(totalMoney / profiles.length) : 0;
        const topSong = songs?.[0];
        const topArtist = profiles?.[0];

        return json({
          success: true,
          analytics: {
            artists: profiles?.length || 0, songs: songs?.length || 0,
            totalStreams, totalMoney, totalListeners, avgMoney,
            charts: chartCount || 0, reviews: reviewCount || 0,
            streamHistory: historyCount || 0, concerts: concertCount || 0,
            beefs: beefCount || 0, deals: dealCount || 0,
            gameState: gs,
            topArtist: topArtist ? { name: topArtist.artist_name, streams: topArtist.total_streams } : null,
            topSong: topSong ? { title: topSong.title, streams: topSong.streams } : null,
          }
        });
      }

      case "delete_song": {
        await supabase.from("promotions").delete().eq("song_id", song_id);
        await supabase.from("stream_history").delete().eq("song_id", song_id);
        await supabase.from("charts").delete().eq("song_id", song_id);
        await supabase.from("music_videos").delete().eq("song_id", song_id);
        await supabase.from("pitchfork_reviews").delete().eq("song_id", song_id);
        await supabase.from("album_songs").delete().eq("song_id", song_id);
        await supabase.from("songs").delete().eq("id", song_id);
        return json({ success: true, message: "Song deleted" });
      }

      case "rename_artist": {
        const { name } = body;
        if (name) await supabase.from("profiles").update({ artist_name: name }).eq("id", artist_id);
        return json({ success: true, message: `Renamed to ${name}` });
      }

      case "set_genre": {
        const { genre } = body;
        if (genre) await supabase.from("profiles").update({ genre }).eq("id", artist_id);
        return json({ success: true, message: `Genre set to ${genre}` });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
