import { useState } from "react";
import "./App.css";

import { Login } from "./components/Login";
import { OneShotDND } from "./OneShotDND";

// Thanks to: https://www.youtube.com/watch?v=4Uwq0xB30JE
// Note: remove the perfect cursors from packages

function App() {
  const [username, setUsername] = useState("");
  const [roomID, setRoomID] = useState("");

  const login = (username, roomID) => {
    setUsername(username);
    setRoomID(roomID);
  };

  // If user is logged in
  return username ? (
    <OneShotDND username={username} roomID={roomID} />
  ) : (
    <>
      <Login onSubmit={login} />
    </>
  );
}

export default App;
