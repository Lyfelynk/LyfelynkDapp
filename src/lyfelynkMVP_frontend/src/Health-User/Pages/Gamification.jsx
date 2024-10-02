import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import AvatarStatus from "./GamificationComponents/AvatarStatus"
import NFTCard from "./GamificationComponents/NFTCard";
import ActivityLog from "./GamificationComponents/ActivityLog";
import GemMarketplace from "./GamificationComponents/GemMarketplace";
import {
  INITIAL_HP,
  ACTIVITY_REWARDS,
  PROFESSIONAL_TYPES,
  FACILITY_TYPES,
  generateNFT,
} from "./GamificationComponents/constants";

const Gamification = () => {
  const [userAvatars, setUserAvatars] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [pendingVisit, setPendingVisit] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
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
  }, []);

  const performActivity = (activity, nft) => {
    setUserAvatars((prevAvatars) => {
      const updatedAvatars = prevAvatars.map((avatar) => {
        if (avatar.id === nft.id) {
          const { primaryAttribute, reward } = ACTIVITY_REWARDS[activity];
          const updatedAttributes = {
            ...avatar.attributes,
            [primaryAttribute]: avatar.attributes[primaryAttribute] + reward,
          };

          return {
            ...avatar,
            attributes: updatedAttributes,
            tokens: avatar.tokens + 10,
            hp: Math.max(avatar.hp - 10, 0),
            visitCount: avatar.visitCount + 1,
          };
        }
        return avatar;
      });

      return updatedAvatars;
    });

    setActivityLog((prevLog) => [
      ...prevLog,
      `Completed ${activity} activity with ${nft.type}`,
    ]);
  };

  const levelUp = () => {
    setUserAvatars((prevAvatars) => 
      prevAvatars.map((avatar) => 
        avatar.id === selectedAvatar.id
          ? {
              ...avatar,
              level: avatar.level + 1,
              tokens: avatar.tokens - (avatar.level * 100),
              hp: INITIAL_HP + (avatar.level * 10),
            }
          : avatar
      )
    );
    setSelectedAvatar((prevAvatar) => ({
      ...prevAvatar,
      level: prevAvatar.level + 1,
      tokens: prevAvatar.tokens - (prevAvatar.level * 100),
      hp: INITIAL_HP + (prevAvatar.level * 10),
    }));
  };

  const restoreHP = (amount) => {
    setUserAvatars((prevAvatars) => 
      prevAvatars.map((avatar) => 
        avatar.id === selectedAvatar.id
          ? {
              ...avatar,
              hp: Math.min(avatar.hp + amount, INITIAL_HP + (avatar.level - 1) * 10),
              tokens: avatar.tokens - amount,
            }
          : avatar
      )
    );
    setSelectedAvatar((prevAvatar) => ({
      ...prevAvatar,
      hp: Math.min(prevAvatar.hp + amount, INITIAL_HP + (prevAvatar.level - 1) * 10),
      tokens: prevAvatar.tokens - amount,
    }));
  };

  const buyGem = () => {
    if (selectedAvatar.tokens >= 16) {
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
    }
  };

  const useGem = (attribute) => {
    if (selectedAvatar.gems > 0) {
      setUserAvatars((prevAvatars) => 
        prevAvatars.map((avatar) => 
          avatar.id === selectedAvatar.id
            ? {
                ...avatar,
                gems: avatar.gems - 1,
                attributes: {
                  ...avatar.attributes,
                  [attribute]: avatar.attributes[attribute] + 1,
                },
              }
            : avatar
        )
      );
      setSelectedAvatar((prevAvatar) => ({
        ...prevAvatar,
        gems: prevAvatar.gems - 1,
        attributes: {
          ...prevAvatar.attributes,
          [attribute]: prevAvatar.attributes[attribute] + 1,
        },
      }));
    }
  };

  const visitProfessional = (nft) => {
    setPendingVisit(nft);
    setTimeout(() => {
      setPendingVisit(null);
      setUserAvatars((prevAvatars) => [...prevAvatars, { ...nft, visitCount: 1 }]);
      setActivityLog((prevLog) => [
        ...prevLog,
        `Visited ${nft.type} professional and acquired a new avatar`,
      ]);
    }, 3000);
  };

  const visitFacility = (nft) => {
    setPendingVisit(nft);
    setTimeout(() => {
      setPendingVisit(null);
      setUserAvatars((prevAvatars) => [...prevAvatars, { ...nft, visitCount: 1 }]);
      setActivityLog((prevLog) => [
        ...prevLog,
        `Visited ${nft.type} facility and acquired a new avatar`,
      ]);
    }, 3000);
  };

  const manageAvatar = (avatar) => {
    setSelectedAvatar(avatar);
  };

  return (
    <div className="p-4 container mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
        Wellness Avatar Platform
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="avatars" className="mb-6">
            <TabsList className="bg-gray-800 text-white rounded-lg">
              <TabsTrigger value="avatars" className="text-white">Avatars</TabsTrigger>
              <TabsTrigger value="professionals" className="text-white">Professionals</TabsTrigger>
              <TabsTrigger value="facilities" className="text-white">Facilities</TabsTrigger>
            </TabsList>
            <TabsContent value="avatars">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">User Avatars</h2>
              {userAvatars.length === 0 ? (
                <p className="text-gray-400">No Avatars. Visit Professionals and Facilities to find Avatars.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userAvatars.map((avatar) => (
                    <NFTCard
                      key={avatar.id}
                      nft={avatar}
                      showManage={true}
                      onManage={manageAvatar}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="professionals">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">Available Professionals</h2>
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
              <h2 className="text-xl font-semibold mb-4 text-blue-400">Available Facilities</h2>
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
          <ActivityLog log={activityLog} />
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
                    Warning: Your HP is low! Consider restoring it to maintain optimal
                    performance.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Gamification;