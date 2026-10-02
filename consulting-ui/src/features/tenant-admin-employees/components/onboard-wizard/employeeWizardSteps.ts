import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import type { WizardStepMeta } from '@/components/wizard/wizardTypes';

/** Single source of truth for the "Add Employee" sidebar stepper. */
export const EMPLOYEE_WIZARD_STEPS: WizardStepMeta[] = [
  { id: 1, title: 'Profile', description: 'Personal information', icon: BadgeOutlinedIcon },
  { id: 2, title: 'Employment', description: 'Job information', icon: WorkOutlineOutlinedIcon },
  { id: 3, title: 'Access', description: 'Role & permissions', icon: ShieldOutlinedIcon },
  { id: 4, title: 'Review', description: 'Confirm & invite', icon: TaskAltOutlinedIcon },
];
