import type { CentralKpi } from "@/types/domain";

const HEADERS = ["KPI", "Unit of measurement", "Baseline", "Target", "Reporting frequency", "Applicable activity", "Evidence"] as const;

type Activity = { id: string; name: string };

export type ParsedCustomKpi = Pick<CentralKpi, "name" | "unit" | "baseline" | "target" | "frequency" | "activityId" | "evidence" | "noEvidence">;

function cell(value: unknown) {
  return String(value ?? "").trim();
}

function columnIndex(header: string[], names: string[]) {
  return header.findIndex((item) => names.includes(item));
}

export async function downloadKpiTemplate(activities: Activity[]) {
  const XLSX = await import("xlsx");
  const example = activities.find((item) => item.name.trim())?.name.trim() || "Activity name";
  const sheet = XLSX.utils.aoa_to_sheet([
    [...HEADERS],
    ["Coral reef area restored", "Hectares (ha)", "5 ha", "15 ha", "Half-yearly", example, "Yes"],
  ]);
  sheet["!cols"] = HEADERS.map(() => ({ wch: 28 }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Custom KPIs");
  XLSX.writeFile(book, "ncm-custom-kpi-template.xlsx");
}

export async function readKpiTemplate(file: File, activities: Activity[]): Promise<ParsedCustomKpi[]> {
  const XLSX = await import("xlsx");
  const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new Error("The workbook has no sheet to read.");
  const grid = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, raw: false, defval: "" });
  const header = (grid[0] ?? []).map((item) => cell(item).toLowerCase());
  const nameCol = columnIndex(header, ["kpi", "kpi name"]);
  const unitCol = columnIndex(header, ["unit of measurement", "unit"]);
  const baselineCol = columnIndex(header, ["baseline"]);
  const targetCol = columnIndex(header, ["target"]);
  const frequencyCol = columnIndex(header, ["reporting frequency", "frequency"]);
  const activityCol = columnIndex(header, ["applicable activity", "activity"]);
  const evidenceCol = columnIndex(header, ["evidence"]);
  if ([nameCol, unitCol, baselineCol, targetCol, frequencyCol, activityCol, evidenceCol].some((index) => index < 0)) {
    throw new Error("Use the downloaded template. It needs KPI, Unit of measurement, Baseline, Target, Reporting frequency, Applicable activity and Evidence.");
  }

  const parsed: ParsedCustomKpi[] = [];
  grid.slice(1).forEach((row, index) => {
    const name = cell(row[nameCol]);
    const unit = cell(row[unitCol]);
    const baseline = cell(row[baselineCol]);
    const target = cell(row[targetCol]);
    const frequency = cell(row[frequencyCol]);
    const activityName = cell(row[activityCol]);
    const evidence = cell(row[evidenceCol]);
    if (![name, unit, baseline, target, frequency, activityName, evidence].some(Boolean)) return;
    const line = index + 2;
    if (!name || !unit || !baseline || !target || !frequency || !activityName) {
      throw new Error(`Row ${line} is missing a KPI, unit, baseline, target, frequency or activity.`);
    }
    const activity = activities.find((item) => item.name.trim().toLowerCase() === activityName.toLowerCase());
    if (!activity) throw new Error(`Row ${line} uses “${activityName}”, which is not an activity on this project.`);
    const answer = evidence.toLowerCase();
    const noEvidence = answer === "no" || answer === "n";
    if (!noEvidence && answer !== "yes" && answer !== "y") {
      throw new Error(`Row ${line} must set Evidence to Yes or No.`);
    }
    parsed.push({ name, unit, baseline, target, frequency, activityId: activity.id, evidence: "", noEvidence });
  });
  if (!parsed.length) throw new Error("The template has no KPI rows to import.");
  return parsed;
}
