-- ============================================================================
-- FIX PRONUNCIATION ENUM MISMATCH - Fix ReviewStatus AUTO_REVIEWED issue
-- ============================================================================
-- Problem: Database has AUTO_REVIEWED values but enum only has PENDING/REVIEWED
-- Solution: Update all invalid review_status values to PENDING

-- Check current invalid values
SELECT COUNT(*) as invalid_count,
       GROUP_CONCAT(DISTINCT review_status) as invalid_statuses
FROM pronunciation_submissions 
WHERE review_status NOT IN ('PENDING', 'REVIEWED');

-- Fix: Convert all invalid statuses to PENDING
UPDATE pronunciation_submissions 
SET review_status = 'PENDING' 
WHERE review_status NOT IN ('PENDING', 'REVIEWED');

-- Verify fix
SELECT COUNT(*) as total_submissions,
       SUM(CASE WHEN review_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
       SUM(CASE WHEN review_status = 'REVIEWED' THEN 1 ELSE 0 END) as reviewed_count,
       SUM(CASE WHEN review_status NOT IN ('PENDING', 'REVIEWED') THEN 1 ELSE 0 END) as invalid_count
FROM pronunciation_submissions;

