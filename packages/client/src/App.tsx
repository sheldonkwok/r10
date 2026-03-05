import { Game } from "./components/Game.tsx";
import { Lobby } from "./components/Lobby.tsx";
import { useDiscordSdk } from "./hooks/useDiscordSdk.ts";
import { useSocket } from "./hooks/useSocket.ts";

export function App() {
  const { sdk, auth, error: sdkError } = useDiscordSdk();
  const roomId = sdk?.channelId ?? null;
  const token = auth?.accessToken ?? null;
  const {
    lobbyState,
    gameState,
    toggleReady,
    startGame,
    playCards,
    pass,
    resetGame,
    error: socketError,
  } = useSocket(roomId, token);

  const error = sdkError ?? socketError;

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!auth || !sdk) {
    return <div className="loading">Loading...</div>;
  }

  if (gameState) {
    return (
      <Game
        state={gameState}
        currentUserId={auth.user.id}
        onPlayCards={playCards}
        onPass={pass}
        onResetGame={resetGame}
      />
    );
  }

  if (!lobbyState) {
    return <div className="loading">Joining lobby...</div>;
  }

  return (
    <Lobby state={lobbyState} currentUserId={auth.user.id} onToggleReady={toggleReady} onStart={startGame} />
  );
}
