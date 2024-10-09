import React, { useState, useEffect, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Copy } from "lucide-react";
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
} from "@/components/ui/select"; // Import Select component

const Gamification = () => {
  const { actors } = useContext(ActorContext);
  const [userAvatars, setUserAvatars] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [pendingVisit, setPendingVisit] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [principalId, setPrincipalId] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [visitDuration, setVisitDuration] = useState(30);
  const [availableSlots, setAvailableSlots] = useState([]); // New state for available slots
  const [selectedAvatarForVisit, setSelectedAvatarForVisit] = useState(null); // New state for selected avatar for visit
  const [userTokens, setUserTokens] = useState(null);

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
        })
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
        selectedAvatarForVisit // Pass selected avatar ID
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
        Number(amount)
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
        principalAddress
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

  const getPrincipalId = async () => {
    try {
      const principal = await actors.gamificationSystem.whoami();
      setPrincipalId(principal);
      await navigator.clipboard.writeText(principal);
      toast({
        title: "Principal ID Copied",
        description: "Your Principal ID has been copied to the clipboard.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error getting Principal ID:", error);
      toast({
        title: "Error",
        description: "Failed to get Principal ID. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
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

  return (
    <div className="p-4 container mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
        Wellness Avatar Platform
      </h1>
      {userTokens !== null && (
        <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
          Your Tokens: {userTokens}
        </h2>
      )}
      <Button
        onClick={getPrincipalId}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center"
      >
        <Copy className="mr-2 h-4 w-4" /> Who am I?
      </Button>
      {principalId && (
        <p className="mb-4 text-sm text-gray-400">
          Your Principal ID: {principalId}
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="avatars" className="mb-6">
            <TabsList className="bg-gray-800 text-white rounded-lg">
              <TabsTrigger value="avatars" className="text-white">
                Avatars
              </TabsTrigger>
              <TabsTrigger value="professionals" className="text-white">
                Professionals
              </TabsTrigger>
              <TabsTrigger value="facilities" className="text-white">
                Facilities
              </TabsTrigger>
            </TabsList>
            <TabsContent value="avatars">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
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
                      onManage={manageAvatar}
                      onTransfer={transferAvatar}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="professionals">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                Available Professionals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="border p-4 rounded"
                  >
                    <h3 className="text-lg font-semibold">{prof.name}</h3>
                    <p>Specialization: {prof.specialization}</p>
                    <Button onClick={() => handleProfessionalSelect(prof)}>
                      View Available Slots
                    </Button>
                  </div>
                ))}
              </div>
              {selectedProfessional && (
                <div>
                  <h3 className="text-lg font-semibold mt-4">
                    Available Slots for {selectedProfessional.name}
                  </h3>
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="border p-4 rounded"
                      >
                        <p>
                          Available Slot: {slot[0].toLocaleString()} -{" "}
                          {slot[1].toLocaleString()}
                        </p>
                        <Button
                          onClick={() => initiateVisit(selectedProfessional.id)}
                        >
                          Book Visit
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p>No available slots for booking.</p>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="facilities">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                Available Facilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilities.map((facility) => (
                  <div
                    key={facility.id}
                    className="border p-4 rounded"
                  >
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
        <div>
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
        </div>
      </div>
      <Select
        onValueChange={setSelectedAvatarForVisit}
        value={selectedAvatarForVisit}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Avatar" />
        </SelectTrigger>
        <SelectContent>
          {userAvatars.map((avatar) => (
            <SelectItem
              key={avatar.id}
              value={Number(avatar.id)}
            >
              {avatar.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Gamification;
