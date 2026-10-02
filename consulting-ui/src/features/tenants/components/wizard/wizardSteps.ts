import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import type { WizardStepMeta } from '@/components/wizard/wizardTypes';

export type { WizardStepMeta };

/** Single source of truth for both the top icon-stepper and the sidebar list. */
export const WIZARD_STEPS: WizardStepMeta[] = [
  { id: 1, title: 'Company Details', description: 'Basic information about the company', icon: ApartmentOutlinedIcon },
  { id: 2, title: 'Location', description: 'Address and region details', icon: LocationOnOutlinedIcon },
  { id: 3, title: 'Tenant Admin', description: 'Primary administrator account', icon: PersonOutlineOutlinedIcon },
  { id: 4, title: 'Modules & Access', description: 'Enable modules and set access', icon: AppsOutlinedIcon },
  { id: 5, title: 'Plan & Configuration', description: 'Select plan and configure settings', icon: TuneOutlinedIcon },
  { id: 6, title: 'Branding', description: 'Upload logo and brand identity', icon: PaletteOutlinedIcon },
  { id: 7, title: 'Review & Create', description: 'Review all details and create tenant', icon: TaskAltOutlinedIcon },
];
