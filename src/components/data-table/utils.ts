import type { ColumnFiltersState } from "@tanstack/react-table";
import { z } from "zod";

export function deserialize<T extends z.AnyZodObject>(schema: T) {
  const castToSchema = z.preprocess((val) => {
    if (typeof val !== "string") return val;
    return val
      .trim()
      .split(" ")
      .reduce((prev, curr) => {
        const [name, value] = curr.split(":");
        if (!value || !name) return prev;

        if (!value.includes(",")) {
          prev[name] = [value];
          return prev;
        }
        const values = value.split(",");
        prev[name] = values;
        return prev;
      }, {} as Record<string, unknown>);
  }, schema);
  return (value: string) => castToSchema.safeParse(value);
}

export function serializeColumFilters(columnFilters: ColumnFiltersState) {
  return columnFilters.reduce((prev, curr) => {
    if (Array.isArray(curr.value)) {
      return `${prev}${curr.id}:${curr.value.join(",")} `;
    }
    return `${prev}${curr.id}:${curr.value} `;
  }, "");
}
