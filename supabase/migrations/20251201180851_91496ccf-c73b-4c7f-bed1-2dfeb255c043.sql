-- Fix search_path for the new functions
CREATE OR REPLACE FUNCTION get_distinct_event_session_ids()
RETURNS TABLE(session_id text) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ue.session_id
  FROM user_events ue;
END;
$$;

CREATE OR REPLACE FUNCTION get_orphaned_session_ids()
RETURNS TABLE(session_id text) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ue.session_id
  FROM user_events ue
  WHERE NOT EXISTS (
    SELECT 1 FROM user_sessions us WHERE us.session_id = ue.session_id
  );
END;
$$;