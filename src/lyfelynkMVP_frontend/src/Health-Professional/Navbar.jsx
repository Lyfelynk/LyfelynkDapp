import React, { useState, useContext } from "react"; // Added useContext
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button"; // Import Button
import ActorContext from "@/ActorContext"; // Import the context
import { toast } from "@/components/ui/use-toast"; // Ensure toast is imported
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Navbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const { logout, actors } = useContext(ActorContext); // Get the logout function and actors
  const [principalId, setPrincipalId] = useState(null);
  const navigate = useNavigate();
  const getCurrentPageName = () => {
    const path = location.pathname.split("/").pop();
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleLogout = async () => {
    await logout(); // Call the logout function
    navigate("/connect"); // Redirect to the Connect page after logout
  };

  const getPrincipalId = async () => {
    try {
      const principal = await actors.gamificationSystem.whoami();
      setPrincipalId(principal);
      await navigator.clipboard.writeText(principal);
      toast({
        title: "Principal ID Copied",
        description: "Your Principal ID has been copied to the clipboard.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error getting Principal ID:", error);
      toast({
        title: "Error",
        description: "Failed to get Principal ID. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <>
      <div className="sticky z-40 top-0 flex flex-col w-full">
        <header className="bg-background border-b border-muted">
          <div className="flex justify-between items-center py-4 px-6">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden" // Hidden on screens larger than lg
                onClick={toggleSidebar}
              >
                <Menu size={24} /> {/* Menu icon for mobile */}
              </button>
              <h1 className="text-xl font-bold">{getCurrentPageName()}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <div className="flex gap-2">
                <Button onClick={getPrincipalId}>Who Am I?</Button>

                <Button onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
        </header>
      </div>
    </>
  );
};

export default Navbar;
