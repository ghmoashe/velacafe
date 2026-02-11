declare module "klaro" {
  export function setup(config?: unknown): unknown;
  export function show(config?: unknown, modal?: boolean, api?: unknown): unknown;
  export type KlaroConfig = Record<string, unknown>;
  const Klaro: {
    setup?: (config?: unknown) => unknown;
    show?: (config?: unknown, modal?: boolean, api?: unknown) => unknown;
  };
  export default Klaro;
}
