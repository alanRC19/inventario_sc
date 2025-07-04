import React from "react";
import "./HamburgerIcon.css";

interface HamburgerIconProps {
  open: boolean;
  onClick: () => void;
}

export const HamburgerIcon: React.FC<HamburgerIconProps> = ({ open, onClick }) => (
  <button
    aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
    onClick={onClick}
    className={`hamburger-btn${open ? ' open' : ''}`}
  >
    <div className="relative w-8 h-8 flex items-center justify-center">
      <span className="hamburger-bar top"></span>
      <span className="hamburger-bar middle"></span>
      <span className="hamburger-bar bottom"></span>
    </div>
  </button>
); 