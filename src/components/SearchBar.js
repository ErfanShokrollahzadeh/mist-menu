"use client";

export default function SearchBar({ value, onChange, onClear, placeholder = "Menüde ara..." }) {
  return (
    <div className="search-wrapper">
      <div className="search-bar">
        <svg
          className="search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          id="menuSearch"
        />
        <button
          className={`search-clear${value ? " visible" : ""}`}
          onClick={onClear}
          aria-label="Aramayı temizle"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
