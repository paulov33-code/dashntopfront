import React from 'react';
import { ArrowLeft, Laptop, ShieldCheck, ShieldAlert } from 'lucide-react';

export const HostDetailPanel = ({ host, onBack }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-lg text-emerald-400"><Laptop className="h-6 w-6" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-mono">{host.hostname || 'Unknown Device'}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">IP de Telemetría: {host.ip}</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg transition border border-slate-700 text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al NOC
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm font-mono">
        <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
          <span className="text-slate-400 block text-xs uppercase mb-1">Dirección MAC</span>
          <span className="text-slate-200 font-bold">{host.mac || 'N/A'}</span>
        </div>
        <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
          <span className="text-slate-400 block text-xs uppercase mb-1">Fabricante NIC</span>
          <span className="text-slate-200 font-bold">{host.vendor || 'Generic OEM'}</span>
        </div>
        <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
          <span className="text-slate-400 block text-xs uppercase mb-1">Sistema Operativo</span>
          <span className="text-slate-200 font-bold">{host.os && host.os !== "None" ? host.os : "No Detectado"}</span>
        </div>
        <div className="bg-slate-900/40 p-3 rounded border border-slate-700/50">
          <span className="text-slate-400 block text-xs uppercase mb-1">Estado Operativo</span>
          <span className={`inline-flex items-center mt-1 text-xs font-bold ${host.is_online ? 'text-emerald-400' : 'text-slate-500'}`}>
            {host.is_online ? <ShieldCheck className="w-4 h-4 mr-1" /> : <ShieldAlert className="w-4 h-4 mr-1" />}
            {host.is_online ? 'CONECTADO / LIVE' : 'DESCONECTADO'}
          </span>
        </div>
      </div>
    </div>
  );
};