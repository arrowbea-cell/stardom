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

  // Get current game state
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

  // Advance turn
  const newTurn = gameState.current_turn + 1;

  // Get all released songs with their promotions
  const { data: songs } = await supabase
    .from("songs")
    .select("id, artist_id, streams, release_turn");

  if (songs && songs.length > 0) {
    for (const song of songs) {
      // Check for active promotion
      const { data: promos } = await supabase
        .from("promotions")
        .select("boost_multiplier")
        .eq("song_id", song.id)
        .eq("active", true)
        .limit(1);

      const multiplier = promos && promos.length > 0 ? Number(promos[0].boost_multiplier) : 1;

      // Base streams: random between 100-5000, scaled by how long the song has been out
      const turnsOut = Math.max(1, newTurn - song.release_turn);
      const decayFactor = Math.max(0.1, 1 - turnsOut * 0.05); // songs decay over time
      const baseStreams = Math.floor((Math.random() * 4900 + 100) * decayFactor * multiplier);

      // Distribute across platforms
      const spotifyStreams = Math.floor(baseStreams * 0.6);
      const appleStreams = Math.floor(baseStreams * 0.25);
      const youtubeStreams = Math.floor(baseStreams * 0.15);

      // Update song streams
      await supabase
        .from("songs")
        .update({ streams: song.streams + baseStreams })
        .eq("id", song.id);

      // Insert stream history
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

      // Update artist profile stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_streams, monthly_listeners, spotify_followers, apple_music_listeners, youtube_subscribers")
        .eq("id", song.artist_id)
        .single();

      if (profile) {
        const newFollowers = Math.floor(baseStreams * 0.01 * multiplier);
        await supabase
          .from("profiles")
          .update({
            total_streams: profile.total_streams + baseStreams,
            monthly_listeners: profile.monthly_listeners + Math.floor(baseStreams * 0.3),
            spotify_followers: profile.spotify_followers + Math.floor(newFollowers * 0.5),
            apple_music_listeners: profile.apple_music_listeners + Math.floor(newFollowers * 0.3),
            youtube_subscribers: profile.youtube_subscribers + Math.floor(newFollowers * 0.2),
          })
          .eq("id", song.artist_id);
      }

      // Deactivate promotions after they've been active for a turn
      if (promos && promos.length > 0) {
        await supabase
          .from("promotions")
          .update({ active: false })
          .eq("song_id", song.id)
          .eq("active", true);
      }
    }

    // Generate charts for this turn
    const { data: allSongs } = await supabase
      .from("songs")
      .select("id, artist_id, streams")
      .order("streams", { ascending: false })
      .limit(50);

    if (allSongs) {
      for (let i = 0; i < allSongs.length; i++) {
        await supabase.from("charts").insert({
          turn_number: newTurn,
          position: i + 1,
          song_id: allSongs[i].id,
          artist_id: allSongs[i].artist_id,
          streams: allSongs[i].streams,
          chart_type: "top_songs",
        });
      }
    }
  }

  // Update game state
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
