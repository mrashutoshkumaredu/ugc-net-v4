import { supabase } from '@/lib/supabase';

export type ContactMessage = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
};

export async function sendContactMessage(m: { name: string; email: string; topic: string; message: string }): Promise<void> {
  const { error } = await supabase.rpc('submit_contact_message', {
    p_name: m.name.trim(), p_email: m.email.trim(), p_topic: m.topic, p_message: m.message.trim(),
  });
  if (!error) return;
  if (error.message.includes('too_many')) throw new Error('You have sent several messages recently. Please try again later, or email us directly.');
  if (error.message.includes('bad_input')) throw new Error('Please check your name, a valid email, and a message of at least 10 characters.');
  throw new Error('Could not send your message. Please email us directly instead.');
}

export async function adminListMessages(status: string | null): Promise<ContactMessage[]> {
  const { data, error } = await supabase.rpc('admin_list_messages', { p_status: status });
  if (error) throw new Error('Could not load messages.');
  return (data as ContactMessage[]) ?? [];
}

export async function adminSetMessageStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_message_status', { p_id: id, p_status: status });
  if (error) throw new Error('Could not update the message.');
}
