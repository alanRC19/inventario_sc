import React from "react";
import "./StatusBadge.css";

interface StatusBadgeProps {
  estado: "disponible" | "stock bajo" | "fuera de stock";
}

const statusClass: Record<string, string> = {
  "disponible": "disponible",
  "stock bajo": "stock-bajo",
  "fuera de stock": "fuera-de-stock",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado }) => (
  <span className={`status-badge ${statusClass[estado] || ""}`}>{estado}</span>
); 