
-- Add radio_spins to songs for the radio chart system
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS radio_spins bigint NOT NULL DEFAULT 0;

-- Add chart_type options to charts table for new chart types
-- (weekly_radio, daily_radio, hot_100_daily, hot_100_weekly, monthly_listeners, top_songs)
-- These are already text type so no schema change needed, just documenting the new values
