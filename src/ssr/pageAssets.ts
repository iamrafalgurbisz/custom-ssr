export type Manifest = Record<
  string,
  { file: string; css?: string[]; imports?: string[]; isEntry?: boolean }
>;

export const pageAssetLinks = (manifest: Manifest, file: string | undefined): string => {
  if (!file) return '';

  const js = new Set<string>();
  const css = new Set<string>();

  const visit = (key: string) => {
    const chunk = manifest[key];
    if (!chunk || chunk.isEntry || js.has(chunk.file)) return;
    js.add(chunk.file);
    chunk.css?.forEach((f) => css.add(f));
    chunk.imports?.forEach(visit);
  };
  visit(file);

  return [
    ...[...css].map((f) => `<link rel="stylesheet" href="/${f}" />`),
    ...[...js].map((f) => `<link rel="modulepreload" href="/${f}" />`),
  ].join('\n    ');
};
