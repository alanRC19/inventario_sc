"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Modal } from './Modal';

interface WhatsAppStatus {
  isReady: boolean;
  hasQR: boolean;
  qrCode: string | null;
  qrCodeImage: string | null; // Imagen base64 del QR
  isInitializing: boolean;
  sessionExpired: boolean;
  qrAge: number | null;
  initializationAttempts: number;
  maxAttempts: number;
  needsReconnection: boolean;
}

interface WhatsAppManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppManager: React.FC<WhatsAppManagerProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    hasQR: false,
    qrCode: null,
    qrCodeImage: null,
    isInitializing: false,
    sessionExpired: false,
    qrAge: null,
    initializationAttempts: 0,
    maxAttempts: 3,
    needsReconnection: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkWhatsAppStatus();
      const interval = setInterval(checkWhatsAppStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/whatsapp/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const initializeWhatsApp = async () => {
    setLoading(true);
    setMessage('Inicializando WhatsApp Web...');
    
    try {
      const response = await fetch('http://localhost:3001/api/whatsapp/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('WhatsApp Web inicializando. Escanea el código QR con tu teléfono.');
        setStatus(data.status);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('Error conectando con el servidor');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateSession = async () => {
    setLoading(true);
    setMessage('Regenerando sesión de WhatsApp...');
    
    try {
      const response = await fetch('http://localhost:3001/api/whatsapp/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('Sesión regenerada. Escanea el nuevo código QR.');
        setStatus(data.status || {
          isReady: false,
          hasQR: false,
          qrCode: null,
          qrCodeImage: null,
          isInitializing: true,
          sessionExpired: false,
          qrAge: null,
          initializationAttempts: 0,
          maxAttempts: 3,
          needsReconnection: false
        });
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('Error regenerando la sesión');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    setLoading(true);
    setMessage('Desconectando WhatsApp...');
    
    try {
      const response = await fetch('http://localhost:3001/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setMessage(data.message);
      
      if (data.success) {
        setStatus({
          isReady: false,
          hasQR: false,
          qrCode: null,
          qrCodeImage: null,
          isInitializing: false,
          sessionExpired: false,
          qrAge: null,
          initializationAttempts: 0,
          maxAttempts: 3,
          needsReconnection: false
        });
      }
    } catch (error) {
      setMessage('Error desconectando WhatsApp');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (status.isReady) return 'text-green-600';
    if (status.sessionExpired) return 'text-red-600';
    if (status.isInitializing || status.hasQR) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (status.isReady) return 'Conectado y listo';
    if (status.sessionExpired) return 'Sesión expirada - Regenerar';
    if (status.isInitializing) return 'Inicializando...';
    if (status.hasQR) return 'Esperando escaneo de QR';
    if (status.needsReconnection) return 'Requiere reconexión';
    return 'Desconectado';
  };

  const getStatusIcon = () => {
    if (status.isReady) return 'check_circle';
    if (status.sessionExpired) return 'error';
    if (status.isInitializing || status.hasQR) return 'pending';
    return 'error';
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Configuración de WhatsApp" maxWidth="600px">
      <div className="space-y-6">
        {/* Estado de conexión */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor()}`}>
            <span className={`material-icons text-sm ${getStatusColor()}`}>
              {getStatusIcon()}
            </span>
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Código QR */}
        {status.hasQR && (status.qrCodeImage || status.qrCode) && (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Escanea el código QR con WhatsApp
            </h3>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
              {status.qrCodeImage ? (
                <div className="w-72 h-72 flex items-center justify-center">
                  <Image 
                    src={status.qrCodeImage} 
                    alt="Código QR de WhatsApp" 
                    width={288}
                    height={288}
                    className="w-full h-full object-contain"
                    unoptimized={true}
                  />
                </div>
              ) : (
                <div className="w-72 h-72 bg-gray-100 rounded flex items-center justify-center border overflow-hidden">
                  <div className="text-xs font-mono break-all whitespace-pre-wrap p-2 text-center leading-3">
                    {status.qrCode?.substring(0, 200)}...
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                1. Abre WhatsApp en tu teléfono<br/>
                2. Ve a Configuración → Dispositivos vinculados<br/>
                3. Toca Vincular un dispositivo<br/>
                4. Escanea este código QR<br/>
              </p>
              {status.qrAge && status.qrAge > 60 && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ Este código QR tiene {Math.floor(status.qrAge / 60)} minutos de edad.
                    Si no funciona, regenera la sesión.
                  </p>
                </div>
              )}
              {!status.qrCodeImage && (
                <p className="text-xs text-gray-500">
                  <strong>Nota:</strong> El código QR completo se muestra en la consola del servidor.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Alerta de sesión expirada */}
        {status.sessionExpired && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons text-red-600">warning</span>
              <h4 className="font-medium text-red-800">Sesión Expirada</h4>
            </div>
            <p className="text-sm text-red-700 mb-3">
              La sesión de WhatsApp ha expirado. Es necesario regenerar la conexión para volver a enviar mensajes.
            </p>
            <button
              onClick={regenerateSession}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <span className="material-icons animate-spin text-sm">refresh</span>
              ) : (
                <span className="material-icons text-sm">restart_alt</span>
              )}
              Regenerar Sesión
            </button>
          </div>
        )}

        {/* Información de intentos */}
        {status.initializationAttempts > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Intento {status.initializationAttempts} de {status.maxAttempts}
            </p>
          </div>
        )}

        {/* Mensaje de estado */}
        {message && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{message}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-center gap-3 flex-wrap">
          {!status.isReady && !status.isInitializing ? (
            <>
              <button
                onClick={initializeWhatsApp}
                disabled={loading || status.initializationAttempts >= status.maxAttempts}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <span className="material-icons animate-spin text-sm">refresh</span>
                ) : (
                  <span className="material-icons text-sm">phone_android</span>
                )}
                {status.sessionExpired ? 'Reconectar' : 'Conectar WhatsApp'}
              </button>
              
              {(status.sessionExpired || status.needsReconnection) && (
                <button
                  onClick={regenerateSession}
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <span className="material-icons animate-spin text-sm">refresh</span>
                  ) : (
                    <span className="material-icons text-sm">restart_alt</span>
                  )}
                  Regenerar Sesión
                </button>
              )}
            </>
          ) : (
            <button
              onClick={disconnectWhatsApp}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <span className="material-icons animate-spin text-sm">refresh</span>
              ) : (
                <span className="material-icons text-sm">phonelink_off</span>
              )}
              Desconectar
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Información adicional */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <span className="material-icons text-sm text-blue-600">info</span>
            Información y Gestión de Sesión
          </h4>
          
          {/* Explicación del flujo de WhatsApp */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h5 className="font-medium text-blue-800 mb-2">📱 Flujo de WhatsApp Web:</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>1. Número del negocio:</strong> Escanea el QR con el WhatsApp de la empresa</p>
              <p><strong>2. Número del cliente:</strong> Se introduce en el modal de venta</p>
              <p><strong>3. Envío:</strong> El ticket se envía DESDE tu negocio HACIA el cliente</p>
            </div>
          </div>
          
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Una vez conectado, podrás enviar tickets por WhatsApp</li>
            <li>• El cliente debe proporcionar su número de teléfono válido</li>
            <li>• Solo funciona con números registrados en WhatsApp</li>
            <li>• La conexión se mantiene mientras el servidor esté activo</li>
            <li>• Si la sesión expira, usa &quot;Regenerar Sesión&quot; para limpiar y reconectar</li>
            <li>• Los códigos QR expiran después de un tiempo, regenera si es necesario</li>
            <li>• El código QR completo se muestra en la consola del servidor</li>
          </ul>
          
          {status.initializationAttempts >= status.maxAttempts && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Máximo de intentos alcanzado. Reinicia el servidor para intentar nuevamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
