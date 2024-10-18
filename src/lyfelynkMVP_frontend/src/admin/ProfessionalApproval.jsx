import React, { useState, useEffect, useContext } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingScreen from "../LoadingScreen";
import ActorContext from "../ActorContext";

function ProfessionalApproval() {
  const { actors } = useContext(ActorContext);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const result = await actors.professional.getPendingProfessionalRequests();
      if (result.ok) {
        const formattedRequests = result.ok.map(([principal, data]) => ({
          id: principal,
          name: JSON.parse(
            new TextDecoder().decode(data.MetaData.DemographicInformation),
          ).name,
          occupation: JSON.parse(
            new TextDecoder().decode(data.MetaData.OccupationInformation),
          ).occupation,
          certificationId: JSON.parse(
            new TextDecoder().decode(data.MetaData.CertificationInformation),
          ).certificationId,
          company: JSON.parse(
            new TextDecoder().decode(data.MetaData.OccupationInformation),
          ).company,
          status: "pending",
        }));
        setProfessionals(formattedRequests);
      } else {
        console.error("Error fetching pending requests:", result.err);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id, action) => {
    try {
      let result;
      if (action === "approve") {
        result = await actors.professional.approveProfessionalRequest(id);
      } else {
        result = await actors.professional.rejectProfessionalRequest(id);
      }

      if (result.ok) {
        setProfessionals(professionals.filter((p) => p.id !== id));
      } else {
        console.error(`Error ${action}ing professional:`, result.err);
      }
    } catch (error) {
      console.error(`Error ${action}ing professional:`, error);
    }
  };

  const StatusBadge = ({ status }) => {
    const colorMap = {
      pending: "bg-yellow-500",
      approved: "bg-green-500",
      denied: "bg-red-500",
    };
    return <Badge className={`${colorMap[status]} text-white`}>{status}</Badge>;
  };

  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "occupation",
      header: "Occupation",
    },
    {
      accessorKey: "certificationId",
      header: "Certification ID",
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <>
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => handleStatusChange(row.original.id, "approve")}
            disabled={row.original.status !== "pending"}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange(row.original.id, "deny")}
            disabled={row.original.status !== "pending"}
          >
            Deny
          </Button>
        </>
      ),
    },
  ];

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: professionals,
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
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter names..."
            value={table.getColumn("name")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            value={table.getColumn("status")?.getFilterValue() ?? "all"}
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default ProfessionalApproval;
