export class History {
  private items: string[] = [];
  private index = 0;
  private readonly maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  add(line: string): void {
    if (!line.trim()) return;
    if (this.items[this.items.length - 1] === line) return;
    this.items.push(line);
    if (this.items.length > this.maxSize) {
      this.items.shift();
    }
    this.index = this.items.length;
  }

  back(): string | undefined {
    if (this.items.length === 0) return undefined;
    this.index = Math.max(0, this.index - 1);
    return this.items[this.index];
  }

  forward(): string | undefined {
    if (this.index >= this.items.length) return undefined;
    this.index = Math.min(this.items.length, this.index + 1);
    return this.index < this.items.length ? this.items[this.index] : undefined;
  }

  resetIndex(): void {
    this.index = this.items.length;
  }

  getAll(): string[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
    this.index = 0;
  }

  toJSON(): string[] {
    return this.items;
  }

  fromJSON(data: string[]): void {
    this.items = data;
    this.index = this.items.length;
  }
}
