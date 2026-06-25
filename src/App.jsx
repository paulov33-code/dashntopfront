import React, { useState, useEffect, useRef } from 'react';
import { Network, RefreshCw, Search, HardDrive, UserCheck, Activity, ShieldAlert, Laptop, ArrowLeft } from 'lucide-react';
import * as echarts from 'echarts';

// ==========================================
// 1. CAPA DE CONFIGURACIÓN Y DATOS (API)
// ==========================================
const API_BASE_URL = "http://195.0.5.240:8000/api/v1";

const api = {
  fetchHosts: async (ifid = 4) => {
    const res = await fetch(`${API_BASE_URL}/lan-hosts?ifid=${ifid}`);
    if (!res.ok) throw new Error("Error en US-001");
    return res.json();
  },
  fetchDetail: async (ip) => {
    const res = await fetch(`${API_BASE_URL}/hosts/${ip}`);
    if (!res.ok) throw new Error("Error en US-002");
    return res.json();
  },
  fetchApps: async (ip) => {
    const res = await fetch(`${API_BASE_URL}/hosts/${ip}/top-applications`);
    if (!res.ok) throw new Error("Error en US-003");
    return res.json();
  },
  fetchTopConsumers: async (ifid = 4, limit = 10) => {
    const res = await fetch(`${API_BASE_URL}/traffic/top-consumers?ifid=${ifid}&limit=${limit}`);
    if (!res.ok) throw new Error("Error cargando Consumidores Globales");
    return res.json();
  },
  fetchAppsDns: async (ip) => {
    const res = await fetch(`http://localhost:8000/api/dns-stats?ip=${ip}`, {
      headers: { 'accept': 'application/json' }
    });
    if (!res.ok) throw new Error("Error en US-003_DNS");
    return res.json();
  },
  // NUEVO ENDPOINT: Top Receptores Internos
  fetchTopReceivers: async (timeRange = "now-5h") => {
    const res = await fetch(`http://localhost:8000/api/top-receptores?time_range=${timeRange}`, {
      headers: { 'accept': 'application/json' }
    });
    if (!res.ok) throw new Error("Error cargando Top Receptores");
    return res.json();
  }
};

