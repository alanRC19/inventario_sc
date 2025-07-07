import React from "react";
import { StockStatus, getStockStatusColor, getStockStatusText } from "@/shared/utils/stockUtils";

interface StatusBadgeProps {
  estado: StockStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(estado)}`}>
    {getStockStatusText(estado)}
  </span>
); 