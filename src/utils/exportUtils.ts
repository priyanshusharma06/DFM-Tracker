import * as XLSX from 'xlsx';
import { DFMProject, DrawingRevision, BalloonItem } from '../types/dfm';
import { exportDfmTrackerExcel } from './excelParser';

export { exportDfmTrackerExcel };

export function exportDfmToExcel(project: DFMProject, activeRevision: DrawingRevision) {
  return exportDfmTrackerExcel(project, activeRevision);
}

/**
 * Exports complete project state to portable JSON file for sharing across systems.
 */
export function exportProjectToJson(project: DFMProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DFM_Project_${project.partNumber}_FullPackage.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and imports project state from a JSON string.
 */
export function validateAndParseProjectJson(jsonStr: string): DFMProject {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.id || !parsed.partNumber || !Array.isArray(parsed.revisions)) {
    throw new Error('Invalid DFM Project file structure. Required fields missing.');
  }
  return parsed as DFMProject;
}
