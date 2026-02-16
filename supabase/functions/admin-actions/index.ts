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
        // Delete ALL related data across every table
        await supabase.from("promotions").delete().eq("artist_id", artist_id);
        await supabase.from("stream_history").delete().eq("artist_id", artist_id);
        await supabase.from("charts").delete().eq("artist_id", artist_id);
        await supabase.from("post_likes").delete().or(`liker_id.eq.${artist_id},liked_artist_id.eq.${artist_id}`);
        await supabase.from("music_videos").delete().eq("artist_id", artist_id);
        await supabase.from("merch_items").delete().eq("artist_id", artist_id);
        await supabase.from("fan_mail").delete().eq("artist_id", artist_id);
        await supabase.from("awards").delete().eq("artist_id", artist_id);
        await supabase.from("pitchfork_reviews").delete().eq("artist_id", artist_id);
        await supabase.from("concerts").delete().eq("artist_id", artist_id);
        await supabase.from("record_deals").delete().eq("artist_id", artist_id);
        await supabase.from("beefs").delete().or(`initiator_id.eq.${artist_id},target_id.eq.${artist_id}`);
        await supabase.from("travels").delete().eq("artist_id", artist_id);
        await supabase.from("visas").delete().eq("artist_id", artist_id);
        await supabase.from("artist_items").delete().eq("artist_id", artist_id);
        await supabase.from("bank_transactions").delete().or(`sender_id.eq.${artist_id},receiver_id.eq.${artist_id}`);
        await supabase.from("collaborations").delete().or(`sender_id.eq.${artist_id},receiver_id.eq.${artist_id}`);

        // Get songs to delete album_songs
        const { data: artistSongs } = await supabase.from("songs").select("id").eq("artist_id", artist_id);
        if (artistSongs) {
          for (const s of artistSongs) {
            await supabase.from("album_songs").delete().eq("song_id", s.id);
          }
        }
        await supabase.from("songs").delete().eq("artist_id", artist_id);

        const { data: artistAlbums } = await supabase.from("albums").select("id").eq("artist_id", artist_id);
        if (artistAlbums) {
          for (const a of artistAlbums) {
            await supabase.from("album_songs").delete().eq("album_id", a.id);
          }
        }
        await supabase.from("albums").delete().eq("artist_id", artist_id);
        await supabase.from("profiles").delete().eq("id", artist_id);
        return new Response(JSON.stringify({ success: true, message: "Artist and all data deleted" }), {
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
        const payolaAmount = amount || 500000;
        const { data: profile } = await supabase.from("profiles").select("current_money, monthly_listeners, spotify_followers").eq("id", artist_id).single();
        if (profile) {
          await supabase.from("profiles").update({
            current_money: profile.current_money + payolaAmount,
            monthly_listeners: profile.monthly_listeners + Math.floor(payolaAmount * 0.1),
            spotify_followers: profile.spotify_followers + Math.floor(payolaAmount * 0.05),
          }).eq("id", artist_id);
        }
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
        return new Response(JSON.stringify({ success: true, message: "Industry plant activated" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chart_placement": {
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

      case "set_turn_duration": {
        const minutes = amount || 60;
        await supabase.from("game_state").update({ turn_duration_minutes: minutes }).neq("id", "");
        return new Response(JSON.stringify({ success: true, message: `Turn duration set to ${minutes} minutes` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_timer": {
        await supabase.from("game_state").update({ turn_started_at: new Date().toISOString() }).neq("id", "");
        return new Response(JSON.stringify({ success: true, message: "Timer reset to now" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "force_next_turn": {
        const { data: gs } = await supabase.from("game_state").select("*").limit(1).single();
        if (gs) {
          await supabase.from("game_state").update({
            current_turn: gs.current_turn + 1,
            turn_started_at: new Date().toISOString(),
          }).eq("id", gs.id);
        }
        return new Response(JSON.stringify({ success: true, message: "Skipped to next turn" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "give_money": {
        const cash = amount || 100000;
        const { data: profile } = await supabase.from("profiles").select("current_money").eq("id", artist_id).single();
        if (profile) {
          await supabase.from("profiles").update({ current_money: profile.current_money + cash }).eq("id", artist_id);
        }
        return new Response(JSON.stringify({ success: true, message: `Gave $${cash} to artist` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_followers": {
        const { platform, count } = body;
        const updateObj: Record<string, number> = {};
        if (platform === "spotify") updateObj.spotify_followers = count;
        else if (platform === "apple") updateObj.apple_music_listeners = count;
        else if (platform === "youtube") updateObj.youtube_subscribers = count;
        else if (platform === "x") updateObj.x_followers = count;
        else if (platform === "monthly") updateObj.monthly_listeners = count;
        await supabase.from("profiles").update(updateObj).eq("id", artist_id);
        return new Response(JSON.stringify({ success: true, message: `Set ${platform} to ${count}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "give_money_all": {
        const cash = amount || 10000;
        const { data: allProfiles } = await supabase.from("profiles").select("id, current_money");
        if (allProfiles) {
          for (const p of allProfiles) {
            await supabase.from("profiles").update({ current_money: p.current_money + cash }).eq("id", p.id);
          }
        }
        return new Response(JSON.stringify({ success: true, message: `Gave $${cash} to all artists` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_economy": {
        const { data: allProfiles } = await supabase.from("profiles").select("id, starting_money");
        if (allProfiles) {
          for (const p of allProfiles) {
            await supabase.from("profiles").update({ current_money: p.starting_money }).eq("id", p.id);
          }
        }
        return new Response(JSON.stringify({ success: true, message: "Economy reset to starting money" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "boost_all_streams": {
        const boost = amount || 50000;
        const { data: allSongs } = await supabase.from("songs").select("id, streams, artist_id");
        if (allSongs) {
          for (const s of allSongs) {
            await supabase.from("songs").update({ streams: s.streams + boost }).eq("id", s.id);
          }
          const artistMap: Record<string, number> = {};
          for (const s of allSongs) { artistMap[s.artist_id] = (artistMap[s.artist_id] || 0) + boost; }
          for (const [aid, total] of Object.entries(artistMap)) {
            const { data: p } = await supabase.from("profiles").select("total_streams").eq("id", aid).single();
            if (p) await supabase.from("profiles").update({ total_streams: p.total_streams + total }).eq("id", aid);
          }
        }
        return new Response(JSON.stringify({ success: true, message: `Boosted all songs by ${boost}` }), {
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
