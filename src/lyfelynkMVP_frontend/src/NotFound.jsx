import React from "react";

export default function NotFound() {
  return (
    <section className="px-6 flex justify-center items-center h-screen bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900">
      <div>
        <h1 className="text-8xl font-bold text-white">404</h1>
        <p className="text-white">
          The page you are looking for does not exist.
        </p>
      </div>
    </section>
  );
}
