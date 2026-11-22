-- Only touches events / event_schedules. Day numbers: 0 = Monday ... 6 = Sunday.

-- Down The Hatch (18): replace schedules with what the specials menu says
DELETE FROM public.event_schedules WHERE event_id IN (SELECT id FROM public.events WHERE merchant_id = 18);
INSERT INTO public.event_schedules (event_id, schedule_type, day_of_week, start_time, end_time, is_active, legacy_source)
SELECT v.eid::uuid, 'recurring', v.d, v.s::time, v.e::time, true, 'menu_alignment'
FROM (VALUES
  ('a3554fde-8706-45b6-a7f3-716008906403',0,'14:00','19:00'),
  ('a3554fde-8706-45b6-a7f3-716008906403',1,'14:00','19:00'),
  ('a3554fde-8706-45b6-a7f3-716008906403',2,'14:00','19:00'),
  ('a3554fde-8706-45b6-a7f3-716008906403',3,'14:00','19:00'),
  ('a3554fde-8706-45b6-a7f3-716008906403',4,'14:00','19:00'),
  ('14c41612-95fc-4b73-b1e7-9b25c94ddc13',0,'19:00','04:00'),
  ('ecd6da8c-de2a-407b-99e6-0bd48259200d',1,'19:00','04:00'),
  ('5479c10e-1b40-4276-b698-a3877decd6b5',2,'19:00','04:00'),
  ('9e2105b9-2072-413e-9ad4-12ad835a0c2c',3,'19:00','04:00'),
  ('c9b139a0-e8f2-43b5-a29f-5f5cd20dcb72',4,'19:00','04:00'),
  ('d53aa4e9-ace4-4a6d-9f44-ef96b32558ff',5,'12:00','19:00'),
  ('2c70caca-265d-41f4-9b6f-281f2fb95ac2',6,'12:00','04:00'),
  -- Yuca Bottomless: everyday 11-4
  ('481725dc-ae2d-4291-9c69-2fcc620ee402',0,'11:00','16:00'),
  ('481725dc-ae2d-4291-9c69-2fcc620ee402',1,'11:00','16:00'),
  ('481725dc-ae2d-4291-9c69-2fcc620ee402',2,'11:00','16:00'),
  ('481725dc-ae2d-4291-9c69-2fcc620ee402',3,'11:00','16:00'),
  ('481725dc-ae2d-4291-9c69-2fcc620ee402',4,'11:00','16:00'),
  ('481725dc-ae2d-4291-9c69-2fcc620ee402',5,'11:00','16:00'),
  ('481725dc-ae2d-4291-9c69-2fcc620ee402',6,'11:00','16:00'),
  -- Mommy's Late Night: midnight-3am weekdays, midnight-4am weekends
  ('b115789a-7016-4a5f-a38a-dac228f4effc',6,'00:00','03:00'),
  ('b115789a-7016-4a5f-a38a-dac228f4effc',0,'00:00','03:00'),
  ('b115789a-7016-4a5f-a38a-dac228f4effc',1,'00:00','03:00'),
  ('b115789a-7016-4a5f-a38a-dac228f4effc',2,'00:00','03:00'),
  ('b115789a-7016-4a5f-a38a-dac228f4effc',3,'00:00','03:00'),
  ('b115789a-7016-4a5f-a38a-dac228f4effc',4,'00:00','04:00'),
  ('b115789a-7016-4a5f-a38a-dac228f4effc',5,'00:00','04:00'),
  -- Whiskey On Grand Sunday FUNday
  ('c669b70d-008f-494b-947c-bf03a1361275',6,'12:00','02:00'),
  -- Cooper's Late Night from 11pm
  ('0dc475db-a2da-4819-ab5f-56dfa6a70c99',0,'23:00','02:00'),
  ('0dc475db-a2da-4819-ab5f-56dfa6a70c99',1,'23:00','02:00'),
  ('0dc475db-a2da-4819-ab5f-56dfa6a70c99',2,'23:00','02:00'),
  ('0dc475db-a2da-4819-ab5f-56dfa6a70c99',3,'23:00','02:00'),
  ('0dc475db-a2da-4819-ab5f-56dfa6a70c99',4,'23:00','02:00'),
  ('0dc475db-a2da-4819-ab5f-56dfa6a70c99',5,'23:00','02:00'),
  ('0dc475db-a2da-4819-ab5f-56dfa6a70c99',6,'23:00','02:00'),
  -- City Coffee Bottomless Brunch Sat & Sun
  ('0bf55c1b-5595-4662-9886-a2df814263d8',5,'11:00','16:00'),
  ('0bf55c1b-5595-4662-9886-a2df814263d8',6,'11:00','16:00')
) AS v(eid, d, s, e);

-- Mommy's Jazz Night: Sunday 7-10pm
UPDATE public.event_schedules SET day_of_week = 6
WHERE event_id = '78b0701b-ec41-446f-96fa-51e529c0e88d' AND day_of_week = 0;

-- Savoi (94): each special only on its own day
DELETE FROM public.event_schedules WHERE event_id IN (SELECT id FROM public.events WHERE merchant_id = 94);
INSERT INTO public.event_schedules (event_id, schedule_type, day_of_week, start_time, end_time, is_active, legacy_source)
VALUES
  ('597a3bae-a3eb-4820-9a63-ae382e1c626f','recurring',0,'15:00','20:00',true,'menu_alignment'),
  ('a1db750d-119a-439e-a61e-b7deb7896d27','recurring',1,'15:00','20:00',true,'menu_alignment'),
  ('262fd856-c83b-40e9-bba1-74c9c2ab79ba','recurring',3,'15:00','20:00',true,'menu_alignment');

-- Cozy Royale Late Night: Sun-Thu only (drop Friday)
DELETE FROM public.event_schedules
WHERE event_id = 'd3a53b4c-9717-49aa-8b1b-78b5ec27f27a' AND day_of_week = 4;