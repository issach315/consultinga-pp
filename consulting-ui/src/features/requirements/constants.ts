// Mirrors consulting-api/app/modules/requirements/constants.py — the backend
// is the source of truth for enforcement, this copy only drives sidebar/route
// labels and the composite-key mapping used by the permission assignment UI.
export const REQUIREMENTS_MODULE_KEY = 'requirements';

export interface RequirementsSubModuleDef {
  key: string;
  label: string;
  path: string;
}

export const REQUIREMENTS_SUB_MODULES: RequirementsSubModuleDef[] = [
  { key: 'clients', label: 'Client', path: '/clients' },
  { key: 'requirements', label: 'Jobs (Requirements)', path: '/clients/requirements' },
  { key: 'submissions', label: 'Submissions', path: '/requirements/submissions' },
  { key: 'interviews', label: 'Interviews', path: '/requirements/interviews' },
  { key: 'placements', label: 'Placements', path: '/requirements/placements' },
  { key: 'bench', label: 'Bench', path: '/requirements/bench' },
];
