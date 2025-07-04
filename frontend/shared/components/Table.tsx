import React from "react";
import "./Table.css";

export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn[];
  data: T[];
  renderRow: (row: T) => React.ReactNode;
  className?: string;
}

export function Table<T>({ columns, data, renderRow, className = "" }: TableProps<T>) {
  return (
    <div className={`table-container ${className}`}>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.className || ""}
                  style={{ textAlign: col.align || "left" }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
} 