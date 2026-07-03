/**
 * ExportMenu.jsx — New-Ausprey
 *
 * A reusable dropdown button that offers CSV, Excel, and PDF export.
 * Closes on outside-click and disables when no data is available.
 *
 * Props:
 *   onCSV   () => void  — called when "Export CSV" is clicked
 *   onExcel () => void  — called when "Export Excel" is clicked
 *   onPDF   () => void  — called when "Export PDF" is clicked
 *   disabled boolean    — disables the button (e.g. no data yet)
 *   label   string      — optional button label (default "Export")
 */
import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils";

const FORMATS = [
  { key: "csv", icon: FileText, label: "Export CSV", sub: ".csv" },
  { key: "excel", icon: FileSpreadsheet, label: "Export Excel", sub: ".xlsx" },
  { key: "pdf", icon: File, label: "Export PDF", sub: "via print" },
];

export function ExportMenu({
  onCSV,
  onExcel,
  onPDF,
  disabled = false,
  label = "Export",
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // key of the format being exported
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handlers = { csv: onCSV, excel: onExcel, pdf: onPDF };

  const handleClick = async (key) => {
    setOpen(false);
    setBusy(key);
    try {
      await handlers[key]?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-xl border transition select-none",
          disabled
            ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
            : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/40 cursor-pointer",
        )}
      >
        <Download size={14} className={cn(busy && "animate-bounce")} />
        {busy ? "Exporting…" : label}
        <ChevronDown
          size={13}
          className={cn(
            "text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden py-1">
          {FORMATS.map(({ key, icon: Icon, label: fLabel, sub }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleClick(key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition"
            >
              <Icon size={16} className="text-slate-400 shrink-0" />
              <div>
                <div className="text-slate-700 font-medium">{fLabel}</div>
                <div className="text-[11px] text-slate-400">{sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
