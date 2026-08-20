-- Migration: Add allergy_type to distinguish medical allergy vs. dislike/preference
-- Context: A student writing "allergic to egg" may in fact just dislike eggs,
-- not have a real medical allergy. This column lets the student self-declare
-- which one it is at the point of input, so SPPG/admin can tell verified-by-
-- self-report medical allergies apart from plain food preferences.
--
-- Run this once against the mbg_db database:
--   mysql -u root -p mbg_db < migrations/001_add_allergy_type.sql

ALTER TABLE users
    ADD COLUMN allergy_type ENUM('medis', 'preferensi') NULL
    AFTER has_allergy;

-- Backfill existing rows that already have has_allergy = 1:
-- default them to 'medis' since that was the only implicit meaning before
-- this column existed. Admins/students can correct this later if needed.
UPDATE users
    SET allergy_type = 'medis'
    WHERE has_allergy = 1 AND allergy_type IS NULL;
