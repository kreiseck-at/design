import { createElement, forwardRef, type SVGProps } from "react";

export type IconNode = [tag: string, attrs: Record<string, string>];

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Width and height; 24 by default. */
  size?: number | string;
  /** Stroke width at 24; scales with size. 1.75 by default. */
  strokeWidth?: number;
  /** Accessible name; without it the icon is decorative (aria-hidden). */
  title?: string;
}

/** Builds one icon component from its source nodes; used by the generated files. */
export function createIcon(name: string, nodes: IconNode[]) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(({ size = 24, strokeWidth = 1.75, title, className, ...rest }, ref) =>
    createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: className ? `kd-icon kd-icon-${name} ${className}` : `kd-icon kd-icon-${name}`,
        "aria-hidden": title ? undefined : true,
        role: title ? "img" : undefined,
        ...rest,
      },
      title ? createElement("title", null, title) : null,
      ...nodes.map(([tag, attrs], i) => createElement(tag, { key: i, ...camelAttrs(attrs) })),
    ),
  );
  Icon.displayName = name;
  return Icon;
}

const camelAttrs = (attrs: Record<string, string>) =>
  Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]));
