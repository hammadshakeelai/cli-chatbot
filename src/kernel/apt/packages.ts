export interface PackageManifest {
  name: string;
  version: string;
  size: number;
  description: string;
  deps?: string[];
  provides: string[];
}

const packages: PackageManifest[] = [
  {
    name: 'figlet',
    version: '2.2.5',
    size: 1420,
    description: 'Display large characters from ASCII text',
    provides: ['figlet'],
  },
  {
    name: 'cowsay',
    version: '3.7.0',
    size: 780,
    description: 'Configurable speaking/thinking cow',
    provides: ['cowsay'],
  },
  {
    name: 'lolcat',
    version: '1.4.0',
    size: 340,
    description: 'Rainbow coloring for text',
    provides: ['lolcat'],
  },
  {
    name: 'fortune',
    version: '1.2.0',
    size: 560,
    description: 'Print a random fortune',
    provides: ['fortune'],
    deps: ['cowsay'],
  },
  {
    name: 'cmatrix',
    version: '2.0-1',
    size: 680,
    description: 'Simulate the display from "The Matrix"',
    provides: ['cmatrix'],
  },
  {
    name: 'hollywood',
    version: '1.8',
    size: 1200,
    description: 'Fill your terminal with Hollywood melodrama',
    provides: ['hollywood'],
  },
  {
    name: 'sl',
    version: '5.02',
    size: 420,
    description: 'Steam locomotive runs across your terminal',
    provides: ['sl'],
  },
  {
    name: 'nyancat',
    version: '1.0.0',
    size: 350,
    description: 'Rainbow cat with poptart',
    provides: ['nyancat'],
  },
];

export function getPackage(name: string): PackageManifest | undefined {
  return packages.find((p) => p.name === name);
}

export function searchPackages(query: string): PackageManifest[] {
  const lower = query.toLowerCase();
  return packages.filter(
    (p) =>
      p.name.includes(lower) ||
      p.description.toLowerCase().includes(lower),
  );
}

export function listAllPackages(): PackageManifest[] {
  return [...packages];
}
