import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataOnSaleTable from "../Tables/DataOnSale";
import DataPurchasedTable from "../Tables/DataPurchased";

export default function MarketplaceContent() {
  return (
    <div>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground">Marketplace</h1>
        <p className="mt-2 text-base text-gray-600">
          Explore and Acquire Critical Health Insights responsibly.
        </p>
        <Tabs
          defaultValue="Purchase"
          className="mt-4"
        >
          <TabsList className="w-full">
            <TabsTrigger
              value="Purchase"
              className="w-2/3"
            >
              Purchase
            </TabsTrigger>
            <TabsTrigger
              value="Past Orders"
              className="w-1/3"
            >
              Past Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="Purchase">
            <DataOnSaleTable />
          </TabsContent>

          <TabsContent value="Past Orders">
            <DataPurchasedTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
