// The generic PermissionMatrixField (and everything built on ModulePermission)
// only understands a single flat `module: string` key per row — it has no
// concept of sub-modules. Rather than teach that shared component about
// hierarchy, Requirements sub-modules are represented to it as one composite
// key ("requirements:clients") and split back into {module, subModule} only
// at the API DTO boundary.
const SEPARATOR = ':';

export function joinCompositeModuleKey(module: string, subModule: string): string {
  return `${module}${SEPARATOR}${subModule}`;
}

export function splitCompositeModuleKey(key: string): { module: string; subModule: string | null } {
  const separatorIndex = key.indexOf(SEPARATOR);
  if (separatorIndex === -1) return { module: key, subModule: null };
  return { module: key.slice(0, separatorIndex), subModule: key.slice(separatorIndex + 1) };
}
