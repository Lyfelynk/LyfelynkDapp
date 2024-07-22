import { TriangleAlert } from "lucide-react";

export default function AppBanner() {
  return (
    <div className="sticky z-40 top-[74px] flex justify-center items-center bg-primary py-2 px-4 text-center">
      <TriangleAlert className="text-white mr-2" />
      <p className="text-left text-white text-xs md:text-base md:font-medium">
        This is a minimum viable product in beta testing mode. Kindly refrain from uploading
        your personal data!
      </p>
    </div>
  );
}
