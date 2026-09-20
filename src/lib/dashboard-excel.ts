import ExcelJS from "exceljs";
import type { AthleteDashboardMetrics } from "@/lib/dashboard-metrics";

export async function buildDashboardWorkbook(
  athleteName: string,
  metrics: AthleteDashboardMetrics,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GymAdvisor";
  workbook.created = new Date();

  const feelingSheet = workbook.addWorksheet("Ressenti");
  feelingSheet.addRow([
    "Période",
    "Énergie",
    "Sommeil",
    "Douleurs",
    "Motivation",
    "Nb check-ins",
    "Score ressenti",
  ]);
  feelingSheet.addRow([
    `${metrics.from} → ${metrics.to}`,
    metrics.feeling.energy,
    metrics.feeling.sleep,
    metrics.feeling.pain,
    metrics.feeling.motivation,
    metrics.feeling.count,
    metrics.kpis.feelingScore,
  ]);
  feelingSheet.addRow([]);
  feelingSheet.addRow([
    "KPI séances",
    `${metrics.kpis.sessionsCompleted}/${metrics.kpis.sessionsPlanned}`,
  ]);
  feelingSheet.addRow(["KPI volume kg", metrics.kpis.volumeKg]);
  feelingSheet.addRow(["KPI RPE moyen", metrics.kpis.avgRpe]);
  feelingSheet.addRow([]);
  feelingSheet.addRow([
    "Bucket",
    "Énergie",
    "Sommeil",
    "Douleurs",
    "Motivation",
    "Nb",
  ]);
  for (const point of metrics.feelingSeries) {
    feelingSheet.addRow([
      point.label,
      point.energy,
      point.sleep,
      point.pain,
      point.motivation,
      point.count,
    ]);
  }

  const uaSheet = workbook.addWorksheet("Charges UA");
  uaSheet.addRow(["Athlète", athleteName]);
  uaSheet.addRow(["Total UA", metrics.uaTotal]);
  uaSheet.addRow(["Aigu 7j", metrics.acwr.acute]);
  uaSheet.addRow(["Chronique /sem", metrics.acwr.chronic]);
  uaSheet.addRow(["Ratio A/C", metrics.acwr.ratio]);
  uaSheet.addRow([]);
  uaSheet.addRow(["Bucket", "UA", "RPE moyen"]);
  for (const point of metrics.uaSeries) {
    uaSheet.addRow([point.label, point.ua, point.avgRpe]);
  }

  const zonesSheet = workbook.addWorksheet("Charges par zone");
  zonesSheet.addRow(["Zone", "Tonnage (kg)", "%"]);
  for (const zone of metrics.zones) {
    zonesSheet.addRow([zone.label, zone.tonnageKg, zone.percent]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
