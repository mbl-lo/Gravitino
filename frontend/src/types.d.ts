// src/types.d.ts
declare module '*.jsx' {
  import { ComponentType } from 'react';
  const component: ComponentType;
  export default component;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}