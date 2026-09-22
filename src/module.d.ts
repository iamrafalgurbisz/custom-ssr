export {};

declare global {
  interface Window {
    __URL__: string;
    __getDeferred__: (key: string) => Promise<unknown>;
  }
}
