-- Create function to get distinct session_ids from user_events
CREATE OR REPLACE FUNCTION get_distinct_event_session_ids()
RETURNS TABLE(session_id text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ue.session_id
  FROM user_events ue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get orphaned session_ids (in events but not in sessions)
CREATE OR REPLACE FUNCTION get_orphaned_session_ids()
RETURNS TABLE(session_id text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ue.session_id
  FROM user_events ue
  WHERE NOT EXISTS (
    SELECT 1 FROM user_sessions us WHERE us.session_id = ue.session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;