import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wallet, Receipt, Send, Check } from "lucide-react";

// Dummy data for demonstration
const dummyData = {
  balance: 0.5,
  transactions: [
    {
      id: 1,
      type: "Received",
      amount: 0.5,
      currency: "ETH",
      date: "2 days ago",
      icon: Receipt,
      color: "text-primary",
    },
    {
      id: 2,
      type: "Sent",
      amount: -0.2,
      currency: "ETH",
      date: "1 week ago",
      icon: Send,
      color: "text-red-500",
    },
    {
      id: 3,
      type: "Approved",
      amount: 0.1,
      currency: "ETH",
      date: "3 days ago",
      icon: Check,
      color: "text-primary",
    },
  ],
};

export default function NewWallet() {
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);

  // Simulate fetching data from an API
  useEffect(() => {
    setTimeout(() => {
      setWalletData(dummyData);
      setLoading(false);
    }, 1000); // Simulate a 1 second delay for loading
  }, []);

  if (loading) {
    return (
      <Card className="bg-background rounded-2xl shadow-lg w-full">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-muted/20">
          <h2 className="text-lg font-semibold">Loading...</h2>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Please wait while we load your wallet data.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background rounded-2xl shadow-lg w-full">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold">My Wallet</h2>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-3xl font-bold">
              <span>{walletData.balance}</span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-500 to-violet-600">
                LYF
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Receipt className="w-5 h-5 mr-2" />
              Receive
            </Button>
            <Button size="sm">
              <Send className="w-5 h-5 mr-2" />
              Send
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-4">
          {walletData.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                  <transaction.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">{transaction.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {transaction.date}
                  </div>
                </div>
              </div>
              <div className={`${transaction.color} font-medium`}>
                {transaction.amount > 0 ? "+" : ""}
                {transaction.amount} {transaction.currency}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 border-t border-muted/20">
        <Button variant="outline" className="w-full">
          <Check className="w-5 h-5 mr-2" />
          Approve Transaction
        </Button>
      </CardFooter>
    </Card>
  );
}
