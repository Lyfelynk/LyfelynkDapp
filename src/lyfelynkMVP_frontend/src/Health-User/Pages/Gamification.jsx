import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import AvatarDesc from "../sub/AvatarDesc";

const INITIAL_TOKENS = 100;
const INITIAL_HP = 100;
const INITIAL_ATTRIBUTES = {
  energy: 10,
  focus: 10,
  vitality: 10,
  resilience: 10,
};

const ACTIVITY_TYPES = {
  YOGA: "yoga",
  MEDITATION: "meditation",
  NUTRITION: "nutrition",
  HOLISTIC: "holistic",
};

const ACTIVITY_REWARDS = {
  [ACTIVITY_TYPES.YOGA]: { primaryAttribute: "energy", reward: 5 },
  [ACTIVITY_TYPES.MEDITATION]: { primaryAttribute: "focus", reward: 5 },
  [ACTIVITY_TYPES.NUTRITION]: { primaryAttribute: "vitality", reward: 5 },
  [ACTIVITY_TYPES.HOLISTIC]: { primaryAttribute: "resilience", reward: 5 },
};

const QUALITY_TIERS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const AVATAR_TYPES = [
  "Fitness Champion",
  "Mindfulness Master",
  "Nutrition Expert",
  "Holistic Healer",
];

const PROFESSIONAL_TYPES = [
  "Medical Specialist",
  "Mental Health Expert",
  "Nutritional Advisor",
  "Physical Trainer",
];
const FACILITY_TYPES = [
  "Health Hub",
  "Fitness Center",
  "Wellness Retreat",
  "Medical Clinic",
];

const generateNFT = (type, types) => ({
  id: Math.random().toString(36).substr(2, 9),
  type: types[Math.floor(Math.random() * types.length)],
  quality: QUALITY_TIERS[Math.floor(Math.random() * QUALITY_TIERS.length)],
  dailyCapacity: Math.floor(Math.random() * 10) + 1,
  visitCount: 0,
});

const WellnessAvatarPlatform = () => {
  const [avatar, setAvatar] = useState({
    type: AVATAR_TYPES[0],
    quality: QUALITY_TIERS[0],
    level: 1,
    hp: INITIAL_HP,
    tokens: INITIAL_TOKENS,
    attributes: { ...INITIAL_ATTRIBUTES },
    achievements: [],
  });
  const [nfts, setNfts] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);

  useEffect(() => {
    setNfts([
      generateNFT("avatar", AVATAR_TYPES),
      generateNFT("avatar", AVATAR_TYPES),
      generateNFT("avatar", AVATAR_TYPES),
    ]);
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
    setAvatar((prevAvatar) => {
      const { primaryAttribute, reward } = ACTIVITY_REWARDS[activity];
      const updatedAttributes = {
        ...prevAvatar.attributes,
        [primaryAttribute]: prevAvatar.attributes[primaryAttribute] + reward,
      };

      return {
        ...prevAvatar,
        attributes: updatedAttributes,
        tokens: prevAvatar.tokens + 10,
        hp: prevAvatar.hp - 10,
      };
    });

    setSelectedActivity(activity);
    setSelectedNFT(nft);
  };

  const levelUp = () => {
    setAvatar((prevAvatar) => ({
      ...prevAvatar,
      level: prevAvatar.level + 1,
      tokens: prevAvatar.tokens - 50,
    }));
  };

  const renderNFTCard = (nft, onClick) => (
    <Card key={nft.id} className="mb-4">
      <CardHeader>
        <h2 className="text-xl font-semibold">{nft.type}</h2>
      </CardHeader>
      <CardContent>
        <p>Quality: {nft.quality}</p>
        <p>Daily Capacity: {nft.dailyCapacity}</p>
        <p>Visit Count: {nft.visitCount}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onClick(nft)}>Use</Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="p-4 container">
      <h1 className="text-2xl font-bold mb-4">Wellness Avatar Platform</h1>

      <Tabs defaultValue="avatars">
        <TabsList>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
          <TabsTrigger value="professionals">Professionals</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
        </TabsList>

        <TabsContent value="avatars">
          <div className="grid grid-cols-2 gap-4">
            {nfts.map((nft) => renderNFTCard(nft, performActivity))}
          </div>
        </TabsContent>

        <TabsContent value="professionals">
          <h2 className="text-xl font-semibold mb-4">
            Available Professionals
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {professionals.map((prof) => renderNFTCard(prof, performActivity))}
          </div>
        </TabsContent>

        <TabsContent value="facilities">
          <h2 className="text-xl font-semibold mb-4">Available Facilities</h2>
          <div className="grid grid-cols-2 gap-4">
            {facilities.map((facility) =>
              renderNFTCard(facility, performActivity),
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="text-xl font-semibold">Avatar Status</h2>
        </CardHeader>
        <CardContent>
          <p>Type: {avatar.type}</p>
          <p>Quality: {avatar.quality}</p>
          <p>Level: {avatar.level}</p>
          <p>HP: {avatar.hp}</p>
          <Progress value={avatar.hp} max={INITIAL_HP} />
          <p>Tokens: {avatar.tokens}</p>
          <div className="mt-2">
            {Object.keys(avatar.attributes).map((attr) => (
              <div key={attr}>
                <p>
                  {attr}: {avatar.attributes[attr]}
                </p>
                <Progress value={avatar.attributes[attr]} max={20} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <h2 className="text-xl font-semibold">Achievements</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {avatar.achievements.map((achievement, index) => (
              <Badge key={index} variant="secondary">
                {achievement}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button className="mt-4" onClick={levelUp} disabled={avatar.tokens < 50}>
        Level Up (50 tokens)
      </Button>

      {avatar.hp <= 20 && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md flex items-center">
          <AlertCircle className="mr-2" />
          <p>
            Warning: Your HP is low! Consider restoring it to maintain optimal
            performance.
          </p>
        </div>
      )}

      {selectedActivity && selectedNFT && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          <p>
            You completed a {selectedActivity} activity with a{" "}
            {selectedNFT.type} ({selectedNFT.quality}) and earned tokens!
          </p>
        </div>
      )}
    </div>
  );
};

export default WellnessAvatarPlatform;
