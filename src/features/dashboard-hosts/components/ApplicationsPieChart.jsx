import React from 'react';

export const ApplicationsPieChart = ({ appData, formatBytes }) => {
  const { applications = [], total_bytes = 0 } = appData;

  if (applications.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-6">Sin datos de tráfico de aplicaciones.</p>;
  }

  // Paleta de colores fija para los segmentos del gráfico
  const colors = [
    'stroke-emerald-400 text-emerald-400 bg-emerald-400',
    'stroke-sky-400 text-sky-400 bg-sky-400',
    'stroke-purple-400 text-purple-400 bg-purple-400',
    'stroke-amber-400 text-amber-400 bg-amber-400',
    'stroke-rose-400 text-rose-400 bg-rose-400',
  ];

  // Configuración para el cálculo del SVG circular (Radio = 50, Circunferencia = 314.16)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-xl space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Distribución L7 (US-003)</h3>
        <p className="text-xs text-slate-400 mt-1">Volumen total analizado: <span className="font-mono text-slate-200 font-bold">{formatBytes(total_bytes)}</span></p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* GRÁFICO CIRCULAR NATIVO SVG */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Fondo de la dona */}
            <circle cx="60" cy="60" r={radius} className="stroke-slate-700" strokeWidth="14" fill="transparent" />
            
            {/* Mapeo de segmentos dinámicos */}
            {applications.map((app, index) => {
              const colorClass = colors[index % colors.length].split(' ')[0];
              const strokeDasharray = `${(app.percentage * circumference) / 100} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercentage * circumference) / 100);
              accumulatedPercentage += app.percentage;

              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r={radius}
                  className={`transition-all duration-500 ease-out ${colorClass}`}
                  strokeWidth="14"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 uppercase">Top 1</span>
            <span className="text-sm font-bold text-slate-100">{applications[0]?.application || 'N/A'}</span>
          </div>
        </div>

        {/* LEYENDA DETALLADA */}
        <div className="flex-1 space-y-3 w-full">
          {applications.map((app, index) => {
            const [_, textColor, bgColor] = colors[index % colors.length].split(' ');
            return (
              <div key={index} className="flex items-center justify-between text-sm bg-slate-900/30 p-2 rounded border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${bgColor}`} />
                  <span className="font-semibold text-slate-200">{app.application}</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-100 font-bold mr-2">{app.percentage}%</span>
                  <span className="text-slate-400">{formatBytes(app.bytes)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};