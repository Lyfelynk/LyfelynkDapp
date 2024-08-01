import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConnectButton, ConnectDialog } from "@connect2ic/react";
import { useCanister } from "@connect2ic/react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import LoadingScreen from "../LoadingScreen";
import OnboardingBanner from "../OnboardingBanner";
import { ChevronRight, User, BriefcaseMedical, Building } from "lucide-react";

export default function FirstPageContent() {
  const navigate = useNavigate();

  const [registrationStatus, setRegistrationStatus] = useState();
  const [lyfelynkMVP_backend] = useCanister("lyfelynkMVP_backend");
  const [isLoading, setIsLoading] = useState(true);
  const [isCalled, setIsCalled] = useState(true);

  const checkRegistration = (type) => {
    if (registrationStatus === "User") {
      navigate("/Health-User/Home");
    } else if (registrationStatus === "Professional") {
      navigate("/Health-Professional/Home");
    } else if (registrationStatus === "Facility") {
      navigate("/Health-Service/Home");
    } else {
      navigate(`/Register/${type}`);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const updateRegistrationStatus = async () => {
      try {
        const result = await lyfelynkMVP_backend.isRegistered();
        console.log(result);
        setIsCalled(!isCalled);
        setRegistrationStatus(result);
      } catch (error) {
        toast({
          title: "Alert!",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    updateRegistrationStatus();
  }, [lyfelynkMVP_backend]);

  useEffect(() => {
    setIsLoading(false);
  }, [isCalled]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <section className="bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900">
      <OnboardingBanner />
      <div className="px-6 flex justify-center items-center h-screen">
        <div className="flex flex-col md:flex-row md:w-1/2">
          <div className="flex-1 flex flex-col justify-center text-white p-4">
            <div className="flex items-center mb-4">
              <img alt="Logo" className="h-10 w-48" src="assets/lyfelynk.png" />
            </div>
            <p className="text-xl md:text-2xl">
              Digitally Linking your health.
            </p>
          </div>

          <div className="flex-1 items-center max-w-md bg-white rounded-lg p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-black">
                Get Started
              </h2>
              <div className="auth-section">
                <ConnectButton />
              </div>
              <ConnectDialog />
            </div>
            <p className="text-sm text-gray-500 mb-4">Login/Register As</p>
            <div>
              <Button
                className="flex justify-between items-center w-full border border-gray-300 p-3 rounded-md mb-2"
                variant="secondary"
                onClick={() => checkRegistration("Health-User")}
              >
                <div className="flex items-center">
                  <User className="text-primary" />
                  <span className="ml-2 font-bold">Health User</span>
                </div>
                <ChevronRight />
              </Button>

              <Button
                className="flex justify-between items-center w-full border border-gray-300 p-3 rounded-md mb-2"
                variant="secondary"
                onClick={() => checkRegistration("Health-Professional")}
              >
                <div className="flex items-center">
                  <BriefcaseMedical className="text-primary" />
                  <span className="ml-2 font-bold">Health Professional</span>
                </div>
                <ChevronRight />
              </Button>

              <Button
                className="flex justify-between items-center w-full border border-gray-300 p-3 rounded-md mb-2"
                variant="secondary"
                onClick={() => checkRegistration("Health-Service")}
              >
                <div className="flex items-center">
                  <Building className="text-primary" />
                  <span className="ml-2 font-bold">Health Service</span>
                </div>
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
