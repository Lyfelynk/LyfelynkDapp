import React, { useState, useContext } from "react";
import ActorContext from "../ActorContext";
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

export function ShareDataFunc({ assetID }) {
  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { actors } = useContext(ActorContext);

  const handleShare = async () => {
    try {
      setSharing(true);
      const result = await actors.dataAsset.shareDataAsset(userId, assetID);
      if (result.ok) {
        toast({
          title: "Access Granted!",
          description: "User has been granted access to the data.",
          variant: "success",
        });
        setSharing(false);
        setOpen(false);
      } else {
        setSharing(false);
        toast({
          title: "Error Granting Access",
          description: `Error: ${result.err}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error granting access:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={sharing}
        >
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share your data</DialogTitle>
          <DialogDescription>
            Enter the user ID you want to share your data with. Click share when
            you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userId" className="text-right">
              User ID
            </Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleShare} disabled={sharing}>
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
