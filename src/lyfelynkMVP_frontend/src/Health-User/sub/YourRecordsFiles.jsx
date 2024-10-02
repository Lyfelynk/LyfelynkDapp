import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Cpu, Folder, Image, Search } from "lucide-react";

export default function Component() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const records = [
    {
      id: 2,
      type: "image",
      title: "Brain MRI Scan",
      description: "High-resolution medical image data",
      date: "2024-09-04",
      format: "DICOM",
      image: "/brain.jpeg",
    },
    {
      id: 4,
      type: "model",
      title: "Tumor Detection Model",
      description: "AI-powered medical diagnosis tool",
      date: "2023-11-12",
      format: "TensorFlow",
      image: "/tumor.jpg",
    },
    {
      id: 6,
      type: "image",
      title: "Chest X-Ray Scans",
      description: "High-quality medical imaging data",
      date: "2024-08-27",
      format: "DICOM",
      image: "/chest.jpeg",
    },
    {
      id: 8,
      type: "model",
      title: "Diabetes Prediction Model",
      description: "AI-powered medical diagnosis tool",
      date: "2023-12-01",
      format: "TensorFlow",
      image: "/diabetes.jpeg",
    },
  ];

  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (activeTab !== "all") {
      filtered = filtered.filter((record) => record.type === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered;
  }, [activeTab, searchTerm, records]);

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
            onClick={() => setActiveTab("genetic")}
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
            onClick={() => setActiveTab("image")}
          >
            <Image size={16} />
            Medical Image Data
          </button>
          <button
            className={`py-2 px-4 flex items-center gap-2 rounded-lg transition ${
              activeTab === "statistics"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setActiveTab("statistics")}
          >
            <BarChart size={16} />
            Medical Statistics Data
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
            <img
              src={record.image}
              alt={record.title}
              className="object-cover w-full h-48"
              style={{ aspectRatio: "400/300" }}
            />
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
