-- Allow logged-out users to run RAG retrieval (read-only) for public planner
CREATE POLICY "destination_documents_read_anon"
  ON public.destination_documents FOR SELECT TO anon
  USING (true);

GRANT SELECT ON public.destination_documents TO anon;
GRANT EXECUTE ON FUNCTION public.match_destination_docs(vector, INT, TEXT) TO anon;
