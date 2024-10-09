import React from "react";

const ActorContext = React.createContext({
  actors: {
    user: null,
    professional: null,
    facility: null,
    dataAsset: null,
    identityManager: null,
    sharedActivity: null,
    gamificationSystem: null,
    visitManager: null,
  },
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export default ActorContext;
