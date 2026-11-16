-- Add previous-token hash to sessions for refresh-token reuse detection.
ALTER TABLE "sessions" ADD COLUMN "previous_token_hash" TEXT;
