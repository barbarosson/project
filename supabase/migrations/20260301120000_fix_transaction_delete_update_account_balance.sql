-- İşlem silindiğinde veya güncellendiğinde hesap bakiyesinin güncellenmesi.
-- Mevcut trigger sadece INSERT için çalışıyordu; DELETE ve UPDATE eklendi.

DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.transaction_type = 'income' THEN
      UPDATE accounts
      SET current_balance = current_balance + NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    ELSIF NEW.transaction_type = 'expense' THEN
      UPDATE accounts
      SET current_balance = current_balance - NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Silinen işlemin etkisini geri al
    IF OLD.transaction_type = 'income' THEN
      UPDATE accounts
      SET current_balance = current_balance - OLD.amount,
          updated_at = now()
      WHERE id = OLD.account_id;
    ELSIF OLD.transaction_type = 'expense' THEN
      UPDATE accounts
      SET current_balance = current_balance + OLD.amount,
          updated_at = now()
      WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Eski işlemin etkisini geri al
    IF OLD.transaction_type = 'income' THEN
      UPDATE accounts
      SET current_balance = current_balance - OLD.amount,
          updated_at = now()
      WHERE id = OLD.account_id;
    ELSIF OLD.transaction_type = 'expense' THEN
      UPDATE accounts
      SET current_balance = current_balance + OLD.amount,
          updated_at = now()
      WHERE id = OLD.account_id;
    END IF;
    -- Yeni işlemi uygula (hesap değişmiş olabilir)
    IF NEW.transaction_type = 'income' THEN
      UPDATE accounts
      SET current_balance = current_balance + NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    ELSIF NEW.transaction_type = 'expense' THEN
      UPDATE accounts
      SET current_balance = current_balance - NEW.amount,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

COMMENT ON FUNCTION update_account_balance() IS 'Updates account current_balance when transactions are inserted, updated or deleted.';
