import ExcelJS from "exceljs";
import type { AthleteDashboardMetrics } from "@/lib/dashboard-metrics";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A1A1D" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFC8F135" },
  size: 11,
};
const KPI_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEEF0F3" },
};

function styleHeaderRow(row: ExcelJS.Row, colCount: number) {
  for (let c = 1; c <= colCount; c += 1) {
    const cell = row.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  }
}

function autosize(sheet: ExcelJS.Worksheet, min = 10, max = 28) {
  sheet.columns.forEach((col) => {
    let longest = min;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len + 2 > longest) longest = Math.min(max, len + 2);
    });
    col.width = longest;
  });
}

/**
 * Classeur BI : onglet Dashboard + 3 onglets données (même format que l’export).
 * Les Tableaux Excel s’adaptent au volume de lignes généré.
 */
export async function buildDashboardWorkbook(
  athleteName: string,
  metrics: AthleteDashboardMetrics,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GymAdvisor";
  workbook.created = new Date();

  // ——— Dashboard ———
  const dash = workbook.addWorksheet("Dashboard", {
    views: [{ showGridLines: false }],
  });
  dash.mergeCells("A1:H1");
  dash.getCell("A1").value = "GymAdvisor — Dashboard BI";
  dash.getCell("A1").font = { bold: true, size: 20, color: { argb: "FF1A1A1D" } };

  dash.mergeCells("A2:D2");
  dash.getCell("A2").value = athleteName;
  dash.getCell("A2").font = { size: 14, color: { argb: "FF5B6470" } };

  dash.mergeCells("E2:H2");
  dash.getCell("E2").value = `${metrics.from} → ${metrics.to}`;
  dash.getCell("E2").font = { size: 12, color: { argb: "FF5B6470" } };
  dash.getCell("E2").alignment = { horizontal: "right" };

  const kpiDefs: Array<[string, string]> = [
    ["A4", "B4"],
    ["C4", "D4"],
    ["E4", "F4"],
    ["G4", "H4"],
  ];
  const kpiLabels = ["Séances", "Volume (kg)", "RPE moyen", "Score ressenti"];
  const kpiValues = [
    `${metrics.kpis.sessionsCompleted}/${metrics.kpis.sessionsPlanned}`,
    metrics.kpis.volumeKg,
    metrics.kpis.avgRpe,
    metrics.kpis.feelingScore,
  ];
  kpiDefs.forEach(([labelRef, valueRef], index) => {
    dash.getCell(labelRef).value = kpiLabels[index];
    dash.getCell(labelRef).font = { bold: true, size: 9, color: { argb: "FF5B6470" } };
    dash.getCell(labelRef).fill = KPI_FILL;
    dash.getCell(valueRef).value = kpiValues[index] ?? "—";
    dash.getCell(valueRef).font = { bold: true, size: 18, color: { argb: "FF1A1A1D" } };
    dash.getCell(valueRef).fill = KPI_FILL;
  });

  const meta = [
    ["A6", "UA moy.", "B6", metrics.uaTotal],
    ["C6", "UA final", "D6", metrics.uaFinalTotal],
    ["E6", "Aigu 7 j", "F6", metrics.acwr.acute],
    ["G6", "Ratio A/C", "H6", metrics.acwr.ratio],
  ] as const;
  for (const [lRef, lVal, vRef, vVal] of meta) {
    dash.getCell(lRef).value = lVal;
    dash.getCell(lRef).font = { bold: true, size: 10, color: { argb: "FF5B6470" } };
    dash.getCell(vRef).value = vVal ?? "—";
    dash.getCell(vRef).font = { bold: true, size: 14 };
  }

  dash.getCell("A8").value =
    "Détail des séries dans les onglets Ressenti, Charges UA et Charges par zone (tableaux Excel dynamiques).";
  dash.getCell("A8").font = { italic: true, size: 9, color: { argb: "FF5B6470" } };
  dash.mergeCells("A8:H8");

  dash.getCell("A10").value = "Fatigue";
  dash.getCell("B10").value = metrics.feeling.fatigue;
  dash.getCell("C10").value = "Sommeil";
  dash.getCell("D10").value = metrics.feeling.sleep;
  dash.getCell("E10").value = "Courbatures";
  dash.getCell("F10").value = metrics.feeling.soreness;
  dash.getCell("G10").value = "Stress";
  dash.getCell("H10").value = metrics.feeling.stress;

  // Mini tableau zones top 4 sur le dashboard
  dash.getCell("A12").value = "Top zones (tonnage)";
  dash.getCell("A12").font = { bold: true, size: 12 };
  dash.getCell("A13").value = "Zone";
  dash.getCell("B13").value = "kg";
  dash.getCell("C13").value = "%";
  styleHeaderRow(dash.getRow(13), 3);
  metrics.zones.slice(0, 4).forEach((zone, index) => {
    const row = 14 + index;
    dash.getCell(`A${row}`).value = zone.label;
    dash.getCell(`B${row}`).value = zone.tonnageKg;
    dash.getCell(`C${row}`).value = zone.percent;
  });

  dash.getCell("E12").value = "Charges UA (aperçu)";
  dash.getCell("E12").font = { bold: true, size: 12 };
  dash.getCell("E13").value = "Période";
  dash.getCell("F13").value = "UA moy.";
  dash.getCell("G13").value = "UA final";
  dash.getCell("H13").value = "RPE moy.";
  for (const col of ["E", "F", "G", "H"]) {
    dash.getCell(`${col}13`).fill = HEADER_FILL;
    dash.getCell(`${col}13`).font = HEADER_FONT;
  }
  metrics.uaSeries.slice(0, 8).forEach((point, index) => {
    const row = 14 + index;
    dash.getCell(`E${row}`).value = point.label;
    dash.getCell(`F${row}`).value = point.ua;
    dash.getCell(`G${row}`).value = point.uaFinal;
    dash.getCell(`H${row}`).value = point.avgRpe;
  });

  for (const letter of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
    dash.getColumn(letter).width = 14;
  }

  // ——— Ressenti ———
  const feelingSheet = workbook.addWorksheet("Ressenti");
  feelingSheet.addRow([
    "Période",
    "Fatigue",
    "Sommeil",
    "Courbatures",
    "Stress",
    "Humeur",
    "Score total",
    "Nb",
  ]);
  styleHeaderRow(feelingSheet.getRow(1), 8);
  feelingSheet.addRow([
    `${metrics.from} → ${metrics.to}`,
    metrics.feeling.fatigue,
    metrics.feeling.sleep,
    metrics.feeling.soreness,
    metrics.feeling.stress,
    metrics.feeling.mood,
    metrics.feeling.totalScore,
    metrics.feeling.count,
  ]);
  feelingSheet.addRow([]);
  feelingSheet.addRow([
    "KPI séances réalisées/prévues",
    `${metrics.kpis.sessionsCompleted}/${metrics.kpis.sessionsPlanned}`,
  ]);
  feelingSheet.addRow(["KPI volume kg", metrics.kpis.volumeKg]);
  feelingSheet.addRow(["KPI RPE séance moy.", metrics.kpis.avgRpe]);
  feelingSheet.addRow(["Baseline McLean", metrics.feeling.baselineMean]);
  feelingSheet.addRow(["Seuil alerte", metrics.feeling.alertThreshold]);
  feelingSheet.addRow([]);
  const feelTableStart = feelingSheet.rowCount + 1;
  if (metrics.feelingSeries.length > 0) {
    feelingSheet.addTable({
      name: "TbRessentiSerie",
      ref: `A${feelTableStart}:G${feelTableStart + metrics.feelingSeries.length}`,
      headerRow: true,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Bucket" },
        { name: "Score" },
        { name: "Fatigue" },
        { name: "Sommeil" },
        { name: "Courbatures" },
        { name: "Stress" },
        { name: "Humeur" },
      ],
      rows: metrics.feelingSeries.map((point) => [
        point.label,
        point.totalScore,
        point.fatigue,
        point.sleep,
        point.soreness,
        point.stress,
        point.mood,
      ]),
    });
  } else {
    feelingSheet.addRow([
      "Bucket",
      "Score",
      "Fatigue",
      "Sommeil",
      "Courbatures",
      "Stress",
      "Humeur",
    ]);
    styleHeaderRow(feelingSheet.getRow(feelTableStart), 7);
  }
  autosize(feelingSheet);

  // ——— Charges UA ———
  const uaSheet = workbook.addWorksheet("Charges UA");
  uaSheet.addRow(["Athlète", athleteName]);
  uaSheet.addRow(["Total UA moy.", metrics.uaTotal]);
  uaSheet.addRow(["Total UA final", metrics.uaFinalTotal]);
  uaSheet.addRow(["Aigu 7j", metrics.acwr.acute]);
  uaSheet.addRow(["Chronique /sem", metrics.acwr.chronic]);
  uaSheet.addRow(["Ratio A/C", metrics.acwr.ratio]);
  uaSheet.addRow([]);
  const uaTableStart = uaSheet.rowCount + 1;
  if (metrics.uaSeries.length > 0) {
    uaSheet.addTable({
      name: "TbChargesUA",
      ref: `A${uaTableStart}:E${uaTableStart + metrics.uaSeries.length}`,
      headerRow: true,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Bucket" },
        { name: "UA moy." },
        { name: "UA final" },
        { name: "RPE moyen" },
        { name: "RPE final" },
      ],
      rows: metrics.uaSeries.map((point) => [
        point.label,
        point.ua,
        point.uaFinal,
        point.avgRpe,
        point.finalRpe,
      ]),
    });
  } else {
    uaSheet.addRow([
      "Bucket",
      "UA moy.",
      "UA final",
      "RPE moyen",
      "RPE final",
    ]);
    styleHeaderRow(uaSheet.getRow(uaTableStart), 5);
  }
  autosize(uaSheet);

  // ——— Zones ———
  const zonesSheet = workbook.addWorksheet("Charges par zone");
  if (metrics.zones.length > 0) {
    zonesSheet.addTable({
      name: "TbZones",
      ref: `A1:D${1 + metrics.zones.length}`,
      headerRow: true,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Zone" },
        { name: "Tonnage (kg)" },
        { name: "%" },
        { name: "Séries" },
      ],
      rows: metrics.zones.map((zone) => [
        zone.label,
        zone.tonnageKg,
        zone.percent,
        zone.setsCount,
      ]),
    });
  } else {
    zonesSheet.addRow(["Zone", "Tonnage (kg)", "%", "Séries"]);
    styleHeaderRow(zonesSheet.getRow(1), 4);
  }
  autosize(zonesSheet);

  // ——— Mode d'emploi ———
  const guide = workbook.addWorksheet("Mode d'emploi");
  guide.getCell("A1").value = "Comment utiliser ce Dashboard BI";
  guide.getCell("A1").font = { bold: true, size: 16 };
  const lines = [
    "",
    "1. L’onglet Dashboard résume les KPI et un aperçu des zones / UA.",
    "2. Les onglets Ressenti, Charges UA et Charges par zone reprennent le format d’export GymAdvisor.",
    "3. Les tableaux Excel (TbRessentiSerie, TbChargesUA, TbZones) s’adaptent au volume de lignes.",
    "4. Pour un fichier avec graphiques natifs Excel, utilise templates/GymAdvisor-Dashboard-BI.xlsx",
    "   (généré via scripts/generate-dashboard-bi.py à partir d’un export).",
  ];
  lines.forEach((line, index) => {
    guide.getCell(`A${index + 2}`).value = line;
  });
  guide.getColumn(1).width = 100;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
