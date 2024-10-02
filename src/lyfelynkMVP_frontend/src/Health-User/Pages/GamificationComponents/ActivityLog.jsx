import React from "react";

const ActivityLog = ({ log }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 text-white p-4 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-400">Activity Log</h2>
      <ul className="space-y-2">
        {log.map((activity, index) => (
          <li key={index} className="text-sm">
            {activity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLog;
