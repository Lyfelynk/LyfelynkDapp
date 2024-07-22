import {
  CarouselItem,
  CarouselContent,
  Carousel,
} from "@/components/ui/carousel";
import { HeartPulse } from "lucide-react";
import HealthAnalyticsOld from "../../Functions/healthanalyticsold";

export default function DashboardContent() {
  return (
    <div>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* <h1 className="text-4xl font-bold text-foreground">Dashboard</h1> */}
        <div class="w-fit bg-gradient-to-r from-slate-400 to-indigo-500 my-6 p-0.5 rounded-full ">
          <div class="text-4xl font-bold py-2 px-4 bg-background rounded-full">
            Dashboard
          </div>
        </div>

        <div className="py-6">
          <Carousel className="mx-auto">
            <CarouselContent>
              <CarouselItem>
                <img
                  alt="How to Create Health ID"
                  className="object-cover w-full h-full rounded-lg"
                  src="/assets/placeholder.jpeg"
                  style={{
                    aspectRatio: "1600/900",
                    objectFit: "cover",
                  }}
                />
              </CarouselItem>
              <CarouselItem>
                <img
                  alt="How to Create Health ID"
                  className="object-cover w-full h-full rounded-lg"
                  src="/assets/carousel2.png"
                  style={{
                    aspectRatio: "1600/900",
                    objectFit: "cover",
                  }}
                />
              </CarouselItem>
              <CarouselItem>
                <img
                  alt="How to Create Health ID"
                  className="object-cover w-full h-full rounded-lg"
                  src="/assets/carousel3.png"
                  style={{
                    aspectRatio: "1600/900",
                    objectFit: "cover",
                  }}
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>

        <section className="py-4">
          <div className="flex items-center space-x-2 pb-6">
            <HeartPulse className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-foreground">
              Health Analytics
            </h1>
          </div>
          <HealthAnalyticsOld/>
        </section>
      </div>
    </div>
  );
}
