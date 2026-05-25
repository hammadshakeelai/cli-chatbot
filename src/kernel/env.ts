export class Env {
  private vars: Map<string, string> = new Map();

  constructor() {
    this.vars.set('HOME', '/home/user');
    this.vars.set('USER', 'user');
    this.vars.set('SHELL', 'mirage');
    this.vars.set('PWD', '/home/user');
    this.vars.set('PATH', '/bin:/usr/bin:/usr/local/bin');
    this.vars.set('TERM', 'xterm-256color');
  }

  get(key: string): string | undefined {
    return this.vars.get(key);
  }

  set(key: string, value: string): void {
    this.vars.set(key, value);
  }

  export(key: string, value: string): void {
    this.vars.set(key, value);
  }

  unset(key: string): void {
    this.vars.delete(key);
  }

  expand(text: string): string {
    return text.replace(/\$(\w+|\{[^}]+\})/g, (match, key) => {
      const k = key.startsWith('{') ? key.slice(1, -1) : key;
      return this.get(k) ?? match;
    });
  }

  entries(): [string, string][] {
    return Array.from(this.vars.entries());
  }

  toJSON(): Record<string, string> {
    return Object.fromEntries(this.vars);
  }

  fromJSON(data: Record<string, string>): void {
    this.vars = new Map(Object.entries(data));
  }
}
