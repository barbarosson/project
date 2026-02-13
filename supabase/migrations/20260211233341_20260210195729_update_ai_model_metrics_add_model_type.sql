/*
  # Update AI Model Metrics Table
  Add model_type, precision_score, recall_score, f1_score, training_duration_seconds, additional_metrics
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_model_metrics' AND column_name = 'model_type') THEN
    ALTER TABLE public.ai_model_metrics ADD COLUMN model_type TEXT NOT NULL DEFAULT 'production_decision';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_model_metrics' AND column_name = 'precision_score') THEN
    ALTER TABLE public.ai_model_metrics ADD COLUMN precision_score DECIMAL(5,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_model_metrics' AND column_name = 'recall_score') THEN
    ALTER TABLE public.ai_model_metrics ADD COLUMN recall_score DECIMAL(5,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_model_metrics' AND column_name = 'f1_score') THEN
    ALTER TABLE public.ai_model_metrics ADD COLUMN f1_score DECIMAL(5,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_model_metrics' AND column_name = 'training_duration_seconds') THEN
    ALTER TABLE public.ai_model_metrics ADD COLUMN training_duration_seconds INTEGER;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_model_metrics' AND column_name = 'additional_metrics') THEN
    ALTER TABLE public.ai_model_metrics ADD COLUMN additional_metrics JSONB;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_model_metrics_type ON public.ai_model_metrics(model_type);