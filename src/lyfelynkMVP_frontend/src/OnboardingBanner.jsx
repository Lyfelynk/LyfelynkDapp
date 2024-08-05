import { TriangleAlert } from "lucide-react";

export default function OnboardingBanner() {
  return (
    <div className="absolute top-0 w-full flex justify-center items-center bg-primary py-2 px-4 text-center">
      <TriangleAlert className="text-white mr-2" />
      <p className="text-left text-white text-xs md:text-base md:font-medium">
        Connect your Wallet prior to Sign Up/Login In.
      </p>
    </div>
  );
}
