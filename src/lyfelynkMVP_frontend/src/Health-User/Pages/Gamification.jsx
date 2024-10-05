import React, { useState, useEffect, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import AvatarStatus from "./GamificationComponents/AvatarStatus";
import NFTCard from "./GamificationComponents/NFTCard";
import GemMarketplace from "./GamificationComponents/GemMarketplace";
import {
  INITIAL_HP,
  ACTIVITY_REWARDS,
  PROFESSIONAL_TYPES,
  FACILITY_TYPES,
  generateNFT,
} from "./GamificationComponents/constants";
import ActorContext from "../../ActorContext";

const Gamification = () => {
  const { actors } = useContext(ActorContext);
  const [userAvatars, setUserAvatars] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [pendingVisit, setPendingVisit] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [principalId, setPrincipalId] = useState(null);

  useEffect(() => {
    fetchUserAvatars();
    setProfessionals([
      generateNFT("professional", PROFESSIONAL_TYPES),
      generateNFT("professional", PROFESSIONAL_TYPES),
      generateNFT("professional", PROFESSIONAL_TYPES),
    ]);
    setFacilities([
      generateNFT("facility", FACILITY_TYPES),
      generateNFT("facility", FACILITY_TYPES),
      generateNFT("facility", FACILITY_TYPES),
    ]);
  }, [actors]);

  const fetchUserAvatars = async () => {
    try {
      const avatars = await actors.gamificationSystem.getUserAvatarsSelf();

      const formattedAvatars = avatars.map(([tokenId, metadata]) => {
        console.log("metadata", metadata);
        console.log("metadata[0]", metadata[0]);
        const [nameArray, descriptionArray, attributesArray] = metadata[0];
        console.log("nameArray", nameArray);
        console.log("descriptionArray", descriptionArray);
        console.log("attributesArray", attributesArray);
        const getName = (arr) => arr[1].Text;
        const getDescription = (arr) => arr[1].Text;
        const getAttributes = (arr) => {
          const attributesMap = arr[1].Map;
          return attributesMap.reduce((acc, [key, value]) => {
            if ("Nat" in value) {
              acc[key] = BigInt(value.Nat).toString();
            } else if ("Text" in value) {
              acc[key] = value.Text;
            }
            return acc;
          }, {});
        };

        const name = getName(nameArray);
        const description = getDescription(descriptionArray);
        const attributes = getAttributes(attributesArray);
        console.log("attributes", attributes);
        console.log({
          id: tokenId,
          name,
          description,
          type: attributes.avatarType,
          quality: attributes.quality,
          level: Number(attributes.level),

          energy: Number(attributes.energy),
          focus: Number(attributes.focus),
          vitality: Number(attributes.vitality),
          resilience: Number(attributes.resilience),
          hp: INITIAL_HP,
          tokens: 0,
          gems: 0,
          visitCount: 0,
        });
        return {
          id: Number(tokenId),
          name,
          description,
          type: attributes.avatarType,
          quality: attributes.quality,
          level: Number(attributes.level),
          energy: Number(attributes.energy),
          focus: Number(attributes.focus),
          vitality: Number(attributes.vitality),
          resilience: Number(attributes.resilience),
          hp: INITIAL_HP,
          tokens: 0,
          gems: 0,
          visitCount: 0,
        };
      });
      setUserAvatars(formattedAvatars);
    } catch (error) {
      console.error("Error fetching user avatars:", error);
    }
  };

  const performActivity = async (activity, nft) => {
    try {
      await actors.gamificationSystem.depleteHP(nft.id.toString(), 10);
      await actors.gamificationSystem.earnTokens(nft.id.toString(), 10);
      const updatedAttributes =
        await actors.gamificationSystem.getAvatarAttributes(nft.id);

      setUserAvatars((prevAvatars) => {
        return prevAvatars.map((avatar) => {
          if (avatar.id === nft.id) {
            return {
              ...avatar,
              ...updatedAttributes,
              tokens: avatar.tokens + 10,
              hp: Math.max(avatar.hp - 10, 0),
              visitCount: avatar.visitCount + 1,
            };
          }
          return avatar;
        });
      });

    } catch (error) {
      console.error("Error performing activity:", error);
    }
  };

  const levelUp = async () => {
    try {
      const result = await actors.gamificationSystem.levelUpAvatar(
        selectedAvatar.id
      );
      if (result.ok) {
        const updatedAttributes =
          await actors.gamificationSystem.getAvatarAttributes(
            selectedAvatar.id
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
              : avatar
          )
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
        selectedAvatar.id.toString(),
        amount
      );
      await actors.gamificationSystem.spendTokens(
        selectedAvatar.id.toString(),
        amount
      );

      setUserAvatars((prevAvatars) =>
        prevAvatars.map((avatar) =>
          avatar.id === selectedAvatar.id
            ? {
                ...avatar,
                hp: Math.min(
                  avatar.hp + amount,
                  INITIAL_HP + (avatar.level - 1) * 10
                ),
                tokens: avatar.tokens - amount,
              }
            : avatar
        )
      );
      setSelectedAvatar((prevAvatar) => ({
        ...prevAvatar,
        hp: Math.min(
          prevAvatar.hp + amount,
          INITIAL_HP + (prevAvatar.level - 1) * 10
        ),
        tokens: prevAvatar.tokens - amount,
      }));
    } catch (error) {
      console.error("Error restoring HP:", error);
    }
  };

  const buyGem = async () => {
    if (selectedAvatar.tokens >= 16) {
      try {
        await actors.gamificationSystem.spendTokens(
          selectedAvatar.id.toString(),
          16
        );
        setUserAvatars((prevAvatars) =>
          prevAvatars.map((avatar) =>
            avatar.id === selectedAvatar.id
              ? {
                  ...avatar,
                  tokens: avatar.tokens - 16,
                  gems: avatar.gems + 1,
                }
              : avatar
          )
        );
        setSelectedAvatar((prevAvatar) => ({
          ...prevAvatar,
          tokens: prevAvatar.tokens - 16,
          gems: prevAvatar.gems + 1,
        }));
      } catch (error) {
        console.error("Error buying gem:", error);
      }
    }
  };

  const useGem = async (attribute) => {
    if (selectedAvatar.gems > 0) {
      try {
        const result = await actors.gamificationSystem.levelUpAvatar(
          selectedAvatar.id
        );
        if (result.ok) {
          const updatedAttributes =
            await actors.gamificationSystem.getAvatarAttributes(
              selectedAvatar.id
            );
          setUserAvatars((prevAvatars) =>
            prevAvatars.map((avatar) =>
              avatar.id === selectedAvatar.id
                ? {
                    ...avatar,
                    ...updatedAttributes,
                    gems: avatar.gems - 1,
                  }
                : avatar
            )
          );
          setSelectedAvatar((prevAvatar) => ({
            ...prevAvatar,
            ...updatedAttributes,
            gems: prevAvatar.gems - 1,
          }));
        }
      } catch (error) {
        console.error("Error using gem:", error);
      }
    }
  };

  const visitProfessional = async (nft) => {
    setPendingVisit(nft);
    try {
      const result = await actors.gamificationSystem.mintWellnessAvatar(
        null,
        "Professional"
      );
      if (result[0].Ok) {
        await fetchUserAvatars();
      }
    } catch (error) {
      console.error("Error visiting professional:", error);
    } finally {
      setPendingVisit(null);
    }
  };

  const visitFacility = async (nft) => {
    setPendingVisit(nft);
    try {
      const result = await actors.gamificationSystem.mintWellnessAvatar(
        null,
        "Facility"
      );
      if (result[0].Ok) {
        await fetchUserAvatars();

      }
    } catch (error) {
      console.error("Error visiting facility:", error);
    } finally {
      setPendingVisit(null);
    }
  };

  const manageAvatar = (avatar) => {
    console.log("avatar", avatar);
    setSelectedAvatar(avatar);
  };

  const transferAvatar = async (avatarId, principalAddress) => {
    try {
      // Implement the logic to transfer the avatar using your actor
      // For example:
      // await actors.gamificationSystem.transferAvatar(avatarId, principalAddress);
      
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

  return (
    <div className="p-4 container mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
        Wellness Avatar Platform
      </h1>
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
          <Tabs
            defaultValue="avatars"
            className="mb-6"
          >
            <TabsList className="bg-gray-800 text-white rounded-lg">
              <TabsTrigger
                value="avatars"
                className="text-white"
              >
                Avatars
              </TabsTrigger>
              <TabsTrigger
                value="professionals"
                className="text-white"
              >
                Professionals
              </TabsTrigger>
              <TabsTrigger
                value="facilities"
                className="text-white"
              >
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
                  <NFTCard
                    key={prof.id}
                    nft={prof}
                    onVisit={visitProfessional}
                    isPending={pendingVisit && pendingVisit.id === prof.id}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="facilities">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                Available Facilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilities.map((facility) => (
                  <NFTCard
                    key={facility.id}
                    nft={facility}
                    onVisit={visitFacility}
                    isPending={pendingVisit && pendingVisit.id === facility.id}
                  />
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
              />
              <GemMarketplace
                gems={selectedAvatar.gems}
                tokens={selectedAvatar.tokens}
                onBuyGem={buyGem}
                onUseGem={useGem}
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
    </div>
  );
};

export default Gamification;
