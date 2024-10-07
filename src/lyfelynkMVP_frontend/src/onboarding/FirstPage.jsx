import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import OnboardingBanner from "../OnboardingBanner";
import {
  ChevronRight,
  User,
  BriefcaseMedical,
  Building,
  UserPlus,
} from "lucide-react";
import ActorContext from "../ActorContext";

export default function FirstPageContent() {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(ActorContext);

  const checkRegistration = async (type) => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }
    navigate(`/Register/${type}`);
  };

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
            </div>
            <p className="text-sm text-gray-500 mb-4">Login/Register As</p>
            <div>
              <Button
                className="flex justify-between items-center w-full border border-gray-300 p-3 rounded-md mb-2"
                variant="secondary"
                onClick={() => checkRegistration("Abha-Id")}
              >
                <div className="flex items-center">
                  <UserPlus className="text-primary" /> 
                  <span className="ml-2 font-bold">Register with Abha </span>
                </div>
                <ChevronRight />
              </Button>
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
