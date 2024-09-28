import React from "react";
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
import LoadingScreen from "../../LoadingScreen";
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
import { useEffect, useState, useContext } from "react";
import ActorContext from "../../ActorContext";

const columns = [
  {
    accessorKey: "assetID",
    header: "Asset ID",
  },
  {
    accessorKey: "usedSharedTo",
    header: "User Shared To",
  },
  {
    accessorKey: "time",
    header: "Date",
    cell: ({ getValue }) => {
      const date = new Date(Number(getValue()) / 1000000);
      return formatDate(date, "yyyy-MM-dd HH:mm:ss");
    },
  },
  {
    accessorKey: "sharedType",
    header: "Sharing Type",
    cell: ({ getValue }) => {
      return Object.keys(getValue())[0];
    },
  },
];

function RecentActivityTable() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState([]);
  const { actors } = useContext(ActorContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedFilesList = async () => {
      try {
        const result = await lyfelynkMVP_backend.getSharedFileList();
        console.log(result);
        if (result.ok) {
          setData(result.ok);
          setLoading(false);
        } else {
          console.error("Error fetching shared files list:", result.err);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching shared files list:", error);
        setLoading(false);
      }
    };

    fetchSharedFilesList();
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
          placeholder="Filter documents..."
          value={
            (table.getColumn("assetID") &&
              table.getColumn("assetID").getFilterValue()) ||
            ""
          }
          onChange={(event) =>
            table.getColumn("assetID")?.setFilterValue(event.target.value)
          }
          className="max-w-4xl mr-2"
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

export default RecentActivityTable;
