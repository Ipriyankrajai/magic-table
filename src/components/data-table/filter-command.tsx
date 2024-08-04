"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Kbd } from "@/components/ui/kbd";
import type { Table } from "@tanstack/react-table";
import type { z } from "zod";
import type { FilterField } from "./types";
import { deserialize, serializeColumFilters } from "./utils";
import useUpdateSearchParams from "@/hooks/use-update-search-params";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface FilterCommandProps<TData, TSchema extends z.AnyZodObject> {
  table: Table<TData>;
  schema: TSchema;
  filterFields?: FilterField<TData>[];
}

export function FilterCommand<TData, TSchema extends z.AnyZodObject>({
  schema,
  table,
  filterFields,
}: FilterCommandProps<TData, TSchema>) {
  const columnFilters = table.getState().columnFilters;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState("");
  const [inputValue, setInputValue] = useState<string>(
    serializeColumFilters(columnFilters)
  );
  const updateSearchParams = useUpdateSearchParams();
  const router = useRouter();

  const updatePageSearchParams = (values: Record<string, unknown>) => {
    const newSearchParams = updateSearchParams(values, { override: true });
    router.replace(`?${newSearchParams}`, { scroll: false });
  };

  useEffect(() => {
    if (currentWord !== "" && open) return;
    const searchparams = deserialize(schema)(inputValue);
    if (searchparams.success) {
      table.resetColumnFilters();

      for (const key of Object.keys(searchparams.data)) {
        table
          .getColumn(key)
          ?.setFilterValue(
            searchparams.data[key as keyof typeof searchparams.data]
          );
      }

      updatePageSearchParams(searchparams.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, open, currentWord]);

  useEffect(() => {
    setInputValue(serializeColumFilters(columnFilters));
  }, [columnFilters]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef?.current?.focus();
    }
  }, [open]);

  return (
    <div>
      <div
        className={cn(
          "group flex w-full items-center rounded-lg border border-input text-muted-foreground bg-background px-3 hover:bg-accent hover:text-accent-foreground ring-offset-background focus-within:ring-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2",
          open ? "hidden" : "visible"
        )}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
        <button
          type="button"
          className="h-11 w-full max-w-sm truncate py-3 text-left text-sm outline-none md:max-w-xl lg:max-w-4xl xl:max-w-5xl disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {inputValue.trim() ? (
            <span className="text-foreground">{inputValue}</span>
          ) : (
            <span>Search data table...</span>
          )}
        </button>
        {/* add group-hover? */}
        <Kbd className="ml-auto text-muted-foreground group-hover:text-accent-foreground">
          <span className="mr-0.5">⌘</span>
          <span>K</span>
        </Kbd>
      </div>
      <Command
        className={cn(
          "overflow-visible rounded-lg border shadow-md [&>div]:border-none",
          open ? "visible" : "hidden"
        )}
        filter={(value, _search) => {
          if (value.includes(currentWord.toLowerCase())) return 1;
          /**
           * @example [filter, query] = ["regions", "ams,gru"]
           */
          const [filter, query] = currentWord.toLowerCase().split(":");
          if (query) {
            /**
             * @example queries = ["ams", "gru"]
             */
            const queries = query.split(",");
            const extendedQueries = queries?.map((item) => `${filter}:${item}`);
            if (extendedQueries.some((item) => item === value)) return 0;
            if (extendedQueries.some((item) => value.includes(item))) return 1;
          }
          return 0;
        }}
      >
        <CommandInput
          ref={inputRef}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={(e) => {
            if (e.key === "Escape") inputRef?.current?.blur();
          }}
          onBlur={() => setOpen(false)}
          // onFocus={() => setOpen(true)}
          onInput={(e) => {
            const caretPositionStart = e.currentTarget?.selectionStart || -1;
            const currentValue = e.currentTarget?.value || "";

            let start = caretPositionStart;
            let end = caretPositionStart;

            while (start > 0 && currentValue[start - 1] !== " ") start--;
            while (end < currentValue.length && currentValue[end] !== " ")
              end++;

            const word = currentValue.substring(start, end);
            setCurrentWord(word);
          }}
          placeholder="Search data table..."
          className="text-foreground"
        />
        <div className="relative">
          <div className="absolute top-2 z-10 w-full animate-in rounded-lg border border-accent-foreground/30 overflow-hidden bg-popover text-popover-foreground shadow-md outline-none">
            <CommandList>
              <CommandGroup heading="Filter">
                {filterFields?.map(({ value, options }) => {
                  if (typeof value !== "string") return null;
                  if (inputValue.includes(`${value}:`)) return null;
                  return (
                    <CommandItem
                      key={value}
                      value={value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={(value) => {
                        setInputValue((prev) => {
                          if (currentWord.trim() === "") {
                            const input = `${prev}${value}`;
                            return `${input}:`;
                          }
                          // lots of cheat
                          const isStarting = currentWord === prev;
                          const prefix = isStarting ? "" : " ";
                          const input = prev.replace(
                            `${prefix}${currentWord}`,
                            `${prefix}${value}`
                          );
                          return `${input}:`;
                        });
                        setCurrentWord(`${value}:`);
                      }}
                      className="group"
                    >
                      {value}
                      <span className="ml-1 hidden truncate text-muted-foreground/80 group-aria-[selected=true]:block">
                        {options?.map(({ value }) => `[${value}]`).join(" ")}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Query">
                {filterFields?.map(({ value, options }) => {
                  if (typeof value !== "string") return null;
                  if (!currentWord.includes(`${value}:`)) return null;
                  const column = table.getColumn(value);
                  const facetedValue = column?.getFacetedUniqueValues();
                  return options?.map(({ value: optionValue }) => {
                    return (
                      <CommandItem
                        key={`${value}:${optionValue}`}
                        value={`${value}:${optionValue}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onSelect={(value) => {
                          setInputValue((prev) => {
                            if (currentWord.includes(",")) {
                              const words = currentWord.split(",");
                              words[words.length - 1] = `${optionValue}`;
                              const input = prev.replace(
                                currentWord,
                                words.join(",")
                              );
                              return `${input.trim()} `;
                            }
                            const input = prev.replace(currentWord, value);
                            return `${input.trim()} `;
                          });
                          setCurrentWord("");
                        }}
                      >
                        {`${optionValue}`}
                        <span className="ml-auto font-mono text-muted-foreground">
                          {facetedValue?.get(optionValue)}
                        </span>
                      </CommandItem>
                    );
                  });
                })}
              </CommandGroup>
              <CommandEmpty>No results found.</CommandEmpty>
            </CommandList>
            <div
              className="flex flex-wrap gap-3 border-t bg-accent/50 px-2 py-1.5 text-accent-foreground text-sm"
              cmdk-footer=""
            >
              <span>
                Use <Kbd className="bg-background">↑</Kbd>{" "}
                <Kbd className="bg-background">↓</Kbd> to navigate
              </span>
              <span>
                <Kbd className="bg-background">Enter</Kbd> to query
              </span>
              <span>
                <Kbd className="bg-background">Esc</Kbd> to close
              </span>
              <Separator orientation="vertical" className="my-auto h-3" />
              <span>
                Union: <Kbd className="bg-background">regions:a,b</Kbd>
              </span>
            </div>
          </div>
        </div>
      </Command>
    </div>
  );
}
