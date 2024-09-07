import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import OnboardingBanner from "../OnboardingBanner";
import ActorContext from "../ActorContext";
import LoadingScreen from "../LoadingScreen";

export default function ConnectPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [c, setc] = useState(false);

  const navigate = useNavigate();
  const { actors, isAuthenticated, login } = useContext(ActorContext);

  useEffect(() => {
    const checkRegistration = async () => {
      if (isAuthenticated && actors.identityManager) {
        setIsLoading(true);
        try {
          let resultOfRegistration =
            await actors.identityManager.checkRegistration();
          if (resultOfRegistration.ok) {
            navigate(`/Health-${resultOfRegistration.ok}/Home`);
          } else {
            navigate(`/Register`);
          }
          // Your navigation logic here based on the registration status and type
        } catch (error) {
          setIsLoading(false);
          console.error("Error checking registration:", error);
          toast({
            title: "Error",
            description: "Failed to check registration status",
            variant: "destructive",
          });
        }
      }
    };
    checkRegistration();
  }, [isAuthenticated, actors.identityManager]);

  const handleConnectClick = async () => {
    setIsLoading(true);
    try {
      login();
      // The useEffect will handle the rest
    } catch (error) {
      console.error("Error during signing process:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }
  return (
    <section className="bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900 h-screen flex justify-center items-center">
      <OnboardingBanner />
      <div className="px-6 flex justify-center items-center h-screen">
        <div className="flex flex-col md:flex-row w-full max-w-3xl">
          <div className="flex-1 flex flex-col justify-center text-white p-4">
            <div className="flex items-center mb-4">
              <img alt="Logo" className="h-10 w-48" src="assets/lyfelynk.png" />
            </div>
            <p className="text-xl md:text-2xl">
              Digitally Linking your health.
            </p>
          </div>

          <div className="flex-1 items-center bg-foreground rounded-lg p-8 py-12 shadow-lg relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-400 to-gray-500 rounded-t-lg"></div>
            <h2 className="text-xl md:text-2xl font-bold text-black mb-4">
              Connect Your Wallet
            </h2>
            <Button
              className="w-full border border-gray-300 p-3 rounded-md"
              onClick={handleConnectClick}
            >
              Connect
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
