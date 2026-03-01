interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  stats?: { label: string; value: string | number; color?: string }[];
}

export function PageHeader({ title, description, actions, stats }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm flex items-center gap-2">
              <span className={`text-lg font-bold ${s.color || "text-gray-900"}`}>{s.value}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
