import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://qmzzfclrkmzmdlttnueg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtenpmY2xya216bWRsdHRudWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDk0NDQsImV4cCI6MjA4MzI4NTQ0NH0.0FcukuJTp1238ILZBGvNVrVkjPml4VwDYXkA1HShSXc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);