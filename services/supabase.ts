import { createClient } from '@supabase/supabase-js';
import { Notification } from '../types';

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

// --- NOTIFICATION SERVICES ---

export const fetchNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data as Notification[];
};

export const markNotificationAsRead = async (id: string) => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
};

export const markAllNotificationsAsRead = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
};

export const createTestNotification = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const titles = ["Nhắc nhở tương tác", "Sắp đến sinh nhật", "Kỷ niệm mới", "Hệ thống"];
  const messages = [
    "Đã lâu bạn chưa trò chuyện với mẹ.", 
    "Hôm nay là sinh nhật của Tuấn!", 
    "Bạn vừa thêm một kỷ niệm mới.", 
    "Chào mừng bạn quay trở lại ứng dụng."
  ];
  const types = ['REMINDER', 'BIRTHDAY', 'INTERACTION', 'SYSTEM'];
  
  const rand = Math.floor(Math.random() * 4);

  await supabase.from('notifications').insert({
    user_id: user.id,
    title: titles[rand],
    message: messages[rand],
    type: types[rand],
    is_read: false
  });
};

// Logic: Check for Birthdays and Events today, generate notifications if not exists
export const checkAndGenerateNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date();
  const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`; // DD/MM
  const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Check Birthdays (Connections)
  // Note: Stored as DD/MM or YYYY-MM-DD or similar. Simple text match for demo.
  const { data: connections } = await supabase
    .from('connections')
    .select('id, name, birthday')
    .eq('user_id', user.id);

  if (connections) {
    for (const conn of connections) {
      if (conn.birthday && conn.birthday.includes(todayStr)) {
        // Check if notification already exists for today
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_entity_id', conn.id)
          .eq('type', 'BIRTHDAY')
          .gte('created_at', todayISO) // Created today
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'BIRTHDAY',
            title: `Sinh nhật ${conn.name} 🎂`,
            message: `Hôm nay là sinh nhật của ${conn.name}. Hãy gửi lời chúc nhé!`,
            related_entity_id: conn.id,
            related_entity_type: 'CONNECTION'
          });
        }
      }
    }
  }

  // 2. Check Events (Events table)
  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_date')
    .eq('user_id', user.id)
    .eq('event_date', todayISO);

  if (events) {
    for (const event of events) {
      const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('related_entity_id', event.id)
          .eq('type', 'REMINDER')
          .gte('created_at', todayISO)
          .limit(1);

       if (!existing || existing.length === 0) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'REMINDER',
            title: `Sự kiện hôm nay: ${event.title}`,
            message: `Bạn có sự kiện "${event.title}" diễn ra hôm nay.`,
            related_entity_id: event.id,
            related_entity_type: 'EVENT'
          });
       }
    }
  }
};