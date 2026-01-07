import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://idylljhdxgcrtatirzav.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeWxsamhkeGdjcnRhdGlyemF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTAzMTksImV4cCI6MjA4MzI4NjMxOX0.UISZWzFgUgYK-1UjyfECSwFS4pjAlONav3hjLspyVxk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const checkSupabaseConfig = async () => {
  console.log("--- SUPABASE CONFIG CHECK ---");
  console.log("URL:", SUPABASE_URL);
  console.log("Key Length:", SUPABASE_ANON_KEY.length);
  
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error("Connection Test Failed:", error.message);
      return { success: false, message: error.message };
    }
    console.log("Connection Test Passed. Profiles accessible.");
    return { success: true, message: "Connected" };
  } catch (e: any) {
    console.error("Connection Test Exception:", e);
    return { success: false, message: e.message };
  }
};

// Helper for detailed logging
export const logDbOperation = (context: string, action: string, payload?: any, error?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  const logStyle = error ? 'color: red; font-weight: bold;' : 'color: #0ea5e9; font-weight: bold;';
  
  console.group(`%c[${timestamp}] [${context}] ${action}`, logStyle);
  if (payload) console.log('Payload/Query:', payload);
  if (error) console.error('Error Details:', error);
  console.groupEnd();

  return `[${timestamp}] ${action} ${error ? `❌ ${error.message}` : '✅ Success'}`;
};