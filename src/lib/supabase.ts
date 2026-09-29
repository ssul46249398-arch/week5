import { createClient } from '@supabase/supabase-js';
import type { CafeOrder } from '../types/cafe';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const normalizeOrder = (order: CafeOrder): CafeOrder => ({
  ...order,
  phone_number: order.phone_number || '연락처 없음',
  special_requests: order.special_requests || '',
});

export async function fetchCafeOrders(): Promise<CafeOrder[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('cafe_menu')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((order) => normalizeOrder(order as CafeOrder));
}

export async function insertCafeOrder(order: CafeOrder): Promise<CafeOrder> {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');

  const { id: _id, created_at: _createdAt, ...values } = order;
  const { data, error } = await supabase
    .from('cafe_menu')
    .insert({
      ...values,
      phone_number: values.phone_number === '연락처 없음' ? null : values.phone_number,
      special_requests: values.special_requests || null,
    })
    .select()
    .single();

  if (error) throw error;
  return normalizeOrder(data as CafeOrder);
}

export async function updateCafeOrderStatus(
  orderId: string,
  status: CafeOrder['status'],
): Promise<void> {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');

  const { error } = await supabase
    .from('cafe_menu')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
}

export async function deleteCafeOrder(orderId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');

  const { error } = await supabase
    .from('cafe_menu')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
}