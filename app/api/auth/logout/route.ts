import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('sb-token', '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set('admin-clinic-id', '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
