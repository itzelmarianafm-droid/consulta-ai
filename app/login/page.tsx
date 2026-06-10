'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Error al iniciar sesión');
      setLoading(false);
      return;
    }

    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-[30px] h-[30px] bg-accent rounded-full relative shrink-0">
              <div className="absolute w-[9px] h-[9px] bg-paper rounded-full top-[5px] right-[5px]" />
            </div>
            <span className="font-serif text-2xl font-medium tracking-tight">
              Consulta<em className="text-accent font-normal">.ai</em>
            </span>
          </div>
          <p className="text-ink-soft text-sm">Inicia sesión en tu dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper-warm border border-line rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent focus:-outline-offset-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent focus:-outline-offset-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-[12px] font-medium px-3 py-2 rounded-md bg-red-50 text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-ink text-paper font-semibold text-[13px] rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-[11px] text-ink-soft mt-6">
          Consulta.ai · Captación inteligente de pacientes
        </p>
      </div>
    </div>
  );
}
