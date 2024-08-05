import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BookText,
  Heart,
  LayoutDashboard,
  ShoppingCart,
  User,
  ChevronLeft,
  ChevronRight,
  Share,
  Upload,
  Forward,
  Gamepad,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const links = [
    { to: "/Health-User/Home", icon: <LayoutDashboard />, text: "Dashboard" },
    { to: "/Health-User/Records", icon: <BookText />, text: "Records" },
    { to: "/Health-User/Upload", icon: <Upload />, text: "Upload" },
    { to: "/Health-User/Analytics", icon: <Heart />, text: "Analytics" },
    {
      to: "/Health-User/Marketplace",
      icon: <ShoppingCart />,
      text: "Marketplace",
    },
    { to: "/Health-User/Gamification", icon: <Gamepad />, text: "Gamification" },
    { to: "/Health-User/Profile", icon: <User />, text: "Profile" },
  ];

  return (
    <aside
      className={`bg-background z-50 h-full transition-transform duration-300 ease-in-out
        ${isExpanded ? "w-64" : "w-20"} 
        ${isOpen ? "fixed inset-y-0 left-0 z-50 bg-gray-50 dark:bg-gray-900 border-r" : "lg:relative"}
        ${isOpen || !isExpanded ? "" : "hidden lg:block"}`} // Hide on small screens if not open
    >
      <div className="h-full flex flex-col items-center px-3 py-4 overflow-y-auto transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-center w-full mb-5">
          {isExpanded && (
            <img
              alt="Logo"
              className="h-8 transition-opacity duration-300 ease-in-out"
              src="/assets/lyfelynk.png"
            />
          )}
          <button
            onClick={toggleSidebar}
            className={`text-gray-900 dark:text-white focus:outline-none transition-transform duration-300 ease-in-out ${
              isExpanded ? "ml-auto" : ""
            }`}
          >
            {isExpanded ? (
              <ChevronLeft size="32" className="border p-1 rounded-lg" />
            ) : (
              <ChevronRight size="32" className="border p-1 rounded-lg" />
            )}
          </button>
        </div>
        <ul className="space-y-2 font-medium w-full">
          {links.map((link, index) => (
            <li key={index} className="relative group w-full">
              <NavLink
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center ${isExpanded ? "justify-start" : "justify-center"} p-2 text-gray-900 rounded-lg dark:text-white transition-all duration-300 ease-in-out hover:bg-blue-100 dark:hover:bg-blue-900 ${
                    isActive ? "bg-blue-400 dark:bg-blue-700" : ""
                  }`
                }
              >
                <span>{link.icon}</span>
                <span
                  className={`ml-3 transition-all duration-300 ease-in-out ${isExpanded ? "block" : "hidden"}`}
                >
                  {link.text}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
