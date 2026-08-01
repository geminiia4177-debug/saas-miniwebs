'use client';

import { useEffect, useState } from 'react';

export default function WhatsAppStatusPage() {
  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        const data = await res.json();
        setStatusData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Estado de WhatsApp</h1>
        
        {!statusData && <p className="text-gray-500">Cargando estado...</p>}

        {statusData?.status === 'STARTING' && (
          <p className="text-blue-500 animate-pulse">Iniciando cliente de WhatsApp...</p>
        )}

        {statusData?.status === 'QR_READY' && statusData?.qrCode && (
          <div className="flex flex-col items-center">
            <p className="text-amber-600 mb-4 font-medium">Escanea este código QR con tu WhatsApp</p>
            <img src={statusData.qrCode} alt="WhatsApp QR Code" className="w-64 h-64 border-4 border-gray-100 rounded-xl" />
          </div>
        )}

        {statusData?.status === 'AUTHENTICATED' && (
          <div className="flex flex-col items-center text-green-600">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold text-lg">¡WhatsApp Conectado y Listo!</p>
          </div>
        )}

        {statusData?.status === 'ERROR' && (
          <p className="text-red-500 font-medium">Error al conectar con WhatsApp. Revisa la consola del servidor.</p>
        )}
      </div>
    </div>
  );
}
