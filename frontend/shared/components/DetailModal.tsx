"use client"

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { StatusBadge } from './StatusBadge';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      className={value === index ? 'block' : 'hidden'}
    >
      {value === index && <div className="py-4">{children}</div>}
    </div>
  );
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const DetailModal: React.FC<DetailModalProps> = ({ open, onClose, title, children }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="backdrop-blur-sm"
    >
      <DialogTitle className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="bg-white">
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componentes auxiliares para el contenido del modal
export const DetailSection: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <div className="mb-6 last:mb-0">
    <h3 className="text-lg font-semibold mb-3 text-gray-700">{title}</h3>
    <div className="bg-gray-50 p-4 rounded-lg">{children}</div>
  </div>
);

export const DetailField: React.FC<{label: string; value: React.ReactNode}> = ({label, value}) => (
  <div className="mb-3 last:mb-0">
    <span className="text-sm text-gray-500 block mb-1">{label}</span>
    <span className="text-gray-800">{value || '—'}</span>
  </div>
);

export const DetailGrid: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {children}
  </div>
);

export const DetailTable: React.FC<{
  headers: string[];
  rows: React.ReactNode[][];
}> = ({headers, rows}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((header, i) => (
            <th
              key={i}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const DetailStatus: React.FC<{
  status: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}> = ({status, type = 'info'}) => (
  <StatusBadge status={status} type={type} />
);
