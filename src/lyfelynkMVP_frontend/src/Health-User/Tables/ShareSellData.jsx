"use client";

import React, { useEffect, useState, useContext } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import formatDate from "date-fns/format";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SellDataFunc } from "@/Functions/SellData";
import { ShareDataFunc } from "@/Functions/ShareData";
import DownloadFile from "../../Functions/DownloadFile";
import ActorContext from "../../ActorContext";
import LoadingScreen from "../../LoadingScreen";
const columns = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ getValue }) => {
      const date = new Date(getValue() / 1000000); // Convert nanoseconds to milliseconds
      return formatDate(date, "yyyy-MM-dd HH:mm:ss");
    },
  },
  {
    accessorKey: "format",
    header: "File Format",
  },
  {
    id: "download",
    header: "",
    cell: ({ row }) => (
      <DownloadFile
        data={row.original.data}
        uniqueID={row.original.assetid}
        title={row.original.title}
        format={row.original.format}
      />
    ),
  },
  {
    id: "share",
    header: "",
    cell: ({ row }) => <ShareDataFunc assetID={row.original.timestamp} />,
  },
  {
    id: "sell",
    header: "",
    cell: ({ row }) => <SellDataFunc assetID={row.original.timestamp} />,
  },
];

export function ShareSellTable() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState([]);
  const { actors } = useContext(ActorContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDataAssets = async () => {
      try {
        const result = await actors.dataAsset.getUserDataAssets();
        console.log(result);
        if (result.ok) {
          const dataAssets = result.ok.map(([timestamp, asset]) => ({
            assetid: asset.assetID,
            timestamp,
            title: asset.title,
            description: asset.description,
            format: asset.metadata.format,
            data: asset.data,
          }));
          setData(dataAssets);
          setLoading(false);
        } else {
          console.error("Error fetching user data assets:", result.err);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data assets:", error);
        setLoading(false);
      }
    };

    fetchUserDataAssets();
  }, [actors]);

  const table = useReactTable({
    data: data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  if (loading) {
    return <LoadingScreen />;
  }
  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter names..."
          value={
            (table.getColumn("name") &&
              table.getColumn("name").getFilterValue()) ||
            ""
          }
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full mr-2"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
