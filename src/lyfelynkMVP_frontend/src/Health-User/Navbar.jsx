import React, { useState } from "react";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectButton, ConnectDialog } from "@connect2ic/react";
import "../connect2ic/connect2ic.css";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

const Navbar = ( { toggleSidebar }) => {
  const location = useLocation();

  const getCurrentPageName = () => {
    const path = location.pathname.split("/").pop();
    return path.charAt(0).toUpperCase() + path.slice(1);
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
              <div className="auth-section">
                <ConnectButton />
              </div>
              <ConnectDialog />
            </div>
          </div>
        </header>
      </div>
    </>
  );
};

export default Navbar;