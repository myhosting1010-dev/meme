import { Search, X } from "lucide-react";

export function SearchInput({ value, onChange }) {
  return (
    <div className="coin-search">
      <Search size={19} aria-hidden="true" />
      <input type="search" maxLength={200} aria-label="Search  by coin name, symbol, or contract address" placeholder="Search coins..." value={value} onChange={(event) => onChange(event.target.value)} />
      {value && <button type="button" aria-label="Clear search" onClick={() => onChange("")}><X size={16} /></button>}
    </div>
  );
}
