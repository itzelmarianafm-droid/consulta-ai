import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

// POST — upload transfer proof image to Supabase Storage
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const db = createServerClient();
  const clinicId = getClinicId();

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${clinicId}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await db.storage
    .from('transfer-proofs')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = db.storage
    .from('transfer-proofs')
    .getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
