import React from "react";

export default function NotFoundPage() {
  return (
    <section className="px-6 py-10 flex items-center justify-center">
      <div>
        <h1 className="text-8xl font-bold text-primar text-center"> 404 </h1>
        <p className="text-primary">
          The page you are looking for does not exist.
        </p>
      </div>
    </section>
  );
}
