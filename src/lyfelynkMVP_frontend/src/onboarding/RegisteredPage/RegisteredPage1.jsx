import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisteredContent1() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/Health-User/Home"); //For Demo only
    }, 5000); // 5000 milliseconds = 5 seconds

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <section className="px-6 flex justify-center items-center h-screen bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900">
      <div className="flex flex-col lg:flex-row h-1/2 md:w-1/2">
        <div className="flex-1 flex flex-col justify-center text-white p-4">
          <div className="flex items-center mb-4">
            <img alt="Logo" className="h-10 w-48" src="/assets/lyfelynk.png" />
          </div>
          <p className="text-xl md:text-2xl">Digitally Linking your health.</p>
        </div>

        <div className="flex-1 items-center max-w-md bg-background rounded-lg p-8">
          <div className="mx-auto w-full p-8 flex flex-col items-center justify-center h-full">
            <img
              src="/assets/checkmark.png"
              alt="checkmark"
              className="text-primary w-24 h-24"
            />
            <h2 className="mt-6 text-2xl text-center font-semibold">
              You have successfully registered!
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
