import React from 'react';

export const InventoryTable = ({ filteredHosts, loadingList, hosts, formatBytes, onSelectHost }) => (
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
          {loadingList && hosts.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-8 text-slate-500">Cargando topología de red...</td>
            </tr>
          ) : filteredHosts.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-8 text-slate-500">No se encontraron dispositivos.</td>
            </tr>
          ) : (
            filteredHosts.map((host, idx) => (
              <tr 
                key={idx} 
                onClick={() => onSelectHost(host.ip)}
                className="hover:bg-slate-700/40 cursor-pointer transition-colors group"
              >
                <td className="py-3.5 px-5">
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">{host.hostname}</div>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">{host.ip} • <span className="text-[11px] text-slate-600">{host.mac}</span></div>
                </td>
                <td className="py-3.5 px-5">
                  <div className="text-slate-200 text-xs">{host.vendor}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{host.os !== "None" ? host.os : "No Detectado"}</div>
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
);