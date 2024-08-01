import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";
import { useCanister } from "@connect2ic/react";

export function BuyDataFunc({ listingID, seller }) {
  const [open, setOpen] = useState(false);
  const [lyfelynkMVP_backend] = useCanister("lyfelynkMVP_backend");

  const handleConfirmPurchase = async () => {
    try {
      const result = await lyfelynkMVP_backend.purchaseListing(
        listingID,
        seller,
      );
      if (result.ok) {
        toast({
          title: "Purchase successful",
          description: "Your purchase has been completed.",
          variant: "success",
        });
        setOpen(false);
      } else {
        toast({
          title: "Purchase Failed",
          description: `Error: ${result.err}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `An error occurred: ${error}`,
        variant: "default",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="p-2 text-white" onClick={() => setOpen(true)}>
          <ShoppingCart />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Are you sure you want to buy this data?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirmPurchase}>Yes</Button>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
