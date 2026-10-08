import type { CentralKpi } from "@/types/domain";
import { kpiFileTypes } from "@/data/central";

const HEADERS = ["KPI", "Unit of measurement", "Baseline", "Target type", "Fixed value", "Minimum", "Maximum", "Reporting frequency", "Applicable activity", "Evidence required", "Evidence file types"] as const;

type Activity = { id: string; name: string };

export type ParsedCustomKpi = Pick<CentralKpi, "name" | "unit" | "baseline" | "target" | "targetMode" | "targetMin" | "targetMax" | "frequency" | "activityId" | "evidence" | "noEvidence" | "evidenceRequired" | "evidenceTypes">;

function cell(value: unknown) {
  return String(value ?? "").trim();
}

function columnIndex(header: string[], names: string[]) {
  return header.findIndex((item) => names.includes(item));
}

function numberText(value: string) {
  const match = value.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return match ? match[0] : "";
}

export async function downloadKpiTemplate(activities: Activity[]) {
  const XLSX = await import("xlsx");
  const example = activities.find((item) => item.name.trim())?.name.trim() || "Activity name";
  const sheet = XLSX.utils.aoa_to_sheet([
    [...HEADERS],
    ["Coral reef area restored", "Hectares (ha)", "5", "Fixed", "15", "", "", "Half-yearly", example, "Yes", "PDF, Image"],
    ["Mangrove area restored", "Hectares (ha)", "0", "Range", "", "20", "80", "Quarterly", example, "No", ""],
  ]);
  sheet["!cols"] = HEADERS.map(() => ({ wch: 24 }));
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
  const typeCol = columnIndex(header, ["target type"]);
  const fixedCol = columnIndex(header, ["fixed value", "target"]);
  const minCol = columnIndex(header, ["minimum", "min"]);
  const maxCol = columnIndex(header, ["maximum", "max"]);
  const frequencyCol = columnIndex(header, ["reporting frequency", "frequency"]);
  const activityCol = columnIndex(header, ["applicable activity", "activity"]);
  const evidenceCol = columnIndex(header, ["evidence required", "evidence"]);
  const typesCol = columnIndex(header, ["evidence file types", "file types"]);
  if ([nameCol, unitCol, baselineCol, typeCol, fixedCol, minCol, maxCol, frequencyCol, activityCol, evidenceCol, typesCol].some((index) => index < 0)) {
    throw new Error("Use the downloaded template. It needs Target type, Fixed value, Minimum, Maximum, Evidence required and Evidence file types.");
  }

  const parsed: ParsedCustomKpi[] = [];
  grid.slice(1).forEach((row, index) => {
    const name = cell(row[nameCol]);
    const unit = cell(row[unitCol]);
    const baseline = cell(row[baselineCol]);
    const targetType = cell(row[typeCol]).toLowerCase();
    const fixed = numberText(cell(row[fixedCol]));
    const minimum = numberText(cell(row[minCol]));
    const maximum = numberText(cell(row[maxCol]));
    const frequency = cell(row[frequencyCol]);
    const activityName = cell(row[activityCol]);
    const evidence = cell(row[evidenceCol]);
    const typeNames = cell(row[typesCol]);
    if (![name, unit, baseline, targetType, fixed, minimum, maximum, frequency, activityName, evidence, typeNames].some(Boolean)) return;
    const line = index + 2;
    if (!name || !unit || !baseline || !frequency || !activityName) {
      throw new Error(`Row ${line} is missing a KPI, unit, baseline, frequency or activity.`);
    }
    if (targetType !== "fixed" && targetType !== "range") {
      throw new Error(`Row ${line} must set Target type to Fixed or Range.`);
    }
    if (targetType === "fixed" && !fixed) throw new Error(`Row ${line} needs a fixed number, for example 56.`);
    if (targetType === "range" && (!minimum || !maximum)) throw new Error(`Row ${line} needs a minimum and a maximum number.`);
    if (targetType === "range" && Number(maximum) < Number(minimum)) throw new Error(`Row ${line} maximum must be at least the minimum.`);
    const activity = activities.find((item) => item.name.trim().toLowerCase() === activityName.toLowerCase());
    if (!activity) throw new Error(`Row ${line} uses “${activityName}”, which is not an activity on this project.`);
    const answer = evidence.toLowerCase();
    const evidenceRequired = answer === "yes" || answer === "y";
    if (!evidenceRequired && answer !== "no" && answer !== "n") {
      throw new Error(`Row ${line} must set Evidence required to Yes or No.`);
    }
    const evidenceTypes = kpiFileTypes.filter((type) => typeNames.toLowerCase().includes(type.label.toLowerCase()) || typeNames.toLowerCase().includes(type.id)).map((type) => type.id);
    if (evidenceRequired && !evidenceTypes.length) throw new Error(`Row ${line} must list evidence file types, for example PDF, Image.`);
    parsed.push({
      name,
      unit,
      baseline,
      target: targetType === "fixed" ? fixed : "",
      targetMode: targetType === "range" ? "range" : "fixed",
      targetMin: targetType === "range" ? minimum : "",
      targetMax: targetType === "range" ? maximum : "",
      frequency,
      activityId: activity.id,
      evidence: "",
      noEvidence: !evidenceRequired,
      evidenceRequired,
      evidenceTypes,
    });
  });
  if (!parsed.length) throw new Error("The template has no KPI rows to import.");
  return parsed;
}
