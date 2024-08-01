import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import DashboardContent from "./Pages/Dashboard";
import MarketplaceContent from "./Pages/Marketplace";
import ProfileContent from "./Pages/Profile";
import UploadContent from "./Pages/UploadPage";
import Records from "../Health-Professional/Pages/Records";

import NotFoundPage from "./NotFoundPage";
import AppBanner from "../AppBanner";

export default function AppRoute1() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-auto">
        <Navbar toggleSidebar={toggleSidebar} />
        <AppBanner />
        <div className="relative flex-1">
          <div className="circlePosition w-11/12 h-11/12 bg-[#367ed142] rounded-full absolute -z-10 blur-[100px] flex justify-center items-center">
            <div className="circle w-[17rem] h-[17rem] bg-[#5743ee42] rounded-full" />
          </div>
          <Routes>
            <Route path="/Home" element={<DashboardContent />} />
            <Route path="/Records" element={<Records />} />
            <Route path="/Upload" element={<UploadContent />} />
            <Route path="/Marketplace" element={<MarketplaceContent />} />
            <Route path="/Profile" element={<ProfileContent />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
