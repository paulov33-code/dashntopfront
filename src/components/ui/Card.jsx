export const Card = ({ title, value, icon, className = "" }) => {
  return (
    <div className={`p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between ${className}`}>
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      {icon && <div className="text-gray-400">{icon}</div>}
    </div>
  );
};