-- Adventora.ai: profiles, trips, trip_items, RAG (pgvector)
-- Run via Supabase CLI or SQL Editor.

CREATE EXTENSION IF NOT EXISTS vector;

-- ---- Updated-at helper ----
CREATE OR REPLACE FUNCTION public.adventora_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---- Profiles ----
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  travel_style TEXT,
  home_city TEXT,
  dietary_notes TEXT,
  pace TEXT,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_adventora_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.adventora_set_updated_at();

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.adventora_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS adventora_on_auth_user_created ON auth.users;
CREATE TRIGGER adventora_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.adventora_handle_new_user();

-- ---- Trips ----
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  total_budget NUMERIC(14, 2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'booked', 'completed')),
  plan_markdown TEXT,
  rag_sources JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trips_adventora_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE PROCEDURE public.adventora_set_updated_at();

CREATE INDEX trips_user_id_idx ON public.trips (user_id);
CREATE INDEX trips_status_idx ON public.trips (status);

-- ---- Trip items ----
CREATE TABLE public.trip_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('flight', 'hotel', 'activity', 'transport', 'meal', 'other')),
  title TEXT,
  notes TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location_data JSONB,
  booking_ref TEXT,
  price NUMERIC(14, 2),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trip_items_trip_id_idx ON public.trip_items (trip_id);

-- ---- RAG documents (text-embedding-3-small = 1536) ----
CREATE TABLE public.destination_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX destination_documents_slug_idx ON public.destination_documents (destination_slug);

CREATE INDEX destination_documents_embedding_idx
  ON public.destination_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 2);

-- Similarity search (cosine operator <=>)
CREATE OR REPLACE FUNCTION public.match_destination_docs(
  query_embedding vector(1536),
  match_count INT,
  filter_slug TEXT
)
RETURNS TABLE (
  id UUID,
  destination_slug TEXT,
  title TEXT,
  content TEXT,
  source_url TEXT,
  similarity DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.destination_slug,
    d.title,
    d.content,
    d.source_url,
    (1 - (d.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity
  FROM public.destination_documents d
  WHERE d.embedding IS NOT NULL
    AND (filter_slug IS NULL OR trim(filter_slug) = '' OR d.destination_slug = filter_slug)
  ORDER BY d.embedding <=> query_embedding
  LIMIT greatest(1, least(match_count, 20));
$$;

-- ---- RLS ----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "trips_select_own"
  ON public.trips FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "trips_insert_own"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trips_update_own"
  ON public.trips FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trips_delete_own"
  ON public.trips FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "trip_items_select_via_trip"
  ON public.trip_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "trip_items_insert_via_trip"
  ON public.trip_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "trip_items_update_via_trip"
  ON public.trip_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "trip_items_delete_via_trip"
  ON public.trip_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "destination_documents_read_auth"
  ON public.destination_documents FOR SELECT TO authenticated
  USING (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_items TO authenticated;
GRANT SELECT ON public.destination_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_destination_docs(vector, INT, TEXT) TO authenticated;
