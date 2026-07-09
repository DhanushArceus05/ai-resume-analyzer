/**
 * Joins class names, filtering out falsy values.
 * Lightweight alternative to the `clsx` package for this stage of the project.
 */
export const cn = (...classes: Array<string | false | null | undefined>): string => {
  return classes.filter(Boolean).join(" ");
};
