/*
  # create_supplier_from_customer RPC

  Carilerden (vendor/both) tedarikçi seçildiğinde suppliers tablosuna
  kayıt oluşturmak için kullanılır. RLS bypass (SECURITY DEFINER).

  İzin: p_tenant_id = profile.tenant_id VEYA p_tenant_id = auth.uid()
*/

CREATE OR REPLACE FUNCTION create_supplier_from_customer(
  p_tenant_id uuid,
  p_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_tenant_id uuid;
  v_new_id uuid;
BEGIN
  SELECT p.tenant_id INTO v_caller_tenant_id
  FROM profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant mismatch: tenant_id required';
  END IF;

  IF (v_caller_tenant_id IS NOT NULL AND v_caller_tenant_id != p_tenant_id)
     AND (p_tenant_id != auth.uid()) THEN
    RAISE EXCEPTION 'Tenant mismatch: cannot create supplier for another tenant';
  END IF;

  INSERT INTO suppliers (tenant_id, name, category, country, status)
  VALUES (
    p_tenant_id,
    COALESCE(NULLIF(TRIM(p_name), ''), 'Tedarikçi'),
    'general',
    'TR',
    'active'
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
