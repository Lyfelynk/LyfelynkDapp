import React, { useState, useEffect, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Copy,
  Coins,
  Calendar,
  Clock,
  UserCheck,
  User,
  Briefcase,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import AvatarStatus from "./GamificationComponents/AvatarStatus";
import NFTCard from "./GamificationComponents/NFTCard";
import { INITIAL_HP } from "./GamificationComponents/constants";
import ActorContext from "../../ActorContext";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const Gamification = () => {
  const { actors } = useContext(ActorContext);
  const [userAvatars, setUserAvatars] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [visitDuration, setVisitDuration] = useState(30);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedAvatarForVisit, setSelectedAvatarForVisit] = useState(null);
  const [userTokens, setUserTokens] = useState(null);
  const [isAvatarStatusOpen, setIsAvatarStatusOpen] = useState(false);

  useEffect(() => {
    fetchUserAvatars();
    fetchProfessionals();
    fetchFacilities();
    fetchUserTokens();
  }, [actors]);

  const fetchUserAvatars = async () => {
    try {
      const avatars = await actors.gamificationSystem.getUserAvatarsSelf();

      if (!avatars.ok) {
        console.error("Error fetching user avatars:", avatars.err);
        return;
      }

      const formattedAvatars = await Promise.all(
        avatars.ok.map(async ([tokenId, metadata]) => {
          console.log("metadata", metadata);
          console.log("metadata[0]", metadata[0]);

          if (!Array.isArray(metadata[0]) || metadata[0].length < 4) {
            console.error("Invalid metadata structure:", metadata[0]);
            return null;
          }

          const [nameArray, descriptionArray, imageArray, attributesArray] =
            metadata[0];
          console.log("nameArray", nameArray);
          console.log("descriptionArray", descriptionArray);
          console.log("imageArray", imageArray);
          console.log("attributesArray", attributesArray);

          const getName = (arr) =>
            arr && arr[1] && arr[1].Text ? arr[1].Text : "Unknown";
          const getDescription = (arr) =>
            arr && arr[1] && arr[1].Text ? arr[1].Text : "No description";
          const getImage = (arr) =>
            arr && arr[1] && arr[1].Text ? arr[1].Text : "";
          const getAttributes = (arr) => {
            if (!arr || !arr[1] || !arr[1].Map) {
              console.error("Invalid attributes array:", arr);
              return {};
            }
            const attributesMap = arr[1].Map;
            return attributesMap.reduce((acc, [key, value]) => {
              if (value && value.Nat) {
                acc[key] = Number(value.Nat);
              } else if (value && value.Text) {
                acc[key] = value.Text;
              }
              return acc;
            }, {});
          };

          const name = getName(nameArray);
          const description = getDescription(descriptionArray);
          const image = getImage(imageArray);
          const attributes = getAttributes(attributesArray);
          console.log("attributes", attributes);

          // Fetch additional details
          const avatarAttributes =
            await actors.gamificationSystem.getAvatarAttributes(tokenId);
          console.log("avatarAttributes", avatarAttributes);
          const visitCount =
            await actors.visitManager.getAvatarVisitCount(tokenId);
          console.log("visitCount", visitCount);

          console.log({
            id: Number(tokenId),
            name,
            description,
            image,
            type: attributes.avatarType,
            quality: attributes.quality,
            level: attributes.level,
            energy: attributes.energy,
            focus: attributes.focus,
            vitality: attributes.vitality,
            resilience: attributes.resilience,
            hp: avatarAttributes.ok ? avatarAttributes.ok[1] : INITIAL_HP, // Use the HP from getAvatarAttributes

            visitCount: 0, //Number(visitCount),
          });
          return {
            id: Number(tokenId),
            name,
            description,
            image,
            type: attributes.avatarType,
            quality: attributes.quality,
            level: attributes.level,
            energy: attributes.energy,
            focus: attributes.focus,
            vitality: attributes.vitality,
            resilience: attributes.resilience,
            hp: avatarAttributes.ok
              ? Number(avatarAttributes.ok[1])
              : INITIAL_HP, // Use the HP from getAvatarAttributes
            visitCount: Number(visitCount),
          };
        }),
      );

      // Filter out any null values that might have been created due to invalid data
      const validAvatars = formattedAvatars.filter((avatar) => avatar !== null);
      setUserAvatars(validAvatars);
    } catch (error) {
      console.error("Error fetching user avatars:", error);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const result = await actors.visitManager.getAllProfessionals();
      setProfessionals(result); // Ensure result is in the expected format
    } catch (error) {
      console.error("Error fetching professionals:", error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const result = await actors.visitManager.getAllFacilities();
      setFacilities(result); // Ensure result is in the expected format
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  };

  const fetchAvailableSlots = async (idToVisit) => {
    try {
      const result = await actors.visitManager.getAvailableSlots(idToVisit);
      if (result.ok) {
        console.log("Available Slots for ID:", idToVisit);
        console.log("Slots:", result.ok);
        // Convert BigInt to Date (nanoseconds to milliseconds)
        const formattedSlots = result.ok.map((slot) => [
          new Date(Number(slot[0]) / 1_000_000), // Convert to milliseconds
          new Date(Number(slot[1]) / 1_000_000), // Convert to milliseconds
        ]);
        console.log("Formatted Slots:", formattedSlots);
        setAvailableSlots(formattedSlots);
      } else {
        console.error("Error fetching available slots:", result.err);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
    }
  };

  const initiateVisit = async (idToVisit) => {
    await fetchAvailableSlots(idToVisit); // Fetch slots before initiating visit
    try {
      const result = await actors.gamificationSystem.initiateVisit(
        idToVisit,
        visitDuration,
        selectedAvatarForVisit, // Pass selected avatar ID
      );
      if (result.ok) {
        toast({
          title: "Visit Initiated",
          description: "Your visit has been successfully booked.",
          duration: 3000,
        });
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Error initiating visit:", error);
      toast({
        title: "Error",
        description: "Failed to book the visit.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const levelUp = async () => {
    try {
      const result = await actors.gamificationSystem.levelUpAvatar(
        selectedAvatar.id,
      );
      console.log("result", result);
      if (result.ok) {
        const updatedAttributes =
          await actors.gamificationSystem.getAvatarAttributes(
            selectedAvatar.id,
          );
        setUserAvatars((prevAvatars) =>
          prevAvatars.map((avatar) =>
            avatar.id === selectedAvatar.id
              ? {
                  ...avatar,
                  ...updatedAttributes,
                  level: avatar.level + 1,
                  tokens: avatar.tokens - avatar.level * 100,
                  hp: INITIAL_HP + avatar.level * 10,
                }
              : avatar,
          ),
        );
        setSelectedAvatar((prevAvatar) => ({
          ...prevAvatar,
          ...updatedAttributes,
          level: prevAvatar.level + 1,
          tokens: prevAvatar.tokens - prevAvatar.level * 100,
          hp: INITIAL_HP + prevAvatar.level * 10,
        }));
      }
    } catch (error) {
      console.error("Error leveling up avatar:", error);
    }
  };

  const restoreHP = async (amount) => {
    try {
      await actors.gamificationSystem.restoreHP(
        Number(selectedAvatar.id),
        Number(amount),
      );
      setUserAvatars((prevAvatars) =>
        prevAvatars.map((avatar) =>
          avatar.id === selectedAvatar.id
            ? {
                ...avatar,
                hp: Math.min(
                  avatar.hp + amount,
                  INITIAL_HP + (avatar.level - 1) * 10,
                ),
                tokens: avatar.tokens - amount,
              }
            : avatar,
        ),
      );
      setSelectedAvatar((prevAvatar) => ({
        ...prevAvatar,
        hp: Math.min(
          prevAvatar.hp + amount,
          INITIAL_HP + (prevAvatar.level - 1) * 10,
        ),
        tokens: prevAvatar.tokens - amount,
      }));
    } catch (error) {
      console.error("Error restoring HP:", error);
    }
  };

  const manageAvatar = (avatar) => {
    console.log("avatar", avatar);
    setSelectedAvatar(avatar);
  };

  const transferAvatar = async (avatarId, principalAddress) => {
    try {
      const result = await actors.gamificationSystem.transferAvatar(
        avatarId,
        principalAddress,
      );
      console.log("result", result);
      // After successful transfer, update the user avatars
      await fetchUserAvatars();
      toast({
        title: "Avatar Transferred",
        description: "The avatar has been successfully transferred.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error transferring avatar:", error);
      toast({
        title: "Transfer Failed",
        description: "Failed to transfer the avatar. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    }
  };

  const handleProfessionalSelect = async (prof) => {
    setSelectedProfessional(prof);
    await fetchAvailableSlots(prof.id); // Fetch slots when a professional is selected
  };

  const fetchUserTokens = async () => {
    try {
      const result = await actors.gamificationSystem.getUserTokens();
      if (result.ok) {
        setUserTokens(Number(result.ok[0]) || 0);
      } else {
        console.error("Error fetching user tokens:", result.err);
      }
    } catch (error) {
      console.error("Error fetching user tokens:", error);
    }
  };

  const TokenDisplay = () => (
    <div className="flex items-center space-x-2 mb-4">
      <div className="bg-gradient-to-r from-blue-400 to-blue-200 text-black font-bold py-2 px-4 rounded-full flex items-center">
        <Coins className="mr-2" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
          {userTokens}
          <span className="text-lg font-semibold"> Tokens</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-foreground mb-6">
        Wellness Avatar Platform
      </h1>

      <span className="flex justify-end">
        {userTokens !== null && <TokenDisplay />}
      </span>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="avatars" className="mb-6">
            <TabsList className="flex justify-center bg-gray-800 text-white rounded-lg">
              <TabsTrigger
                value="avatars"
                className="w-1/3 flex items-center justify-center gap-2 text-white"
              >
                <User size={18} /> Avatars
              </TabsTrigger>
              <TabsTrigger
                value="professionals"
                className="w-1/3 flex items-center justify-center gap-2 text-white"
              >
                <Briefcase size={18} /> Professionals
              </TabsTrigger>
              <TabsTrigger
                value="facilities"
                className="w-1/3 flex items-center justify-center gap-2 text-white"
              >
                <Building size={18} /> Facilities
              </TabsTrigger>
            </TabsList>
            <TabsContent value="avatars">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                User Avatars
              </h2>
              {userAvatars.length === 0 ? (
                <p className="text-gray-400">
                  No Avatars. Visit Professionals and Facilities to find
                  Avatars.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userAvatars.map((avatar) => (
                    <NFTCard
                      key={avatar.id}
                      nft={avatar}
                      showManage={true}
                      onManage={() => {
                        setSelectedAvatar(avatar);
                        setIsAvatarStatusOpen(true);
                      }}
                      onTransfer={transferAvatar}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="professionals">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                Available Professionals
              </h2>

              <div className="my-6">
                <h1 className="text-lg font-bold">
                  Select an Avatar for Visit
                </h1>
                <Select
                  onValueChange={setSelectedAvatarForVisit}
                  value={selectedAvatarForVisit}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue
                      placeholder="Select Avatar for Visit"
                      className="text-white"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {userAvatars.map((avatar) => (
                      <SelectItem key={avatar.id} value={Number(avatar.id)}>
                        {avatar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professionals.map((prof) => (
                  <Card key={prof.id}>
                    <CardHeader>
                      <CardTitle>{prof.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="flex items-center mb-2">
                        <UserCheck className="mr-2" size={18} />
                        Specialization: {prof.specialization}
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleProfessionalSelect(prof)}
                          >
                            View Available Slots
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>
                              Available Slots for {prof.name}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                            {availableSlots.length > 0 ? (
                              availableSlots.map((slot, index) => (
                                <Card key={index} className="mb-4">
                                  <CardContent className="pt-4">
                                    <p className="flex items-center mb-2">
                                      <Calendar className="mr-2" size={18} />
                                      {slot[0].toLocaleDateString()}
                                    </p>
                                    <p className="flex items-center mb-2">
                                      <Clock className="mr-2" size={18} />
                                      {slot[0].toLocaleTimeString()} -{" "}
                                      {slot[1].toLocaleTimeString()}
                                    </p>
                                    <Button
                                      onClick={() => initiateVisit(prof.id)}
                                    >
                                      Book Visit
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <p>No available slots for booking.</p>
                            )}
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="facilities">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                Available Facilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilities.map((facility) => (
                  <div key={facility.id} className="border p-4 rounded">
                    <h3 className="text-lg font-semibold">{facility.name}</h3>
                    <p>Type: {facility.facilityType}</p>
                    <Button
                      onClick={() => {
                        setSelectedFacility(facility.id);
                        initiateVisit(facility.id);
                      }}
                    >
                      Book Visit
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isAvatarStatusOpen} onOpenChange={setIsAvatarStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avatar Status</DialogTitle>
          </DialogHeader>
          {selectedAvatar && (
            <>
              <AvatarStatus
                avatar={selectedAvatar}
                onLevelUp={levelUp}
                onRestoreHP={restoreHP}
                userTokens={userTokens}
              />
              {selectedAvatar.hp <= 20 && (
                <div className="mt-4 p-4 bg-yellow-900 text-yellow-200 rounded-md flex items-center">
                  <AlertCircle className="mr-2" />
                  <p>
                    Warning: Your HP is low! Consider restoring it to maintain
                    optimal performance.
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gamification;
