-- RASCUNHO: Não executar antes de autorização explícita de publicação.
-- País aproximado do visitante enviado pelo navegador, sujeito a imprecisão de VPN/proxy.
-- Preserva a mesma verificação de permissões da função já publicada.
CREATE OR REPLACE FUNCTION public.uentzoul_track_visit_device(p_visit_key uuid, p_kind text, p_section text DEFAULT NULL::text, p_detail text DEFAULT NULL::text, p_semester text DEFAULT NULL::text, p_device jsonb DEFAULT NULL::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_id bigint;
 v_kind text;
 v_family text;
 v_browser text;
 v_os text;
 v_major text;
 v_os_version text;
 v_country text;
 v_mode text;
 v_width integer;
 v_height integer;
 v_info jsonb;
BEGIN
 v_id := public.uentzoul_track_visit(p_visit_key,p_kind,p_section,p_detail,p_semester);
 IF v_id IS NULL OR p_device IS NULL OR jsonb_typeof(p_device)<>'object' THEN
  RETURN v_id;
 END IF;
 v_kind := CASE WHEN p_device->>'kind' IN ('phone','tablet','desktop') THEN p_device->>'kind' ELSE 'unknown' END;
 v_family := CASE WHEN p_device->>'family' IN ('iPhone','iPad','Android phone','Android tablet','Windows PC','Mac','Linux PC','ChromeOS PC','Other') THEN p_device->>'family' ELSE 'Other' END;
 v_browser := CASE WHEN p_device->>'browser' IN ('Safari','Chrome','Firefox','Edge','Opera','Samsung Internet','Chromium','Other') THEN p_device->>'browser' ELSE 'Other' END;
 v_os := CASE WHEN p_device->>'os' IN ('iOS','iPadOS','Android','Windows','macOS','Linux','ChromeOS','Other') THEN p_device->>'os' ELSE 'Other' END;
 v_major := CASE WHEN p_device->>'browser_major' ~ '^[0-9]{1,3}$' THEN p_device->>'browser_major' ELSE NULL END;
 v_os_version := CASE WHEN p_device->>'os_version' ~ '^[0-9]{1,3}(\.[0-9]{1,3}){0,2}$' THEN p_device->>'os_version' ELSE NULL END;
 v_mode := CASE WHEN p_device->>'mode' IN ('browser','standalone','fullscreen') THEN p_device->>'mode' ELSE 'browser' END;
 v_country := CASE WHEN pg_catalog.upper(p_device->>'country_code') ~ '^[A-Z]{2}$' AND pg_catalog.upper(p_device->>'country_code') <> 'XX' THEN pg_catalog.upper(p_device->>'country_code') ELSE NULL END;
 v_width := CASE WHEN p_device->>'width' ~ '^[0-9]{2,5}$' THEN LEAST((p_device->>'width')::integer,10000) ELSE NULL END;
 v_height := CASE WHEN p_device->>'height' ~ '^[0-9]{2,5}$' THEN LEAST((p_device->>'height')::integer,10000) ELSE NULL END;
 v_info := pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
  'kind',v_kind,'family',v_family,'browser',v_browser,'browser_major',v_major,
  'os',v_os,'os_version',v_os_version,'width',v_width,'height',v_height,'mode',v_mode,'country_code',v_country
 ));
 UPDATE public.uentzoul_access_log
 SET device_info = CASE WHEN device_info IS NULL THEN v_info ELSE device_info || pg_catalog.jsonb_build_object('country_code',v_country) END
 WHERE id=v_id
  AND (device_info IS NULL OR (device_info->>'country_code' IS NULL AND v_country IS NOT NULL))
  AND ( (user_id IS NOT NULL AND user_id=(select auth.uid()))
       OR (actor='anonymous' AND (select auth.uid()) IS NULL) );
 RETURN v_id;
END
$function$;