// UTILS
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ==========================================
// 2. COMPONENTE PRINCIPAL UNIFICADO
// ==========================================
export default function App() {
  // Estados Globales (Vista B)
  const [hosts, setHosts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [topConsumers, setTopConsumers] = useState([]);
  const [topReceivers, setTopReceivers] = useState([]); // Nuevo Estado
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Inspección Host (Vista A)
  const [selectedHostIp, setSelectedHostIp] = useState(null);
  const [hostDetail, setHostDetail] = useState(null);
  const [hostApps, setHostApps] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Estados para la auditoría DNS
  const [dnsData, setDnsData] = useState([]);
  const [loadingDns, setLoadingDns] = useState(false);

  // Polling unificado (Cada 30 segundos)
  useEffect(() => {
    const loadNocData = () => {
      Promise.all([
        api.fetchHosts(4),
        api.fetchTopConsumers(4, 10),
        api.fetchTopReceivers("now-5h").catch(() => ({ success: false, data: [] })) // Resguardo si el puerto 8000 no responde
      ])
        .then(([hostsData, consumersData, receiversData]) => {
          setHosts(hostsData.hosts || []);
          setMetrics(hostsData.metrics || {});
          setTopConsumers(consumersData || []);
          setTopReceivers(receiversData.success ? receiversData.data : []);
          setError(null);
        })
        .catch(() => setError("Error de conexión con el Backend de Python (Verifica IP/Puerto)."))
        .finally(() => setLoadingList(false));
    };

    loadNocData();
    const interval = setInterval(loadNocData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Carga de detalle profundo al inspeccionar un dispositivo
  useEffect(() => {
    if (!selectedHostIp) return;
    setLoadingDetail(true);
    
    Promise.all([
      api.fetchDetail(selectedHostIp),
      api.fetchApps(selectedHostIp)
    ])
      .then(([detailData, appsData]) => {
        setHostDetail(detailData);
        setHostApps(appsData);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron solicitar los datagramas L7 de este dispositivo.");
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedHostIp]);

  // Efecto independiente para cargar las estadísticas DNS
  useEffect(() => {
    if (!selectedHostIp) {
      setDnsData([]);
      return;
    }

    const loadDnsData = async () => {
      try {
        setLoadingDns(true);
        const json = await api.fetchAppsDns(selectedHostIp);
        if (json.success && json.data) {
          const sortedData = [...json.data].sort((a, b) => a.conexiones - b.conexiones);
          setDnsData(sortedData);
        } else {
          setDnsData([]);
        }
      } catch (err) {
        console.error("Error cargando auditoría DNS:", err);
        setDnsData([]); 
      } finally {
        setLoadingDns(false);
      }
    };

    loadDnsData();
  }, [selectedHostIp]);

  // Filtrado de la tabla maestra
  const filteredHosts = hosts.filter(host => 
    host.ip?.toLowerCase().includes(search.toLowerCase()) ||
    host.hostname?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
      
      {/* GLOBAL NOC HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Network className="h-8 w-8 text-emerald-400 animate-pulse" />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Corralon a b c</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>Monitoreo e Inventario de Flujos de Red</p>
          </div>
        </div>
        <div style={{ fontSize: '12px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '9999px', color: '#34d399', border: '1px solid #475569' }}>
          <RefreshCw className="h-3 w-3 animate-spin inline mr-1.5" /> 
          {selectedHostIp ? `Analizando L7: ${selectedHostIp}` : 'Sincronizado Core LAN (5s)'}
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ========================================================== */}
      {/* VISTA A: DETALLE INDIVIDUAL DEL HOST (US-002 + US-003)      */}
      {/* ========================================================== */}
      {selectedHostIp ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loadingDetail || !hostDetail || !hostApps ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-400" />
              Abriendo túnel de inspección profunda L7...
            </div>
          ) : (
            <>
              {/* FILA SUPERIOR: Ficha Técnica y Gráfico de Torta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                
                {/* US-002: Ficha Técnica */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Laptop className="h-6 w-6 text-emerald-400" />
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{hostDetail.hostname || 'Unknown Host'}</h2>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>IP: {hostDetail.ip}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedHostIp(null); setHostDetail(null); setHostApps(null); setDnsData([]); }}
                      style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Volver al NOC
                    </button>
                  </div>
                  
                  {/* Datos Base del Dispositivo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '4px' }}>DIRECCIÓN MAC</span>
                      <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{hostDetail.mac || 'N/A'}</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '4px' }}>FABRICANTE VENDOR</span>
                      <span style={{ fontWeight: 'bold' }}>{hostDetail.vendor || 'OEM Generic'}</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '4px' }}>SISTEMA OPERATIVO</span>
                      <span style={{ fontWeight: 'bold' }}>{hostDetail.os !== "None" ? hostDetail.os : "No Detectado"}</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '4px' }}>ESTADO EN RED</span>
                      <span style={{ color: hostDetail.is_online ? '#34d399' : '#64748b', fontWeight: 'bold' }}>
                        {hostDetail.is_online ? '● INTERFAZ ACTIVA' : '○ DESCONECTADO'}
                      </span>
                    </div>
                  </div>

                  {/* Telemetría de Tráfico Global L2/L3 */}
                  <div style={{ borderTop: '1px dashed #334155', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
                      Estadísticas de Flujo L2/L3
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <span style={{ color: '#60a5fa', display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>⬆ TRÁFICO ENVIADO (TX)</span>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Volumen: </span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatBytes(hostDetail.bytes_sent)}</span>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Paquetes: </span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{(hostDetail.packets_sent || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <span style={{ color: '#34d399', display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>⬇ TRÁFICO RECIBIDO (RX)</span>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Volumen: </span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatBytes(hostDetail.bytes_rcvd)}</span>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Paquetes: </span>
                          <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{(hostDetail.packets_rcvd || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* US-003: Gráfico de Tráfico de Aplicaciones Local */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', margin: '0 0 16px 0' }}>
                    Distribución de Aplicaciones L7
                  </h3>
                  {(!hostApps || !hostApps.applications || hostApps.applications.length === 0) ? (
                    <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                      Sin telemetría de flujos de aplicación acumulados.
                    </p>
                  ) : (
                    <EChartsPieWrapper dataList={hostApps.applications} nameKey="name" valueKey="bytes" seriesName="Consumo por Aplicación" />
                  )}
                </div>
              </div>

              {/* TABLA DETALLADA DE PROTOCOLOS DE APLICACIÓN L7 */}
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginTop: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', margin: '0 0 16px 0', letterSpacing: '0.05em' }}>
                  Matriz de Protocolos e Intenciones de Tráfico L7
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '12px 16px' }}>Aplicación / Protocolo</th>
                        <th style={{ padding: '12px 16px' }}>Duración activa</th>
                        <th style={{ padding: '12px 16px' }}>Enviado (TX)</th>
                        <th style={{ padding: '12px 16px' }}>Recibido (RX)</th>
                        <th style={{ padding: '12px 16px', width: '160px' }}>Ratio Flujo (TX / RX)</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Bytes Totales</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>% Impacto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!hostApps || !hostApps.applications || hostApps.applications.length === 0) ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            No hay registros tabulares para este host.
                          </td>
                        </tr>
                      ) : (
                        hostApps.applications.map((app, index) => {
                          const formatDuration = (secs) => {
                            if (!secs) return "00:00:00";
                            const h = String(Math.floor(secs / 3600)).padStart(2, '0');
                            const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
                            const s = String(Math.floor(secs % 60)).padStart(2, '0');
                            return `${h}:${m}:${s}`;
                          };

                          const totalBytes = app.bytes || (app.sent_bytes + app.received_bytes) || 1;
                          const txRatio = Math.min(((app.sent_bytes || 0) / totalBytes) * 100, 100);
                          const rxRatio = 100 - txRatio;

                          return (
                            <tr 
                              key={index} 
                              style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#e2e8f0' }}>{app.name}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#cbd5e1' }}>{formatDuration(app.duration)}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#60a5fa' }}>{formatBytes(app.sent_bytes)}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#34d399' }}>{formatBytes(app.received_bytes)}</td>
                              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#334155' }} title={`Subida: ${txRatio.toFixed(1)}% | Descarga: ${rxRatio.toFixed(1)}%`}>
                                  <div style={{ width: `${txRatio}%`, backgroundColor: '#fb923c' }} />
                                  <div style={{ width: `${rxRatio}%`, backgroundColor: '#4ade80' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>
                                  <span>{txRatio.toFixed(0)}% TX</span>
                                  <span>{rxRatio.toFixed(0)}% RX</span>
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#f8fafc' }}>{formatBytes(app.bytes)}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#a78bfa', fontWeight: 'bold' }}>{app.percentage ? `${parseFloat(app.percentage).toFixed(1)}%` : '0%'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUDITORÍA DE TRÁFICO DNS */}
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginTop: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
                  Top Dominios Solicitados por DNS
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Métricas de conexiones salientes y resolución de nombres asignados al host.</p>
                
                {loadingDns ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontSize: '13px' }}>
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-400" />
                    Consultando auditoría DNS en tiempo real...
                  </div>
                ) : dnsData.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontSize: '13px' }}>
                    No se encontraron solicitudes de resolución DNS activas para este dispositivo.
                  </div>
                ) : (
                  <EChartsDnsBarWrapper dataList={dnsData} targetIp={selectedHostIp} />
                )}
              </div>
            </>
          )}
        </div>
      ) : (
      
        /* ========================================================== */
        /* VISTA B: DASHBOARD GENERAL DEL NOC (US-001)                */
        /* ========================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Métricas Superiores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Equipos Totales</p><p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{metrics.cantidad_total_hosts || 0}</p></div>
              <HardDrive className="h-6 w-6 text-blue-400" />
            </div>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Hosts Activos</p><p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#34d399' }}>{metrics.hosts_activos || 0}</p></div>
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Nuevos Detectados</p><p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#fbbf24' }}>{metrics.nuevos_hosts_detectados || 0}</p></div>
              <Activity className="h-6 w-6 text-amber-400" />
            </div>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Desconocidos</p><p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#f43f5e' }}>{metrics.hosts_desconocidos || 0}</p></div>
              <ShieldAlert className="h-6 w-6 text-rose-400" />
            </div>
          </div>

          {/* GRÁFICO GLOBAL DE TOP CONSUMIDORES */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
              Distribución de Tráfico: Top 10 Consumidores Globales LAN
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>💡 Haz clic en cualquier porción o elemento de la leyenda para inspeccionar el dispositivo de forma directa.</p>
            {topConsumers.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                Calculando matriz de consumo de datagramas...
              </p>
            ) : (
              <EChartsPieWrapper 
                dataList={topConsumers} 
                nameKey="hostname" 
                valueKey="total_bytes" 
                seriesName="Consumo por Dispositivo" 
                onSelectHost={setSelectedHostIp} 
              />
            )}
          </div>

          {/* NUEVO GRÁFICO GLOBAL INTEGRADO: TOP RECEPTORES INTERNOS L7 */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
              Top 10 Receptores Internos por Volumen de Datos (Últimas 5 horas)
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Análisis del volumen crítico de carga recibida e impacto en el segmento de red activo.</p>
            {topReceivers.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                Esperando sumario de datagramas capturados en el segmento de red...
              </p>
            ) : (
              <EChartsTopReceiversBarWrapper dataList={topReceivers} />
            )}
          </div>

          {/* Buscador */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px' }}>
            <input 
              type="text" 
              placeholder="Buscar dispositivo por dirección IP o Nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', color: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* TABLA MAESTRA BLINDADA */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden', position: 'relative', zIndex: 50 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '16px' }}>IP / Hostname</th>
                  <th style={{ padding: '16px' }}>Fabricante Nic</th>
                  <th style={{ padding: '16px' }}>Estado</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Volumen Acumulado</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '14px' }}>
                {loadingList && hosts.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Sincronizando topología con ntopng Core...</td></tr>
                ) : filteredHosts.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No se registran equipos en la interfaz bajo ese criterio.</td></tr>
                ) : (
                  filteredHosts.map((host, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedHostIp(host.ip)}
                      style={{ 
                        cursor: 'pointer', 
                        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{host.hostname || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>{host.ip}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                        {host.vendor || 'Generic Device'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          backgroundColor: host.is_online ? 'rgba(52, 211, 153, 0.1)' : 'rgba(15, 23, 42, 0.6)', 
                          color: host.is_online ? '#34d399' : '#64748b',
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          border: host.is_online ? '1px solid rgba(52, 211, 153, 0.2)' : 'none'
                        }}>
                          {host.is_online ? 'Active' : 'Offline'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#cbd5e1', fontWeight: 'bold' }}>
                        {formatBytes(host.bytes_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}

// ==========================================================
// 3. COMPONENTE NUEVO: GRÁFICO DE RECEPTORES INTERNOS (BARRA HORIZONTAL)
// ==========================================================
function EChartsTopReceiversBarWrapper({ dataList }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);

    // Ordenar de menor a mayor para colocar los mayores arriba
    const sortedData = [...dataList].sort((a, b) => a.megabytes_recibidos - b.megabytes_recibidos);

    const ips = sortedData.map(item => item.ip_destino);
    const megabytes = sortedData.map(item => item.megabytes_recibidos);

    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'sans-serif',
        color: '#94a3b8'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc' },
        formatter: function (params) {
          const tar = params[0];
          const original = sortedData.find(d => d.ip_destino === tar.name);
          return `<b>IP Recipiente: ${tar.name}</b><br/>
                  Volumen: <b>${tar.value.toLocaleString()} MB</b><br/>
                  Conexiones: <b>${original ? original.conexiones_totales.toLocaleString() : 0}</b>`;
        }
      },
      grid: {
        left: '2%',
        right: '8%',
        bottom: '8%',
        top: '4%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Megabytes (MB)',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: { 
          color: '#94a3b8', 
          fontSize: 11,
          formatter: '{value} MB'
        }
      },
      yAxis: {
        type: 'category',
        data: ips,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#cbd5e1', fontSize: 11 }
      },
      series: [
        {
          name: 'Datos Recibidos',
          type: 'bar',
          data: megabytes,
          barWidth: '55%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#a855f7' }, // Púrpura Slate
              { offset: 1, color: '#ec4899' }  // Rosado de alto impacto
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#f8fafc',
            fontSize: 10,
            formatter: (params) => `${params.value.toLocaleString()} MB`
          }
        }
      ]
    };

    myChart.setOption(option);

    const handleResize = () => {
      if (myChart) myChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [dataList]);

  return <div ref={chartRef} style={{ width: '100%', height: '340px', position: 'relative', zIndex: 10 }} />;
}

// ==========================================================
// 4. COMPONENTE REUTILIZABLE: GRÁFICO DE BARRAS DNS (NATIVO)
// ==========================================================
function EChartsDnsBarWrapper({ dataList, targetIp }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);
    const dominios = (dataList || []).map(item => item.dominio);
    const conexiones = (dataList || []).map(item => item.conexiones);

    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'sans-serif',
        color: '#94a3b8'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc' },
        formatter: function (params) {
          const tar = params[0];
          return `<b>${tar.name}</b><br/>Conexiones: <b>${tar.value.toLocaleString()}</b>`;
        }
      },
      grid: {
        left: '2%',
        right: '8%',
        bottom: '8%',
        top: '6%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Peticiones',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: dominios,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: {
          color: '#cbd5e1',
          fontSize: 11,
          formatter: (value) => value.length > 32 ? `${value.slice(0, 29)}...` : value
        }
      },
      series: [
        {
          name: 'Conexiones',
          type: 'bar',
          data: conexiones,
          barWidth: '55%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#60a5fa' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            color: '#f8fafc',
            fontSize: 10,
            formatter: (params) => params.value.toLocaleString()
          }
        }
      ]
    };

    myChart.setOption(option);

    const handleResize = () => {
      if (myChart) myChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [dataList]);

  return <div ref={chartRef} style={{ width: '100%', height: '320px', position: 'relative', zIndex: 10 }} />;
}

// ==========================================
// 5. REUTILIZABLE DE APACHE ECHARTS (DONA)
// ==========================================
function EChartsPieWrapper({ dataList, nameKey = 'name', valueKey = 'bytes', seriesName = 'Consumo', onSelectHost }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);

    const chartData = (dataList || []).map(item => {
      const bytesInGB = parseFloat((item[valueKey] / (1024 * 1024 * 1024)).toFixed(2));
      return {
        name: item[nameKey] || 'Desconocido',
        value: bytesInGB,
        hostIp: item.ip || null 
      };
    });

    const option = {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'sans-serif',
        color: '#94a3b8'
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#f8fafc' },
        formatter: '{a} <br/>{b}: <strong>{c} GB</strong> ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#cbd5e1', fontSize: 11 },
        itemGap: 14,
        type: 'scroll'
      },
      series: [
        {
          name: seriesName,
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '42%'], 
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#1e293b', 
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 15,
              fontWeight: 'bold',
              color: '#f8fafc',
              formatter: '{b}\n{c} GB'
            }
          },
          labelLine: {
            show: false
          },
          data: chartData
        }
      ]
    };

    myChart.setOption(option);

    if (onSelectHost) {
      myChart.on('click', function (params) {
        if (params.data && params.data.hostIp) {
          onSelectHost(params.data.hostIp);
        }
      });
    }

    const handleResize = () => {
      if (myChart) myChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (onSelectHost) myChart.off('click');
      myChart.dispose();
    };
  }, [dataList, nameKey, valueKey, seriesName, onSelectHost]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '280px', 
        position: 'relative', 
        zIndex: 10,
        cursor: onSelectHost ? 'pointer' : 'default'
      }} 
    />
  );
}