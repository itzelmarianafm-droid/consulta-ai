import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// GET — get available slots (for landing page booking widget too)
export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data: slots, error } = await db
    .from('calendar_slots')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('active', true)
    .order('day_of_week')
    .order('start_time');

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  // Get calendar mode
  const { data: clinic } = await db
    .from('clinics')
    .select('calendar_mode, calendar_external_url')
    .eq('id', clinicId)
    .single();

  // Get booked appointments for next 14 days to exclude
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { data: booked } = await db
    .from('appointments')
    .select('scheduled_at')
    .eq('clinic_id', clinicId)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', twoWeeks.toISOString())
    .in('status', ['pending', 'confirmed']);

  const bookedTimes = (booked || []).map(a => a.scheduled_at);

  // Generate available dates for next 14 days
  const available: { date: string; day: string; time: string; datetime: string }[] = [];

  for (let d = 0; d < 14; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d + 1);
    const dow = date.getDay();

    const daySlots = (slots || []).filter(s => s.day_of_week === dow);

    for (const slot of daySlots) {
      const [startH, startM] = slot.start_time.split(':').map(Number);
      const [endH, endM] = slot.end_time.split(':').map(Number);

      // Generate 45-min appointment blocks
      let h = startH, m = startM;
      while (h * 60 + m + 45 <= endH * 60 + endM) {
        const dt = new Date(date);
        dt.setHours(h, m, 0, 0);
        const iso = dt.toISOString();

        const isBooked = bookedTimes.some(bt => {
          const diff = Math.abs(new Date(bt).getTime() - dt.getTime());
          return diff < 45 * 60 * 1000;
        });

        if (!isBooked) {
          available.push({
            date: dt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
            day: DAYS[dow],
            time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            datetime: iso,
          });
        }

        m += 45;
        if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
      }
    }
  }

  return NextResponse.json({
    mode: clinic?.calendar_mode || 'built_in',
    external_url: clinic?.calendar_external_url || null,
    slots: slots || [],
    available,
  }, { headers: CORS_HEADERS });
}

// POST — add a new time slot (dashboard)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { day_of_week, start_time, end_time } = body;

  if (day_of_week === undefined || !start_time || !end_time) {
    return NextResponse.json({ error: 'day_of_week, start_time, end_time required' }, { status: 400 });
  }

  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('calendar_slots')
    .insert({ clinic_id: clinicId, day_of_week, start_time, end_time })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE — remove a slot
export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServerClient();
  const { error } = await db.from('calendar_slots').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
