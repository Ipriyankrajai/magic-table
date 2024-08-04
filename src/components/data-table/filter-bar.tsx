"use client";

import type { ColumnDef, Table } from "@tanstack/react-table";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type React from "react";
import type { FilterField } from "./types";
import useUpdateSearchParams from "@/hooks/use-update-search-params";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FilterResetButton } from "./filter-reset-button";
import { FilterCheckobox } from "./filter-checkbox";

// TODO: only pass the columns to generate the filters!
// https://tanstack.com/table/v8/docs/framework/react/examples/filters
interface FilterBarProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  filterFields?: FilterField<TData>[];
}

export function FilterBar<TData, TValue>({
  table,
  columns,
  filterFields,
}: FilterBarProps<TData, TValue>) {
  const filters = table.getState().columnFilters;
  const updateSearchParams = useUpdateSearchParams();
  const router = useRouter();

  const updatePageSearchParams = (values: Record<string, string | null>) => {
    const newSearchParams = updateSearchParams(values);
    router.replace(`?${newSearchParams}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-[46px] items-center justify-between gap-3">
        <p className="font-medium text-foreground">Filters</p>
        <div>
          {filters.length ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                table.resetColumnFilters();
                const resetValues = filters.reduce<Record<string, null>>(
                  (prev, curr) => {
                    prev[curr.id] = null;
                    return prev;
                  },
                  {}
                );
                updatePageSearchParams(resetValues);
              }}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </div>
      <Accordion
        type="multiple"
        // REMINDER: open all filters by default
        defaultValue={filterFields?.map(({ value }) => value as string)}
      >
        {filterFields?.map((field) => {
          return (
            <AccordionItem
              key={field.value as string}
              value={field.value as string}
              className="border-none"
            >
              <AccordionTrigger className="p-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground text-sm">
                    {field.label}
                  </p>
                  <FilterResetButton table={table} {...field} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="-m-4 p-4">
                <FilterCheckobox table={table} {...field} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
