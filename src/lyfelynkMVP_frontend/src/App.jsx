import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import FirstPageContent from "./onboarding/FirstPage";
import RegisterPage1Content from "./onboarding/RegisterPage/RegisterPage1";
import RegisterPage2Content from "./onboarding/RegisterPage/RegisterPage2";
import RegisterPage3Content from "./onboarding/RegisterPage/RegisterPage3";
import NotFound from "./NotFound";
import RegisteredContent1 from "./onboarding/RegisteredPage/RegisteredPage1";
import RegisteredContent2 from "./onboarding/RegisteredPage/RegisteredPage2";
import RegisteredContent3 from "./onboarding/RegisteredPage/RegisteredPage3";
import AppRoute1 from "./Health-User/AppRoute";
import AppRoute2 from "./Health-Professional/AppRoute";
import AppRoute3 from "./Health-Service/AppRoute";
import { createActor as createUserActor } from "../../declarations/User";
import { createActor as createProfessionalActor } from "../../declarations/Professional";
import { createActor as createFacilityActor } from "../../declarations/Facility";
import { createActor as createDataAssetActor } from "../../declarations/DataAsset";
import ActorContext from "./ActorContext";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import Home from "./admin/Home";
import ConnectPage from "./onboarding/ConnectPage";

function App() {
  const [actors, setActors] = useState({
    user: null,
    professional: null,
    facility: null,
    dataAsset: null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);

  useEffect(() => {
    initAuthClient();
  }, []);

  async function initAuthClient() {
    const client = await AuthClient.create();
    setAuthClient(client);
    if (await client.isAuthenticated()) {
      setIsAuthenticated(true);
      await initializeActors(client);
    }
  }

  async function initializeActors(client) {
    const identity = client.getIdentity();
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== "ic") {
      await agent.fetchRootKey().catch(console.error);
    }

    try {
      const userActor = createUserActor(process.env.CANISTER_ID_USER, {
        agent,
      });
      const professionalActor = createProfessionalActor(
        process.env.CANISTER_ID_PROFESSIONAL,
        { agent },
      );
      const facilityActor = createFacilityActor(
        process.env.CANISTER_ID_FACILITY,
        { agent },
      );
      const dataAssetActor = createDataAssetActor(
        process.env.CANISTER_ID_DATAASSET,
        { agent },
      );

      setActors({
        user: userActor,
        professional: professionalActor,
        facility: facilityActor,
        dataAsset: dataAssetActor,
      });
    } catch (error) {
      console.error("Error initializing actors:", error);
    }
  }

  async function login() {
    if (authClient) {
      await new Promise((resolve) => {
        authClient.login({
          identityProvider: process.env.II_URL,
          onSuccess: resolve,
        });
      });
      setIsAuthenticated(true);
      await initializeActors(authClient);
    }
  }

  return (
    <ActorContext.Provider value={{ actors, isAuthenticated, login }}>
      <ThemeProvider>
        <Toaster />
        <Router>
          <Routes>
            {/* <Route path="/admin" element={<AdminDashboard />} /> */}
            <Route path="/admin" element={<Home />} />
            <Route path="/" element={<Navigate to="/Connect" />} />
            <Route path="/Connect" element={<ConnectPage />} />

            <Route path="/Register" element={<FirstPageContent />} />
            <Route path="/Register">
              <Route path="Health-User" element={<RegisterPage1Content />} />
              <Route
                path="Health-User/verify"
                element={<RegisteredContent1 />}
              />
              <Route
                path="Health-Professional"
                element={<RegisterPage2Content />}
              />
              <Route
                path="Health-Professional/verify"
                element={<RegisteredContent2 />}
              />
              <Route path="Health-Service" element={<RegisterPage3Content />} />
              <Route
                path="Health-Service/verify"
                element={<RegisteredContent3 />}
              />
            </Route>
            <Route path="/Health-User/*" element={<AppRoute1 />} />
            <Route path="/Health-Professional/*" element={<AppRoute2 />} />
            <Route path="/Health-Service/*" element={<AppRoute3 />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ActorContext.Provider>
  );
}

export default App;
