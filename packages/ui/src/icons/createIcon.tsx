import { forwardRef, type ForwardRefExoticComponent, type ReactNode, type RefAttributes, type SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Width and height in px (or any CSS length). Classes like `h-4 w-4` win over it. */
  size?: number | string;
}

/** A VittamHub icon component. Drop-in for the old `LucideIcon` type. */
export type Icon = ForwardRefExoticComponent<Omit<IconProps, "ref"> & RefAttributes<SVGSVGElement>>;

/**
 * The VittamHub line: a 24px grid, a 1.75 stroke, flat (butt) ends and mitred
 * corners, taken from the cut terminals and straight joins of the official
 * mark, and square points instead of round dots. Every icon is drawn for this
 * set; none is copied from a stock library.
 */
export function createIcon(displayName: string, children: ReactNode): Icon {
  const Component = forwardRef<SVGSVGElement, IconProps>(function VittamIcon({ size = 24, strokeWidth = 1.75, ...props }, ref) {
    const labelled = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        strokeLinejoin="miter"
        aria-hidden={labelled ? undefined : true}
        focusable="false"
        {...props}
      >
        {children}
      </svg>
    );
  });
  Component.displayName = displayName;
  return Component;
}

/** A square point, the set's stand-in for a round dot. */
export function Pt({ x, y, s = 2 }: { x: number; y: number; s?: number }) {
  return <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill="currentColor" stroke="none" />;
}

/**
 * The second tone: a quiet plane of the current colour behind the line,
 * on the part of the icon that is its subject. It is what makes the set
 * read as one family rather than a stock outline library.
 */
export function Tint({ children }: { children: ReactNode }) {
  return (
    <g fill="currentColor" fillOpacity={0.16} stroke="none">
      {children}
    </g>
  );
}
