/**
 * Explicitly typed JSON value
 */
export type Metadata =
  | boolean
  | number
  | string
  | Array<Metadata>
  | { [key: string]: Metadata }
