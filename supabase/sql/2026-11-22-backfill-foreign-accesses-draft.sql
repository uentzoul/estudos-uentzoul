-- RASCUNHO: Não executar no banco até aprovação explícita de publicação.
-- País estimado a partir de requisições RPC no mesmo instante das entradas (margem de 0,75s antes a 2,3s após).
-- Mesmo user_id ou mesma condição anônima; SO e navegador compatíveis. País único dentro dessa janela.
-- Sem IP, sem cidade, sem identificação pessoal. VPN ou proxy podem distorcer o país.
-- Visitas antigas sem correspondência segura permanecem sem país. 18 visitas mapeadas.
WITH recuperados(id,country_code,expected_entered_at) AS (
 VALUES
  (398, 'US', '2026-11-15T18:09:21.998406+00:00'::timestamptz),
  (399, 'CA', '2026-11-15T18:14:11.559121+00:00'::timestamptz),
  (402, 'US', '2026-11-15T21:41:57.180829+00:00'::timestamptz),
  (405, 'GB', '2026-11-16T09:34:31.192181+00:00'::timestamptz),
  (407, 'US', '2026-11-16T12:35:35.057697+00:00'::timestamptz),
  (411, 'DE', '2026-11-16T15:59:53.358605+00:00'::timestamptz),
  (418, 'US', '2026-11-16T19:17:34.374844+00:00'::timestamptz),
  (419, 'US', '2026-11-16T19:48:13.460511+00:00'::timestamptz),
  (421, 'GB', '2026-11-17T06:31:04.143963+00:00'::timestamptz),
  (448, 'CA', '2026-11-17T18:05:20.871754+00:00'::timestamptz),
  (452, 'US', '2026-11-17T21:28:50.54546+00:00'::timestamptz),
  (470, 'US', '2026-11-18T17:52:25.979126+00:00'::timestamptz),
  (487, 'US', '2026-11-18T20:43:19.465292+00:00'::timestamptz),
  (489, 'US', '2026-11-18T22:35:11.480108+00:00'::timestamptz),
  (506, 'CA', '2026-11-19T17:17:47.091855+00:00'::timestamptz),
  (540, 'CA', '2026-11-21T16:18:16.17992+00:00'::timestamptz),
  (545, 'TW', '2026-11-21T20:33:35.055942+00:00'::timestamptz),
  (550, 'US', '2026-11-21T23:24:44.266768+00:00'::timestamptz)
)
UPDATE public.uentzoul_access_log a
SET device_info = pg_catalog.jsonb_set(a.device_info, '{country_code}', pg_catalog.to_jsonb(r.country_code), true)
FROM recuperados r
WHERE a.id = r.id AND a.device_info IS NOT NULL
 AND a.device_info->>'country_code' IS NULL
 AND a.entered_at = r.expected_entered_at
 AND r.country_code ~ '^[A-Z]{2}$' AND r.country_code <> 'BR';

-- Conferir após aplicar:
-- SELECT device_info->>'country_code' AS country, count(*)
-- FROM public.uentzoul_access_log WHERE device_info ? 'country_code' GROUP BY 1 ORDER BY 2 DESC;
