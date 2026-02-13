import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: gameState, error: gsError } = await supabase
    .from("game_state")
    .select("*")
    .limit(1)
    .single();

  if (gsError || !gameState) {
    return new Response(JSON.stringify({ error: "No game state found" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const turnStart = new Date(gameState.turn_started_at).getTime();
  const turnDuration = gameState.turn_duration_minutes * 60 * 1000;
  const now = Date.now();

  if (now - turnStart < turnDuration) {
    return new Response(JSON.stringify({ message: "Turn not over yet", time_left_ms: turnStart + turnDuration - now }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const newTurn = gameState.current_turn + 1;

  const { data: songs } = await supabase
    .from("songs")
    .select("id, artist_id, streams, release_turn, radio_spins");

  if (songs && songs.length > 0) {
    for (const song of songs) {
      const { data: promos } = await supabase
        .from("promotions")
        .select("boost_multiplier")
        .eq("song_id", song.id)
        .eq("active", true)
        .limit(1);

      const multiplier = promos && promos.length > 0 ? Number(promos[0].boost_multiplier) : 1;

      // BOOSTED: base streams now 2,000 - 25,000 (was 100-5000)
      const turnsOut = Math.max(1, newTurn - song.release_turn);
      const decayFactor = Math.max(0.15, 1 - turnsOut * 0.03); // slower decay
      const baseStreams = Math.floor((Math.random() * 23000 + 2000) * decayFactor * multiplier);

      // Radio spins: 50-500 per turn, boosted by promotions
      const radioSpins = Math.floor((Math.random() * 450 + 50) * decayFactor * multiplier);

      // Distribute across platforms
      const spotifyStreams = Math.floor(baseStreams * 0.55);
      const appleStreams = Math.floor(baseStreams * 0.28);
      const youtubeStreams = Math.floor(baseStreams * 0.17);

      await supabase
        .from("songs")
        .update({
          streams: song.streams + baseStreams,
          radio_spins: (song.radio_spins || 0) + radioSpins,
        })
        .eq("id", song.id);

      const platforms = [
        { platform: "spotify", streams_gained: spotifyStreams },
        { platform: "apple_music", streams_gained: appleStreams },
        { platform: "youtube", streams_gained: youtubeStreams },
      ];

      for (const p of platforms) {
        await supabase.from("stream_history").insert({
          artist_id: song.artist_id,
          song_id: song.id,
          turn_number: newTurn,
          platform: p.platform,
          streams_gained: p.streams_gained,
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_streams, monthly_listeners, spotify_followers, apple_music_listeners, youtube_subscribers")
        .eq("id", song.artist_id)
        .single();

      if (profile) {
        const newFollowers = Math.floor(baseStreams * 0.02 * multiplier);
        await supabase
          .from("profiles")
          .update({
            total_streams: profile.total_streams + baseStreams,
            monthly_listeners: profile.monthly_listeners + Math.floor(baseStreams * 0.4),
            spotify_followers: profile.spotify_followers + Math.floor(newFollowers * 0.5),
            apple_music_listeners: profile.apple_music_listeners + Math.floor(newFollowers * 0.3),
            youtube_subscribers: profile.youtube_subscribers + Math.floor(newFollowers * 0.2),
          })
          .eq("id", song.artist_id);
      }

      if (promos && promos.length > 0) {
        await supabase
          .from("promotions")
          .update({ active: false })
          .eq("song_id", song.id)
          .eq("active", true);
      }
    }

    // Generate multiple chart types
    const { data: allSongs } = await supabase
      .from("songs")
      .select("id, artist_id, streams, radio_spins")
      .order("streams", { ascending: false })
      .limit(100);

    if (allSongs) {
      const chartInserts: any[] = [];

      // Top Songs (overall)
      allSongs.slice(0, 50).forEach((s, i) => {
        chartInserts.push({ turn_number: newTurn, position: i + 1, song_id: s.id, artist_id: s.artist_id, streams: s.streams, chart_type: "top_songs" });
      });

      // Hot 100 Daily (same as top songs but labeled differently for daily tracking)
      allSongs.slice(0, 100).forEach((s, i) => {
        chartInserts.push({ turn_number: newTurn, position: i + 1, song_id: s.id, artist_id: s.artist_id, streams: s.streams, chart_type: "hot_100_daily" });
      });

      // Hot 100 Weekly (accumulated over last 7 turns)
      allSongs.slice(0, 100).forEach((s, i) => {
        chartInserts.push({ turn_number: newTurn, position: i + 1, song_id: s.id, artist_id: s.artist_id, streams: s.streams, chart_type: "hot_100_weekly" });
      });

      // Daily Radio (sorted by radio_spins)
      const byRadio = [...allSongs].sort((a, b) => (b.radio_spins || 0) - (a.radio_spins || 0));
      byRadio.slice(0, 50).forEach((s, i) => {
        chartInserts.push({ turn_number: newTurn, position: i + 1, song_id: s.id, artist_id: s.artist_id, streams: s.radio_spins || 0, chart_type: "daily_radio" });
      });

      // Weekly Radio
      byRadio.slice(0, 50).forEach((s, i) => {
        chartInserts.push({ turn_number: newTurn, position: i + 1, song_id: s.id, artist_id: s.artist_id, streams: s.radio_spins || 0, chart_type: "weekly_radio" });
      });

      // Batch insert all charts
      await supabase.from("charts").insert(chartInserts);
    }

    // Monthly Listeners chart (artist-level)
    const { data: allArtists } = await supabase
      .from("profiles")
      .select("id, monthly_listeners")
      .order("monthly_listeners", { ascending: false })
      .limit(50);

    if (allArtists) {
      const artistCharts = allArtists.map((a, i) => ({
        turn_number: newTurn,
        position: i + 1,
        artist_id: a.id,
        streams: a.monthly_listeners,
        chart_type: "monthly_listeners",
      }));
      await supabase.from("charts").insert(artistCharts);
    }
  }

  await supabase
    .from("game_state")
    .update({
      current_turn: newTurn,
      turn_started_at: new Date().toISOString(),
    })
    .eq("id", gameState.id);

  return new Response(JSON.stringify({ message: "Turn processed", new_turn: newTurn }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
