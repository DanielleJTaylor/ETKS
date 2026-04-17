import { useState, useEffect, useRef } from "react";
import { matchTags } from "../lib/tags";

export default function TagInput({ placeholder, onAdd, disabled }) {
  const [val, setVal] = useState("");
  const [suggestions, setSugg] = useState([]);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => { setSugg(val.length >= 2 ? matchTags(val) : []); }, [val]);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const commit = (tag) => {
    const clean = (tag || val).trim().toLowerCase().replace(/\s+/g, " ");
    if (!clean) return;
    onAdd(clean); setVal(""); setSugg([]);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1 }}>
      <input className="input" type="text" placeholder={placeholder || "Type a tag…"}
        value={val} disabled={disabled}
        onChange={e => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setSugg([]); setFocused(false); }
        }}
      />
      {focused && suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions.map(s => (
            <button key={s} className="tag-sugg-item"
              onMouseDown={e => { e.preventDefault(); commit(s); setFocused(false); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
