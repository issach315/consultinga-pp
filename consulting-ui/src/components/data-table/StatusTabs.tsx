import { Tab, Tabs } from '@mui/material';

export interface StatusTabOption<T extends string> {
  value: T;
  label: string;
}

interface StatusTabsProps<T extends string> {
  value: T;
  options: StatusTabOption<T>[];
  onChange: (value: T) => void;
}

export function StatusTabs<T extends string>({ value, options, onChange }: StatusTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onChange={(_event, next: T) => onChange(next)}
      sx={{ px: 1.5, minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0 } }}
    >
      {options.map((option) => (
        <Tab key={option.value} value={option.value} label={option.label} />
      ))}
    </Tabs>
  );
}
