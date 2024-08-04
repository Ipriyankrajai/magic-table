"use client";

import { DataTable } from "@/components/data-table";
import { columns } from "@/components/data-table/column";
import { data, filterFields } from "@/components/data-table/constants";
import { schema } from "@/components/data-table/schema";

export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const search = schema.safeParse(searchParams);

  if (!search.success) {
    console.log(search.error);
    return null;
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      filterFields={filterFields}
      defaultColumnFilters={Object.entries(search.data).map(([key, value]) => ({
        id: key,
        value,
      }))}
    />
  );
}
