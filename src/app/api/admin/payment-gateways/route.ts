
// /src/app/api/admin/payment-gateways/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import type { PaymentGatewaySetting } from '@/types';

export const dynamic = 'force-dynamic';

// GET all payment gateway settings for admin
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('payment_gateway_settings')
      .select('*')
      .order('display_order', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching payment gateways:', error);
      return NextResponse.json({ message: 'Failed to fetch payment gateways.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('Error fetching payment gateways:', e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}

// POST a new payment gateway setting (Admin) - For initial setup or adding new ones if not predefined
export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Admin database service not available.' }, { status: 503 });
  }

  let body: Omit<PaymentGatewaySetting, 'createdAt' | 'updatedAt'>;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
  }

  if (!body.gateway_key || !body.display_name) {
    return NextResponse.json({ message: 'Gateway key and Display Name are required.' }, { status: 400 });
  }

  const settingToInsert = {
    gateway_key: body.gateway_key,
    display_name: body.display_name,
    description: body.description || null,
    icon_name: body.icon_name || null,
    is_enabled: body.is_enabled === undefined ? false : body.is_enabled,
    is_domestic_only: body.is_domestic_only === undefined ? true : body.is_domestic_only,
    is_international_only: body.is_international_only === undefined ? false : body.is_international_only,
    credentials_config: body.credentials_config || null,
    environment: body.environment || 'test',
    notes: body.notes || null,
    display_order: body.display_order === undefined ? 0 : Number(body.display_order),
    // createdAt and updatedAt will be handled by database defaults/triggers
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('payment_gateway_settings')
      .insert(settingToInsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating payment gateway setting:', error);
      if (error.code === '23505') { // unique_violation for gateway_key
         return NextResponse.json({ message: `Failed to create setting: gateway_key '${settingToInsert.gateway_key}' already exists.`, rawSupabaseError: error }, { status: 409 });
      }
      return NextResponse.json({ message: 'Failed to create payment gateway setting.', rawSupabaseError: error }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('Error creating payment gateway setting:', e);
    return NextResponse.json({ message: 'Server error.', errorDetails: e.message }, { status: 500 });
  }
}
