import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, Search, HardDrive, UserCheck, Activity, ShieldAlert, Laptop, ArrowLeft } from 'lucide-react';
import { fetchHostsData, fetchHostDetail, fetchHostApplications } from '../../api/hostsApi';

export const DashboardHostsPage = () => {
  // Estados US-001
  const [hosts, setHosts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);

  // Estados US-002 y US-003
  const [selectedHostIp, setSelectedHostIp] = useState(null);
  const [hostDetail, setHostDetail] = useState(null);
  const [hostApps, setHostApps] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Polling de inventario cada 5s (US-001)
  useEffect(() => {
    const loadNocData = () => {
      fetchHostsData(4)
        .then(data => {
          setHosts(data.hosts || []);
          setMetrics(data.metrics || {});
          setError(null);
        })
        .catch(() => setError("Error de sincronización con el NOC."))
        .finally(() => setLoadingList(false));
    };

    loadNocData();
    const interval = setInterval(loadNocData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Carga de Detalle en Paralelo (US-002 y US-003)
  useEffect(() => {
    if (!selectedHostIp) return;
    setLoadingDetail(true);
    
    Promise.all([
      fetchHostDetail(selectedHostIp),
      fetchHostApplications(selectedHostIp)
    ])
      .then(([detailData, appsData]) => {
        setHostDetail(detailData);
        setHostApps(appsData);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron obtener los detalles L7 de este Host.");
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedHostIp]);

  const filteredHosts = hosts.filter(host => 
    host.ip?.toLowerCase().includes(search.toLowerCase()) ||
    host.hostname?.toLowerCase().includes(search.toLowerCase())
  );

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 text-slate-100 antialiased">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Network className="h-8 w-8 text-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-bold">ntopng Custom NOC</h1>
            <p className="text-sm text-slate-400">Consola Unificada de Diagnóstico</p>
          </div>
        </div>
        <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-full text-emerald-400 font-mono border border-slate-700/40">
          <RefreshCw className="h-3 w-3 animate-spin inline mr-1" /> 
          {selectedHostIp ? `Analizando: ${selectedHostIp}` : 'Monitoreo LAN activo'}
        </div>
      </header>

      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6 text-sm">⚠️ {error}</div>}

      {/* REGION: VISTA DETALLE INDIVIDUAL (US-002 + US-003) */}
      {selectedHostIp ? (
        <div className="space-y-6">
          {loadingDetail || !hostDetail || !hostApps ? (
            <div className="text-center py-12 text-slate-400 font-mono bg-slate-800 border border-slate-700 rounded-xl">
              Cargando datagramas L7 de {selectedHostIp}...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* US-002: Panel Técnico */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <Laptop className="h-6 w-6 text-emerald-400" />
                    <div>
                      <h2 className="text-xl font-bold font-mono">{hostDetail.hostname || 'Unknown'}</h2>
                      <p className="text-xs text-slate-400 font-mono">IP: {hostDetail.ip}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedHostIp(null); setHostDetail(null); setHostApps(null); }}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-300"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
                    <span className="text-slate-400 block text-xs">MAC</span>
                    <span className="text-slate-200 font-bold">{hostDetail.mac || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
                    <span className="text-slate-400 block text-xs">FABRICANTE</span>
                    <span className="text-slate-200 font-bold">{hostDetail.vendor || 'Generic'}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
                    <span className="text-slate-400 block text-xs">OS</span>
                    <span className="text-slate-200 font-bold">{hostDetail.os !== "None" ? hostDetail.os : "No Detectado"}</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
                    <span className="text-slate-400 block text-xs">ESTADO</span>
                    <span className="text-emerald-400 font-bold">{hostDetail.is_online ? 'ACTIVE' : 'OFFLINE'}</span>
                  </div>
                </div>
              </div>

              {/* US-003: Grafico de Dona en SVG nativo */}
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Top Aplicaciones (US-003)</h3>
                <div className="space-y-3">
                  {(hostApps.applications || []).map((app, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-slate-900/40 p-3 rounded border border-slate-700/50">
                      <span className="font-semibold text-slate-200">{app.application}</span>
                      <div className="text-right font-mono text-xs">
                        <span className="text-emerald-400 font-bold mr-3">{app.percentage}%</span>
                        <span className="text-slate-400">{formatBytes(app.bytes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        /* VISTA PRINCIPAL (US-001) */
        <div className="space-y-8">
          
          {/* Métricas en Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div><p className="text-xs text-slate-400 uppercase">Total Hosts</p><p className="text-2xl font-bold mt-1">{metrics.cantidad_total_hosts || 0}</p></div>
              <HardDrive className="h-6 w-6 text-blue-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div><p className="text-xs text-slate-400 uppercase">Activos</p><p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.hosts_activos || 0}</p></div>
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div><p className="text-xs text-slate-400 uppercase">Nuevos</p><p className="text-2xl font-bold text-amber-400 mt-1">{metrics.nuevos_hosts_detectados || 0}</p></div>
              <Activity className="h-6 w-6 text-amber-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div><p className="text-xs text-slate-400 uppercase">Desconocidos</p><p className="text-2xl font-bold text-rose-400 mt-1">{metrics.hosts_desconocidos || 0}</p></div>
              <ShieldAlert className="h-6 w-6 text-rose-400" />
            </div>
          </div>

          {/* Input de Búsqueda */}
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg relative z-10">
            <input 
              type="text" 
              placeholder="Buscar por IP o Hostname..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          {/* TABLA INVENTARIO */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
                  <th className="py-4 px-5">IP / Hostname</th>
                  <th className="py-4 px-5">Fabricante / OS</th>
                  <th className="py-4 px-5">Estado</th>
                  <th className="py-4 px-5 text-right">Tráfico Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {loadingList && hosts.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8 text-slate-500">Cargando topología...</td></tr>
                ) : filteredHosts.map((host, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => {
                      console.log("-> CLICK MANUAL CAPTURADO NATIVO EN IP:", host.ip);
                      setSelectedHostIp(host.ip);
                    }}
                    // ESTILOS INLINE NATIVOS: Saltamos a Tailwind e interceptamos cualquier overlay invisible
                    style={{ 
                      cursor: 'pointer', 
                      position: 'relative', 
                      zIndex: 999 
                    }}
                    className="hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-200">{host.hostname || 'Unknown'}</div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">{host.ip}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-slate-300 text-xs">{host.vendor || 'Generic'}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-xs ${host.is_online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                        {host.is_online ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-xs text-slate-300">
                      {formatBytes(host.bytes_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};