/**
 * exportUtils.js — New-Ausprey
 *
 * Zero-dependency export helpers that work in any modern browser.
 *
 *  exportCSV(rows, filename)
 *    Converts an array of flat objects to RFC-4180 CSV and triggers download.
 *
 *  exportExcel(rows, filename, sheetName?)
 *    Produces a real .xlsx file (Office Open XML) via raw XML — no library
 *    needed. Excel, Google Sheets, and LibreOffice all open it natively.
 *
 *  exportPDF(rows, columns, meta, filename)
 *    Opens a styled print window. The browser's Print → Save as PDF gives a
 *    properly formatted PDF without any PDF library dependency.
 *
 * All functions accept the same `rows` shape:
 *   [{ [columnKey]: value, ... }, ...]
 *
 * `columns` is an optional array of { key, label, width? } descriptors that
 * controls column order, display names, and (for PDF) column widths.
 * If omitted, columns are inferred from the first row's keys.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function inferColumns(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
}

function cellValue(row, key) {
  const v = row[key];
  if (v == null) return "";
  return String(v);
}

// ─── CSV ──────────────────────────────────────────────────────────────────────
/**
 * @param {object[]} rows
 * @param {string}   filename  — should end in .csv
 * @param {{ key: string, label: string }[]} [columns]
 */
export function exportCSV(rows, filename = "export.csv", columns) {
  const cols = columns ?? inferColumns(rows);
  const escape = (v) => {
    const s = String(v ?? "");
    // Wrap in quotes if the value contains comma, quote, or newline
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.map((c) => escape(c.label)).join(",");
  const body = rows.map((r) =>
    cols.map((c) => escape(cellValue(r, c.key))).join(","),
  );
  const csv = [header, ...body].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

// ─── Excel (XLSX via Office Open XML) ─────────────────────────────────────────
function escapeXml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Shared strings table so repeated values compress well
function buildXlsx(rows, cols, sheetName = "Report") {
  // Build a flat array of all string values for the shared strings table
  const strings = [];
  const strIndex = new Map();
  const si = (v) => {
    const s = String(v ?? "");
    if (strIndex.has(s)) return strIndex.get(s);
    const idx = strings.length;
    strings.push(s);
    strIndex.set(s, idx);
    return idx;
  };

  // Header row indices
  const headerIdx = cols.map((c) => si(c.label));

  // Data rows indices
  const dataIdx = rows.map((r) =>
    cols.map((c) => {
      const v = (row) => row[c.key];
      return si(cellValue(r, c.key));
    }),
  );

  // Column letter helper (A, B, … Z, AA, AB …)
  const colLetter = (n) => {
    let s = "";
    n++;
    while (n > 0) {
      s = String.fromCharCode(64 + (n % 26 || 26)) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  // Build worksheet XML
  const cellXml = (rowNum, colNum, strIdx) =>
    `<c r="${colLetter(colNum)}${rowNum}" t="s"><v>${strIdx}</v></c>`;

  let sheetData = "<sheetData>";
  // Header row (row 1)
  sheetData += `<row r="1" s="1">`;
  headerIdx.forEach((idx, ci) => {
    sheetData += cellXml(1, ci, idx);
  });
  sheetData += "</row>";
  // Data rows
  dataIdx.forEach((rowIdxArr, ri) => {
    const rowNum = ri + 2;
    sheetData += `<row r="${rowNum}">`;
    rowIdxArr.forEach((idx, ci) => {
      sheetData += cellXml(rowNum, ci, idx);
    });
    sheetData += "</row>";
  });
  sheetData += "</sheetData>";

  // Build column widths
  const colDefs = cols
    .map(
      (c, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${c.width ?? 18}" customWidth="1"/>`,
    )
    .join("");

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>${colDefs}</cols>
  ${sheetData}
</worksheet>`;

  // Shared strings XML
  const ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
     count="${strings.length}" uniqueCount="${strings.length}">
${strings.map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`).join("")}
</sst>`;

  // Styles XML — row 1 is bold (xfId 1)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts><font><sz val="11"/><name val="Calibri"/></font>
         <font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills><fill><patternFill patternType="none"/></fill>
         <fill><patternFill patternType="gray125"/></fill></fills>
  <borders><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  return { sheetXml, ssXml, stylesXml, workbookXml, relsXml, contentTypesXml };
}

/**
 * Builds a proper .xlsx file in the browser without any library.
 * Uses JSZip loaded from CDN on first call (lazy).
 *
 * @param {object[]} rows
 * @param {string}   filename   — should end in .xlsx
 * @param {{ key: string, label: string, width?: number }[]} [columns]
 * @param {string}   [sheetName]
 */
export async function exportExcel(
  rows,
  filename = "export.xlsx",
  columns,
  sheetName = "Report",
) {
  const cols = columns ?? inferColumns(rows);

  // Lazy-load JSZip from CDN (only on first Excel export)
  if (!window.JSZip) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const { sheetXml, ssXml, stylesXml, workbookXml, relsXml, contentTypesXml } =
    buildXlsx(rows, cols, sheetName);

  const zip = new window.JSZip();
  zip.file("[Content_Types].xml", contentTypesXml);
  zip.folder("_rels").file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  );
  const xl = zip.folder("xl");
  xl.file("workbook.xml", workbookXml);
  xl.file("sharedStrings.xml", ssXml);
  xl.file("styles.xml", stylesXml);
  xl.folder("_rels").file("workbook.xml.rels", relsXml);
  xl.folder("worksheets").file("sheet1.xml", sheetXml);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
}

// ─── PDF (print window) ───────────────────────────────────────────────────────
/**
 * Opens a styled print window — user does File → Print → Save as PDF.
 * Works without any PDF library.
 *
 * @param {object[]} rows
 * @param {string}   filename    — used as the document title
 * @param {{ key: string, label: string, width?: string }[]} [columns]
 * @param {{ title?: string, subtitle?: string }} [meta]
 */
export function exportPDF(rows, filename = "report", columns, meta = {}) {
  const cols = columns ?? inferColumns(rows);
  const title = meta.title ?? filename.replace(/\.pdf$/i, "");
  const subtitle = meta.subtitle ?? "";

  const thead = cols
    .map(
      (c) =>
        `<th style="padding:6px 10px;text-align:left;background:#1e3a5f;color:#fff;font-size:11px;white-space:nowrap">${escapeXml(c.label)}</th>`,
    )
    .join("");

  const tbody = rows
    .map((r, i) => {
      const bg = i % 2 === 0 ? "#fff" : "#f8fafc";
      const cells = cols
        .map(
          (c) =>
            `<td style="padding:5px 10px;font-size:11px;border-bottom:1px solid #f1f5f9;color:#1e293b;max-width:${c.width ?? "200px"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeXml(cellValue(r, c.key))}</td>`,
        )
        .join("");
      return `<tr style="background:${bg}">${cells}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(title)}</title>
  <style>
    @page { margin: 15mm; size: A4 landscape; }
    body { font-family: -apple-system, sans-serif; margin: 0; color: #1e293b; }
    h1 { font-size: 18px; margin: 0 0 4px; color: #0f172a; }
    p.sub { font-size: 12px; color: #64748b; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
    <div>
      <h1>${escapeXml(title)}</h1>
      ${subtitle ? `<p class="sub">${escapeXml(subtitle)}</p>` : ""}
    </div>
    <div style="font-size:11px;color:#94a3b8;text-align:right">
      ${rows.length} records<br/>
      ${new Date().toLocaleString()}
    </div>
  </div>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  <script>setTimeout(()=>window.print(),350)</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=1100,height=700");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
