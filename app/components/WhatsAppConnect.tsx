'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type ConnectionStatus = 'loading' | 'disconnected' | 'qr' | 'connected' | 'error';

export default function WhatsAppConnect() {
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/connect');
      const data = await res.json();

      if (data.error) {
        setStatus('error');
        setMessage(data.error);
        return;
      }

      setInstanceName(data.instanceName || '');

      if (data.status === 'connected') {
        setStatus('connected');
        setQrImage(null);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else if (data.status === 'qr' && data.qr) {
        setStatus('qr');
        setQrImage(data.qr);
      } else {
        setStatus('disconnected');
        setQrImage(null);
      }
    } catch {
      setStatus('error');
      setMessage('No se pudo conectar con el servidor de WhatsApp');
    }
  }, []);

  useEffect(() => {
    checkStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkStatus]);

  const createAndConnect = useCallback(async () => {
    setCreating(true);
    setMessage('');

    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const data = await res.json();

      if (data.error) {
        setMessage(`Error: ${data.error}`);
        setCreating(false);
        return;
      }

      await new Promise(r => setTimeout(r, 2000));

      const qrRes = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qr' }),
      });
      const qrData = await qrRes.json();

      if (qrData.status === 'qr' && qrData.qr) {
        setStatus('qr');
        setQrImage(qrData.qr);
        startPolling();
      } else if (qrData.status === 'connected') {
        setStatus('connected');
      } else {
        setMessage('Esperando QR... intenta de nuevo en unos segundos');
        startPolling();
      }
    } catch {
      setMessage('Error al crear la instancia');
    }

    setCreating(false);
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'qr' }),
        });
        const data = await res.json();

        if (data.status === 'connected') {
          setStatus('connected');
          setQrImage(null);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (data.status === 'qr' && data.qr) {
          setQrImage(data.qr);
        }
      } catch { /* ignore */ }
    }, 5000);
  }, []);

  const refreshQr = useCallback(async () => {
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'qr' }),
    });
    const data = await res.json();
    if (data.status === 'qr' && data.qr) {
      setQrImage(data.qr);
    } else if (data.status === 'connected') {
      setStatus('connected');
      setQrImage(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setStatus('disconnected');
    setQrImage(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight">WhatsApp Business</div>
            <div className="text-[11.5px] text-ink-soft mt-0.5">Conecta tu número de WhatsApp para atender leads automáticamente con IA</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-[10px] h-[10px] rounded-full ${
              status === 'connected' ? 'bg-green-500' :
              status === 'qr' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            <span className="text-[11px] font-semibold">
              {status === 'connected' ? 'Conectado' :
               status === 'qr' ? 'Esperando escaneo' :
               status === 'loading' ? 'Verificando...' :
               'Desconectado'}
            </span>
          </div>
        </div>

        <div className="p-5">
          {status === 'loading' && (
            <div className="text-center py-12 text-ink-soft text-sm">Verificando conexión...</div>
          )}

          {status === 'disconnected' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="text-[14px] font-semibold mb-1">Conecta tu WhatsApp</div>
              <div className="text-[12px] text-ink-soft mb-5 max-w-md mx-auto">
                Al conectar, tu agente IA responderá automáticamente los mensajes usando la base de conocimiento que configuraste
              </div>
              <button
                className="px-6 py-3 bg-green-600 text-white text-[13px] font-semibold rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                onClick={createAndConnect}
                disabled={creating}
              >
                {creating ? 'Conectando...' : 'Conectar WhatsApp'}
              </button>
            </div>
          )}

          {status === 'qr' && (
            <div className="text-center py-4">
              <div className="text-[14px] font-semibold mb-2">Escanea el código QR</div>
              <div className="text-[12px] text-ink-soft mb-4">
                Abre WhatsApp en tu teléfono &gt; Dispositivos vinculados &gt; Vincular dispositivo
              </div>

              {qrImage ? (
                <div className="inline-block bg-white p-4 rounded-lg border border-line shadow-sm">
                  <img
                    src={qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`}
                    alt="QR Code"
                    className="w-[260px] h-[260px]"
                  />
                </div>
              ) : (
                <div className="inline-block bg-paper-deep p-4 rounded-lg w-[292px] h-[292px] flex items-center justify-center">
                  <span className="text-ink-soft text-sm">Cargando QR...</span>
                </div>
              )}

              <div className="mt-4">
                <button
                  className="px-4 py-2 border border-line-strong rounded-md text-[11px] font-medium text-ink-soft hover:text-ink transition-colors"
                  onClick={refreshQr}
                >
                  Refrescar QR
                </button>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3 max-w-md mx-auto">
                <div className="text-[11px] text-blue-700">
                  El QR se actualiza cada 30 segundos. Una vez escaneado, la conexión se mantiene activa automáticamente.
                </div>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="text-[16px] font-semibold mb-1 text-green-700">WhatsApp conectado</div>
              <div className="text-[12px] text-ink-soft mb-5">
                Tu agente IA está respondiendo mensajes automáticamente
              </div>
              <button
                className="px-4 py-2 border border-red-300 text-red-600 rounded-md text-[11px] font-medium hover:bg-red-50 transition-colors"
                onClick={disconnect}
              >
                Desconectar
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="text-[14px] font-semibold text-red-600 mb-2">Error de conexión</div>
              <div className="text-[12px] text-ink-soft mb-4">
                {message || 'No se pudo conectar con el servidor de WhatsApp. Verifica la configuración de Evolution API.'}
              </div>
              <button
                className="px-4 py-2 border border-line-strong rounded-md text-[11px] font-medium hover:bg-paper-deep transition-colors"
                onClick={checkStatus}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 border-b border-line">
          <div className="font-serif text-[16px] font-medium">Cómo funciona</div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
            <div className="bg-paper border border-line rounded-md p-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-3 text-green-600 font-semibold text-sm">1</div>
              <div className="text-[13px] font-semibold mb-1">Conectar</div>
              <div className="text-[11px] text-ink-soft">Escanea el QR con tu WhatsApp Business para vincular este dispositivo</div>
            </div>
            <div className="bg-paper border border-line rounded-md p-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600 font-semibold text-sm">2</div>
              <div className="text-[13px] font-semibold mb-1">Recibir mensajes</div>
              <div className="text-[11px] text-ink-soft">Cada mensaje que llegue se registra como lead y aparece en Conversaciones</div>
            </div>
            <div className="bg-paper border border-line rounded-md p-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-3 text-purple-600 font-semibold text-sm">3</div>
              <div className="text-[13px] font-semibold mb-1">Respuesta IA</div>
              <div className="text-[11px] text-ink-soft">El agente IA lee tu base de conocimiento y responde automáticamente al lead</div>
            </div>
          </div>
        </div>
      </div>

      {/* Config info */}
      {instanceName && (
        <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 pt-4 pb-3 border-b border-line">
            <div className="font-serif text-[16px] font-medium">Configuración técnica</div>
          </div>
          <div className="p-5 space-y-3">
            <div className="bg-paper border border-line rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Instancia</div>
              <div className="text-[13px] font-mono mt-1">{instanceName}</div>
            </div>
            <div className="bg-paper border border-line rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Webhook URL</div>
              <div className="text-[13px] font-mono mt-1 break-all">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/evolution</div>
            </div>
          </div>
        </div>
      )}

      {message && !['error'].includes(status) && (
        <div className={`text-[12px] font-medium px-3 py-2 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
