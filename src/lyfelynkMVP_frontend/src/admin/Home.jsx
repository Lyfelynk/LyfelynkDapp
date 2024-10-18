import React, { useState, useContext, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import WasmModuleUploader from "./WasmModuleUploader";
import MintNFTForm from "./NFTManagement";

function Home() {
  const { actors } = useContext(ActorContext);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [facilities, setFacilities] = useState([
    {
      id: 1,
      name: "City Hospital",
      registrationId: "CH001",
      serviceName: "Emergency Care",
      serviceDesc: "24/7 emergency medical services",
      status: "pending",
    },
    {
      id: 2,
      name: "County Clinic",
      registrationId: "CC002",
      serviceName: "General Practice",
      serviceDesc: "Primary care and routine check-ups",
      status: "pending",
    },
    {
      id: 3,
      name: "Mind Wellness",
      registrationId: "MW003",
      serviceName: "Mental Health",
      serviceDesc: "Counseling and therapy services",
      status: "pending",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [message, setMessage] = useState("");
  const [wasmFile, setWasmFile] = useState(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const result =
          await actors.professional.getPendingProfessionalRequests();
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

    fetchPendingRequests();
  }, [actors]);

  const adminRegister = () => {
    setMessage(`adminRegister function is not implemented yet`);
  };

  const handleStatusChange = async (type, id, action) => {
    try {
      let result;
      if (action === "approve") {
        console.log("approve");
        result = await actors.professional.approveProfessionalRequest(id);
        console.log(result);
      } else {
        console.log("reject");
        result = await actors.professional.rejectProfessionalRequest(id);
        console.log(result);
      }

      if (result.ok) {
        setProfessionals(professionals.filter((p) => p.id !== id));
        setMessage(`Professional ${action}d successfully`);
      } else {
        setMessage(`Error ${action}ing professional: ${result.err}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing professional:`, error);
      setMessage(`Error ${action}ing professional`);
    }
  };

  const confirmStatusChange = () => {
    if (currentAction) {
      const { type, id, action } = currentAction;
      const newStatus = action === "approve" ? "approved" : "denied";

      if (type === "professional") {
        setProfessionals(
          professionals.map((p) =>
            p.id === id ? { ...p, status: newStatus } : p,
          ),
        );
      } else {
        setFacilities(
          facilities.map((f) =>
            f.id === id ? { ...f, status: newStatus } : f,
          ),
        );
      }

      setIsDialogOpen(false);
      setCurrentAction(null);
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

  // Table configurations
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const professionalColumns = [
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
            onClick={() =>
              handleStatusChange("professional", row.original.id, "approve")
            }
            disabled={row.original.status !== "pending"}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleStatusChange("professional", row.original.id, "deny")
            }
            disabled={row.original.status !== "pending"}
          >
            Deny
          </Button>
        </>
      ),
    },
  ];

  const facilityColumns = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Facility Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "registrationId",
      header: "Registration ID",
    },
    {
      accessorKey: "serviceName",
      header: "Service Name",
    },
    {
      accessorKey: "serviceDesc",
      header: "Service Description",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      filterFn: (row, id, value) => {
        return value === "all" ? true : row.getValue(id) === value;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <>
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() =>
              handleStatusChange("facility", row.original.id, "approve")
            }
            disabled={row.original.status !== "pending"}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleStatusChange("facility", row.original.id, "deny")
            }
            disabled={row.original.status !== "pending"}
          >
            Deny
          </Button>
        </>
      ),
    },
  ];

  const professionalTable = useReactTable({
    data: professionals,
    columns: professionalColumns,
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

  const facilityTable = useReactTable({
    data: facilities,
    columns: facilityColumns,
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

  const renderTable = (table) => (
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
                  colSpan={table.getAllColumns().length}
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <section className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <div className="mb-4">
        <Button onClick={adminRegister}>Register Admin</Button>
      </div>

      <Tabs defaultValue="professionals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="professionals">Professionals</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="mint-nft">Mint NFT</TabsTrigger>
        </TabsList>
        <TabsContent value="professionals">
          <Card>
            <CardHeader>
              <CardTitle>Professional Approval</CardTitle>
              <CardDescription>
                Manage and approve professional accounts
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(professionalTable)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="facilities">
          <Card>
            <CardHeader>
              <CardTitle>Facility Approval</CardTitle>
              <CardDescription>
                Manage and approve facility registrations
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(facilityTable)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mint-nft">
          <MintNFTForm />
        </TabsContent>
      </Tabs>

      <WasmModuleUploader />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {currentAction?.action === "approve" ? "approve" : "deny"} this{" "}
              {currentAction?.type}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default Home;
