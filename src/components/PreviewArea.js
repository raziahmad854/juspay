import React, { useEffect, useRef } from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({
  sprites,
  selectedSpriteId,
  setSelectedSpriteId,
  addSprite,
  deleteSprite,
  updateSprite,
  isPlaying,
  setIsPlaying,
  resetSprites,
}) {
  const animationRef = useRef({});
  const originalActionsRef = useRef({}); // Store original actions before play
  const spriteStatesRef = useRef({}); // Store current sprite positions during animation

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const checkCollision = (state1, state2) => {
    const distance = Math.sqrt(
      Math.pow(state1.x - state2.x, 2) + Math.pow(state1.y - state2.y, 2)
    );
    console.log(`Distance between ${state1.name} at (${state1.x.toFixed(0)}, ${state1.y.toFixed(0)}) and ${state2.name} at (${state2.x.toFixed(0)}, ${state2.y.toFixed(0)}): ${distance.toFixed(2)}`);
    return distance < 80; // Collision threshold - two sprites touching
  };

  const executeActionWithState = async (spriteState, action) => {
    switch (action.type) {
      case "move":
        const rad = (spriteState.rotation * Math.PI) / 180;
        const newX = spriteState.x + action.steps * Math.cos(rad);
        const newY = spriteState.y + action.steps * Math.sin(rad);
        updateSprite(spriteState.id, { x: newX, y: newY });
        spriteState.x = newX;
        spriteState.y = newY;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };
        await sleep(100);
        break;

      case "turn_clockwise":
        const newRotationCW = spriteState.rotation + action.degrees;
        updateSprite(spriteState.id, { rotation: newRotationCW });
        spriteState.rotation = newRotationCW;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };
        await sleep(100);
        break;

      case "turn_anticlockwise":
        const newRotationCCW = spriteState.rotation - action.degrees;
        updateSprite(spriteState.id, { rotation: newRotationCCW });
        spriteState.rotation = newRotationCCW;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };
        await sleep(100);
        break;

      case "goto":
        updateSprite(spriteState.id, { x: action.x, y: action.y });
        spriteState.x = action.x;
        spriteState.y = action.y;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };
        await sleep(100);
        break;

      case "say":
        updateSprite(spriteState.id, { message: action.message, messageType: "say" });
        spriteState.message = action.message;
        spriteState.messageType = "say";
        await sleep(action.duration * 1000);
        updateSprite(spriteState.id, { message: "", messageType: "" });
        spriteState.message = "";
        spriteState.messageType = "";
        break;

      case "think":
        updateSprite(spriteState.id, { message: action.message, messageType: "think" });
        spriteState.message = action.message;
        spriteState.messageType = "think";
        await sleep(action.duration * 1000);
        updateSprite(spriteState.id, { message: "", messageType: "" });
        spriteState.message = "";
        spriteState.messageType = "";
        break;

      case "repeat":
        break;

      default:
        break;
    }

    return spriteState;
  };

  const executeActions = async (sprite) => {
    let localSpriteState = {
      id: sprite.id,
      name: sprite.name,
      x: sprite.x,
      y: sprite.y,
      rotation: sprite.rotation,
      message: sprite.message,
      messageType: sprite.messageType,
    };

    spriteStatesRef.current[sprite.id] = { ...localSpriteState };

    // Small delay to ensure all sprites initialize together
    await sleep(10);

    let actionIndex = 0;
    
    while (actionIndex < originalActionsRef.current[sprite.id].length) {
      if (!animationRef.current[sprite.id]) break;

      const action = originalActionsRef.current[sprite.id][actionIndex];

      if (action.type === "repeat") {
        for (let repeatCount = 0; repeatCount < action.times; repeatCount++) {
          if (!animationRef.current[sprite.id]) break;

          for (let k = 0; k < actionIndex; k++) {
            if (!animationRef.current[sprite.id]) break;
            
            const repeatAction = originalActionsRef.current[sprite.id][k];
            localSpriteState = await executeActionWithState(localSpriteState, repeatAction);
            checkAndHandleCollisions(sprite.id);
          }
        }
      } else {
        localSpriteState = await executeActionWithState(localSpriteState, action);
        checkAndHandleCollisions(sprite.id);
      }

      actionIndex++;
    }

    delete animationRef.current[sprite.id];
    delete spriteStatesRef.current[sprite.id];
  };

  const checkAndHandleCollisions = (currentSpriteId) => {
    const currentState = spriteStatesRef.current[currentSpriteId];
    if (!currentState) return;

    Object.keys(spriteStatesRef.current).forEach((otherSpriteId) => {
      if (currentSpriteId !== otherSpriteId) {
        const otherState = spriteStatesRef.current[otherSpriteId];
        
        if (checkCollision(currentState, otherState)) {
          // Check if we haven't already swapped these sprites
          const swapKey = [currentSpriteId, otherSpriteId].sort().join('-');
          
          if (!originalActionsRef.current.swappedPairs) {
            originalActionsRef.current.swappedPairs = new Set();
          }
          
          if (!originalActionsRef.current.swappedPairs.has(swapKey)) {
            // HERO FEATURE: Swap the RUNNING actions (not the displayed ones)
            const tempActions = [...originalActionsRef.current[currentSpriteId]];
            originalActionsRef.current[currentSpriteId] = [...originalActionsRef.current[otherSpriteId]];
            originalActionsRef.current[otherSpriteId] = tempActions;
            
            // Mark this pair as swapped
            originalActionsRef.current.swappedPairs.add(swapKey);
            
            console.log(`✨ COLLISION! Swapping animations between ${currentState.name} and ${otherState.name}`);
          }
        }
      }
    });
  };

  const handlePlay = async () => {
    setIsPlaying(true);

    sprites.forEach((sprite) => {
      originalActionsRef.current[sprite.id] = [...sprite.actions];
    });

    originalActionsRef.current.swappedPairs = new Set();

    // Small delay to ensure state is synced
    await sleep(50);

    const animations = sprites
      .filter((sprite) => sprite.actions.length > 0)
      .map((sprite) => {
        animationRef.current[sprite.id] = true;
        return executeActions(sprite);
      });

    Promise.all(animations).then(() => {
      setIsPlaying(false);
    });
  };

  const handleStop = () => {
    setIsPlaying(false);
    // Cancel all running animations
    Object.keys(animationRef.current).forEach((key) => {
      delete animationRef.current[key];
    });
    // Clear all messages
    sprites.forEach((sprite) => {
      updateSprite(sprite.id, { message: "", messageType: "" });
    });
  };

  return (
    <div className="flex-none w-full h-full overflow-y-auto p-4 flex flex-col">
      {/* Control Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={`px-4 py-2 rounded font-semibold ${
            isPlaying
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          ▶ Play
        </button>
        <button
          onClick={handleStop}
          disabled={!isPlaying}
          className={`px-4 py-2 rounded font-semibold ${
            !isPlaying
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          ■ Stop
        </button>
        <button
          onClick={resetSprites}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
        >
          ↻ Reset
        </button>
        <button
          onClick={addSprite}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded font-semibold ml-auto"
        >
          + Add Sprite
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        {sprites.map((sprite) => (
          <CatSprite
            key={sprite.id}
            sprite={sprite}
            isSelected={sprite.id === selectedSpriteId}
            onClick={() => setSelectedSpriteId(sprite.id)}
          />
        ))}
      </div>

      {/* Sprite List */}
      <div className="mt-4">
        <div className="font-bold mb-2">Sprites:</div>
        <div className="flex flex-wrap gap-2">
          {sprites.map((sprite) => (
            <div
              key={sprite.id}
              className={`px-3 py-2 rounded cursor-pointer flex items-center gap-2 ${
                sprite.id === selectedSpriteId
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => setSelectedSpriteId(sprite.id)}
            >
              <span>{sprite.name}</span>
              {sprites.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSprite(sprite.id);
                  }}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}