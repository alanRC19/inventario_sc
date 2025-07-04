import React from "react";
import "./SearchBar.css";

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Buscar...", className = "" }) => (
  <div className={`searchbar-container ${className}`}>
    <span className="material-icons searchbar-icon">search</span>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="searchbar-input"
    />
  </div>
); 