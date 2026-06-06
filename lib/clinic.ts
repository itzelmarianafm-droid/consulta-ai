// Resolves the clinic ID from environment.
// In production, this could be resolved from auth session or WhatsApp phone number.
export function getClinicId(): string {
  const id = process.env.CLINIC_ID;
  if (!id) throw new Error('CLINIC_ID environment variable is not set');
  return id;
}
