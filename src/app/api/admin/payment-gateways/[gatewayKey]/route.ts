
// /src/app/api/admin/payment-gateways/[gatewayKey]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import type { PaymentGatewaySetting } from '@/types';

export const dynamic = 'force-dynamic';

// GET a single payment gateway setting
export async function GET(
  request: NextRequest,
  { params }: { params: { gatewayKey: string } }
) {
  const { gatewayKey } = params;
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!gatewayKey) {
    return NextResponse.json({ message: 'Gateway key is required.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('payment_gateway_settings')
      .select('*')
      .eq('gateway_key', gatewayKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ message: 'Payment gateway not found.' }, { status: 404 });
      console.error(`Supabase error fetching gateway ${gatewayKey}:`, error);
      return NextResponse.json({ message: 'Failed to fetch payment gateway.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`Error fetching gateway ${gatewayKey}:`, e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}

// PUT (Update) an existing payment gateway setting
export async function PUT(
  request: NextRequest,
  { params }: { params: { gatewayKey: string } }
) {
  const { gatewayKey } = params;
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!gatewayKey) {
    return NextResponse.json({ message: 'Gateway key is required for update.' }, { status: 400 });
  }

  let body: Partial<Omit<PaymentGatewaySetting, 'gateway_key' | 'createdAt' | 'updatedAt'>>;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const settingToUpdate: { [key: string]: any } = {};

  if (body.hasOwnProperty('display_name')) settingToUpdate.display_name = body.display_name;
  if (body.hasOwnProperty('description')) settingToUpdate.description = body.description || null;
  if (body.hasOwnProperty('icon_name')) settingToUpdate.icon_name = body.icon_name || null;
  if (body.hasOwnProperty('is_enabled')) settingToUpdate.is_enabled = body.is_enabled;
  if (body.hasOwnProperty('is_domestic_only')) settingToUpdate.is_domestic_only = body.is_domestic_only;
  if (body.hasOwnProperty('is_international_only')) settingToUpdate.is_international_only = body.is_international_only;
  
  // For credentials_config, expect the full JSON object or null to clear
  if (body.hasOwnProperty('credentials_config')) {
     settingToUpdate.credentials_config = body.credentials_config === undefined || Object.keys(body.credentials_config || {}).length === 0 ? null : body.credentials_config;
  }

  if (body.hasOwnProperty('environment')) settingToUpdate.environment = body.environment;
  if (body.hasOwnProperty('notes')) settingToUpdate.notes = body.notes || null;
  if (body.hasOwnProperty('display_order')) settingToUpdate.display_order = Number(body.display_order);
  
  // updated_at is handled by trigger

  if (Object.keys(settingToUpdate).length === 0) {
    return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('payment_gateway_settings')
      .update(settingToUpdate)
      .eq('gateway_key', gatewayKey)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ message: 'Gateway setting not found for update.' }, { status: 404 });
      console.error(`Supabase error updating gateway ${gatewayKey}:`, error);
      return NextResponse.json({ message: 'Failed to update gateway setting.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`Error updating gateway ${gatewayKey}:`, e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}

// DELETE a payment gateway setting (Not typically needed as they are predefined, but good to have)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { gatewayKey: string } }
) {
  const { gatewayKey } = params;
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }
  if (!gatewayKey) {
    return NextResponse.json({ message: 'Gateway key is required for deletion.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('payment_gateway_settings')
      .delete()
      .eq('gateway_key', gatewayKey);

    if (error) {
      console.error(`Supabase error deleting gateway ${gatewayKey}:`, error);
      return NextResponse.json({ message: 'Failed to delete gateway setting.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json({ message: 'Payment gateway setting deleted successfully.' });
  } catch (e: any) {
    console.error(`Error deleting gateway ${gatewayKey}:`, e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}
