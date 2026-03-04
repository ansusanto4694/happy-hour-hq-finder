-- Retroactively mark sessions with Linux x86_64 user agents as bots
UPDATE public.user_sessions
SET is_bot = true, bot_type = 'suspicious'
WHERE is_bot = false
  AND user_agent LIKE '%X11; Linux x86_64%'
  AND user_agent NOT LIKE '%Android%';

-- Retroactively mark sessions with outdated Chrome versions (Chrome <= 131) as bots
-- Current Chrome is 134, so 3+ behind = 131 and below
UPDATE public.user_sessions
SET is_bot = true, bot_type = 'suspicious'
WHERE is_bot = false
  AND user_agent ~ 'Chrome/([0-9]{1,2}|1[0-2][0-9]|13[01])\.';