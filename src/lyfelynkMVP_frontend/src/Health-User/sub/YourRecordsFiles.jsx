import { useState, useMemo, useEffect, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Cpu,
  Folder,
  File,
  Image as LucideImageIcon,
  Search,
} from "lucide-react"; // Rename Lucide Image import
import ActorContext from "../../ActorContext"; // Import ActorContext
import LoadingScreen from "../../LoadingScreen"; // Import LoadingScreen

export default function Component() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const { actors } = useContext(ActorContext); // Use ActorContext
  const [loading, setLoading] = useState(true);

  // Function to get icon based on category
  const getIconByCategory = (category) => {
    switch (category) {
      case "Bills":
        return <File size={48} />; // Example icon for bills category
      case "GeneticData":
        return <Cpu size={48} />; // Example icon for genetic category
      case "MedicalImageData":
        return <LucideImageIcon size={48} />; // Use renamed LucideImageIcon as a component
      case "MedicalStatData":
        return <BarChart size={48} />; // Example icon for statistics category
      case "Reports":
        return <Folder size={48} />; // Example icon for reports category
      case "TrainingModels":
        return <Cpu size={48} />; // Example icon for training models category
      default:
        return <Folder size={48} />; // Default icon if category doesn't match
    }
  };

  useEffect(() => {
    const fetchUserDataAssets = async () => {
      try {
        const result = await actors.dataAsset.getUserDataAssets();
        if (result.ok) {
          const dataAssets = result.ok.map(([timestamp, asset]) => ({
            id: asset.assetID,
            category: asset.metadata.category, // Assuming type is part of metadata
            title: asset.title,
            description: asset.description,
            date: new Date(timestamp / 1000000).toISOString().split("T")[0], // Convert to date string
            format: asset.metadata.format,
            icon: getIconByCategory(asset.metadata.category), // Update to use a function to get image by category
          }));
          setRecords(dataAssets);
          console.log(dataAssets);
          setLoading(false);
        } else {
          console.error("Error fetching user data assets:", result.err);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data assets:", error);
        setLoading(false);
      }
    };

    fetchUserDataAssets();
  }, [actors]);

  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (activeTab !== "all") {
      filtered = filtered.filter((record) => record.category === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [activeTab, searchTerm, records]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full p-3 pl-10 mb-4 border border-gray-300 rounded-lg shadow-sm text-background bg-foreground focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute top-3 left-3 text-gray-500" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`py-2 px-4 flex items-center gap-2 rounded-lg transition ${
              activeTab === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setActiveTab("all")}
          >
            <Folder size={16} />
            All
          </button>
          <button
            className={`py-2 px-4 flex items-center gap-2 rounded-lg transition ${
              activeTab === "genetic"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setActiveTab("GeneticData")}
          >
            <Cpu size={16} />
            Genetic Data
          </button>
          <button
            className={`py-2 px-4 flex items-center gap-2 rounded-lg transition ${
              activeTab === "image"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setActiveTab("MedicalImageData")}
          >
            <LucideImageIcon size={16} />
            Medical Image Data
          </button>
          <button
            className={`py-2 px-4 flex items-center gap-2 rounded-lg transition ${
              activeTab === "statistics"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setActiveTab("MedicalStatData")}
          >
            <BarChart size={16} />
            Medical Statistics Data
          </button>
          <button
            className={`py-2 px-4 flex items-center gap-2 rounded-lg transition ${
              activeTab === "Reports"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setActiveTab("Reports")}
          >
            Reports
          </button>
          <button
            className={`py-2 px-4 flex items-center gap-2 rounded-lg transition ${
              activeTab === "model"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setActiveTab("model")}
          >
            <Cpu size={16} />
            Training Models
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredRecords.map((record) => (
          <Card
            key={record.id}
            className="shadow-lg rounded-lg overflow-hidden"
          >
            {getIconByCategory(record.category)}
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">{record.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{record.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{record.date}</span>
                <span>{record.format}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
