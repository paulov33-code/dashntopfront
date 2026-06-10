import React from 'react';
import { HardDrive, UserCheck, Activity, ShieldAlert } from 'lucide-react';

export const MetricsGrid = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Equipos */}
      <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase">Total Equipos LAN</p>
          <p className="text-2xl font-bold mt-1 text-slate-100">{metrics.cantidad_total_hosts || 0}</p>
        </div>
        <div className="p-3 bg-slate-900/60 rounded-lg text-blue-400"><HardDrive className="h-6 w-6" /></div>
      </div>

      {/* Activos */}
      <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase">Equipos Activos</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{metrics.hosts_activos || 0}</p>
        </div>
        <div className="p-3 bg-slate-900/60 rounded-lg text-emerald-400"><UserCheck className="h-6 w-6" /></div>
      </div>

      {/* Nuevos */}
      <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase">Nuevos Detectados</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">{metrics.nuevos_hosts_detectados || 0}</p>
        </div>
        <div className="p-3 bg-slate-900/60 rounded-lg text-amber-400"><Activity className="h-6 w-6" /></div>
      </div>

      {/* Desconocidos */}
      <div className="bg-slate-800 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase">Hosts Desconocidos</p>
          <p className="text-2xl font-bold mt-1 text-rose-400">{metrics.hosts_desconocidos || 0}</p>
        </div>
        <div className="p-3 bg-slate-900/60 rounded-lg text-rose-400"><ShieldAlert className="h-6 w-6" /></div>
      </div>
    </div>
  );
};