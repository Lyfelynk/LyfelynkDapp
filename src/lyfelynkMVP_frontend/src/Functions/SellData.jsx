import React, { useState, useContext } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import ActorContext from "../ActorContext";

export function SellDataFunc({ assetID }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [selling, setSelling] = useState(false);
  const [open, setOpen] = useState(false); // Managing dialog's open state
  const { actors } = useContext(ActorContext);

  const handleSell = async () => {
    try {
      setSelling(true);
      const result = await actors.marketplace.addListing(
        title,
        description,
        parseInt(price),
        category,
        assetID,
      );
      if (result.ok) {
        //alert("Listing added successfully");
        toast({
          title: "Listing Added!",
          description: "Your listing has been successfully created.",
          variant: "success",
        });
        setSelling(false);
        setOpen(false); //dialog closes
      } else {
        //alert("Error adding listing: " + result.err);
        setSelling(false);
        toast({
          title: "Error Adding Listing",
          description: `Error: ${result.err}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding listing:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)} disabled={selling}>
          Sell
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sell your data</DialogTitle>
          <DialogDescription>
            Enter details about your data for sale. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSell} disabled={selling}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
