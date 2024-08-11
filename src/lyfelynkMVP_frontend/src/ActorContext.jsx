import React from "react";

const ActorContext = React.createContext({
  actors: {
    user: null,
    professional: null,
    facility: null,
    dataAsset: null,
  },
  isAuthenticated: false,
  login: () => {},
});

export default ActorContext;
