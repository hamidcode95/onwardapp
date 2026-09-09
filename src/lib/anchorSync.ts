import { supabase } from '@/integrations/supabase/client';

export async function syncAnchorCreate(params: {
  id: string;
  userId: string;
  label: string;
  targetTime: string;
}) {
  const { error } = await supabase.from('time_anchors').insert({
    id: params.id,
    user_id: params.userId,
    label: params.label,
    target_time: params.targetTime,
  });
  if (error) console.error('Failed to sync anchor to server', error);
}

export async function syncAnchorDismiss(id: string) {
  const { error } = await supabase.from('time_anchors').update({ dismissed: true }).eq('id', id);
  if (error) console.error('Failed to sync anchor dismissal to server', error);
}

export async function syncAnchorDelete(id: string) {
  const { error } = await supabase.from('time_anchors').delete().eq('id', id);
  if (error) console.error('Failed to sync anchor deletion to server', error);
}
