import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, Search } from 'lucide-react';
import { fetchHostsData } from '../../api/hostsApi';
import { MetricsGrid } from './components/MetricsGrid';

export const DashboardHostsPage = () => {
  const [hosts, setHosts] = useState([]);
  const [metrics, setMetrics] = useState({
    cantidad_total_hosts: 0,
    hosts_activos: 0,
    hosts_inactivos: 0,
    nuevos_hosts_detectados: 0,
    hosts_desconocidos: 0
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = () => {
      fetchHostsData(4)
        .then(data => {
          setHosts(data.hosts || []);
          setMetrics(data.metrics || {});
          setError(null);
        })
        .catch(err => {
          setError("No se puede conectar con el backend de Python. ¿Está encendido?");
        })
        .finally(() => setLoading(false));
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Polling cada 5s
    return () => clearInterval(interval);
  }, []);

  // Filtrado local en tiempo real
  const filteredHosts = hosts.filter(host => 
    host.ip?.toLowerCase().includes(search.toLowerCase()) ||
    host.mac?.toLowerCase().includes(search.toLowerCase()) ||
    host.hostname?.toLowerCase().includes(search.toLowerCase()) ||
    host.vendor?.toLowerCase().includes(search.toLowerCase())
  );

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 antialiased">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Network className="h-8 w-8 text-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ntopng Custom NOC</h1>
            <p className="text-sm text-slate-400">Inventario de topología y análisis (US-001)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full text-emerald-400 font-mono border border-slate-700/40">
          <RefreshCw className="h-3 w-3 animate-spin" /> Monitoreo activo (5s)
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-8">
        {/* TARJETAS HORIZONTALES */}
        <MetricsGrid metrics={metrics} />

        {/* CONTENEDOR DE LA TABLA */}
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="Buscar por IP, MAC, Nombre o Fabricante..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition shadow-inner"
                />
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                Dispositivos en vista: <span className="text-slate-200 font-bold">{filteredHosts.length}</span>
              </div>
            </div>
          </div>

          {/* TABLA DE INVENTARIO FINAL */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    <th className="py-4 px-5">IP / Hostname</th>
                    <th className="py-4 px-5">Fabricante / OS</th>
                    <th className="py-4 px-5">Estado</th>
                    <th className="py-4 px-5 text-right">Tráfico Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm">
                  {loading && hosts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-500">Solicitando topología de red...</td>
                    </tr>
                  ) : filteredHosts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-500">No se encontraron dispositivos en esta interfaz.</td>
                    </tr>
                  ) : (
                    filteredHosts.map((host, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-200">{host.hostname || 'Unknown'}</div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">{host.ip} • <span className="text-[11px] text-slate-600">{host.mac}</span></div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="text-slate-200 text-xs">{host.vendor || 'Generic'}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{host.os && host.os !== "None" ? host.os : "No Detectado"}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${host.is_online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${host.is_online ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                            {host.is_online ? 'Active' : 'Offline'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-xs font-semibold text-slate-300">
                          {formatBytes(host.bytes_total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};