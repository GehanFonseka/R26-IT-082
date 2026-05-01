import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`card ${className}`}>{children}</div>;

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => (
  <button className={`btn-${variant} ${className}`} {...props}>
    {children}
  </button>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = props => <input className="input-field" {...props} />;

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ options, ...props }) => (
  <select className="input-field" {...props}>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface TabsProps {
  tabs: Array<{ label: string; content: React.ReactNode }>;
  defaultTab?: number;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  return (
    <div>
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === idx
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeTab].content}</div>
    </div>
  );
};

export const Loader: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

interface TableProps {
  columns: Array<{ key: string; label: string }>;
  data: Array<Record<string, any>>;
  actions?: (row: Record<string, any>) => React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ columns, data, actions }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          {columns.map(col => (
            <th key={col.key} className="px-6 py-3 text-left font-semibold text-gray-700">
              {col.label}
            </th>
          ))}
          {actions && <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
            {columns.map(col => (
              <td key={col.key} className="px-6 py-4 text-gray-700">
                {row[col.key]}
              </td>
            ))}
            {actions && <td className="px-6 py-4">{actions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
