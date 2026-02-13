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
  const adminPassword = Deno.env.get("ADMIN_PANEL_PASSWORD")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify admin password
  if (body.password !== adminPassword) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { action, artist_id, song_id, amount } = body;

  try {
    switch (action) {
      case "delete_artist": {
        // Delete all related data then the profile
        await supabase.from("promotions").delete().eq("artist_id", artist_id);
        await supabase.from("stream_history").delete().eq("artist_id", artist_id);
        await supabase.from("charts").delete().eq("artist_id", artist_id);
        await supabase.from("post_likes").delete().or(`liker_id.eq.${artist_id},liked_artist_id.eq.${artist_id}`);
        
        // Get songs to delete album_songs
        const { data: artistSongs } = await supabase.from("songs").select("id").eq("artist_id", artist_id);
        if (artistSongs) {
          for (const s of artistSongs) {
            await supabase.from("album_songs").delete().eq("song_id", s.id);
          }
        }
        await supabase.from("songs").delete().eq("artist_id", artist_id);
        
        // Delete albums
        const { data: artistAlbums } = await supabase.from("albums").select("id").eq("artist_id", artist_id);
        if (artistAlbums) {
          for (const a of artistAlbums) {
            await supabase.from("album_songs").delete().eq("album_id", a.id);
          }
        }
        await supabase.from("albums").delete().eq("artist_id", artist_id);
        await supabase.from("profiles").delete().eq("id", artist_id);
        return new Response(JSON.stringify({ success: true, message: "Artist deleted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "boost_streams": {
        const boost = amount || 100000;
        const { data: song } = await supabase.from("songs").select("streams, artist_id").eq("id", song_id).single();
        if (song) {
          await supabase.from("songs").update({ streams: song.streams + boost }).eq("id", song_id);
          const { data: profile } = await supabase.from("profiles").select("total_streams").eq("id", song.artist_id).single();
          if (profile) {
            await supabase.from("profiles").update({ total_streams: profile.total_streams + boost }).eq("id", song.artist_id);
          }
        }
        return new Response(JSON.stringify({ success: true, message: `Boosted song by ${boost} streams` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "boost_listeners": {
        const boost = amount || 50000;
        const { data: profile } = await supabase.from("profiles").select("monthly_listeners").eq("id", artist_id).single();
        if (profile) {
          await supabase.from("profiles").update({ monthly_listeners: profile.monthly_listeners + boost }).eq("id", artist_id);
        }
        return new Response(JSON.stringify({ success: true, message: `Boosted monthly listeners by ${boost}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "payola": {
        // Give artist money + boost their top song
        const payolaAmount = amount || 500000;
        const { data: profile } = await supabase.from("profiles").select("current_money, monthly_listeners, spotify_followers").eq("id", artist_id).single();
        if (profile) {
          await supabase.from("profiles").update({
            current_money: profile.current_money + payolaAmount,
            monthly_listeners: profile.monthly_listeners + Math.floor(payolaAmount * 0.1),
            spotify_followers: profile.spotify_followers + Math.floor(payolaAmount * 0.05),
          }).eq("id", artist_id);
        }
        // Boost all their songs
        const { data: songs } = await supabase.from("songs").select("id, streams").eq("artist_id", artist_id);
        if (songs) {
          for (const s of songs) {
            await supabase.from("songs").update({ streams: s.streams + Math.floor(payolaAmount * 0.5) }).eq("id", s.id);
          }
        }
        return new Response(JSON.stringify({ success: true, message: `Payola applied: $${payolaAmount}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "industry_plant": {
        // Massive boost to everything
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", artist_id).single();
        if (profile) {
          await supabase.from("profiles").update({
            monthly_listeners: profile.monthly_listeners + 1000000,
            spotify_followers: profile.spotify_followers + 500000,
            apple_music_listeners: profile.apple_music_listeners + 300000,
            youtube_subscribers: profile.youtube_subscribers + 200000,
            x_followers: profile.x_followers + 150000,
            total_streams: profile.total_streams + 5000000,
          }).eq("id", artist_id);
        }
        const { data: songs } = await supabase.from("songs").select("id, streams, radio_spins").eq("artist_id", artist_id);
        if (songs) {
          for (const s of songs) {
            await supabase.from("songs").update({
              streams: s.streams + 1000000,
              radio_spins: (s.radio_spins || 0) + 50000,
            }).eq("id", s.id);
          }
        }
        return new Response(JSON.stringify({ success: true, message: "Industry plant activated 🌱" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chart_placement": {
        // Force a song to a specific chart position
        const position = amount || 1;
        const { data: song } = await supabase.from("songs").select("artist_id").eq("id", song_id).single();
        if (song) {
          const { data: gs } = await supabase.from("game_state").select("current_turn").limit(1).single();
          const turn = gs?.current_turn || 1;
          const chartTypes = ["top_songs", "hot_100_daily", "hot_100_weekly"];
          for (const ct of chartTypes) {
            await supabase.from("charts").insert({
              turn_number: turn,
              position,
              song_id,
              artist_id: song.artist_id,
              streams: 99999999,
              chart_type: ct,
            });
          }
        }
        return new Response(JSON.stringify({ success: true, message: `Song placed at #${position} on charts` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "test": {
        return new Response(JSON.stringify({ success: true, message: "Authenticated" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
