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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const checkCollision = (sprite1, sprite2) => {
    const distance = Math.sqrt(
      Math.pow(sprite1.x - sprite2.x, 2) + Math.pow(sprite1.y - sprite2.y, 2)
    );
    return distance < 50; // Collision threshold
  };

  const executeAction = async (sprite, action) => {
    switch (action.type) {
      case "move":
        const rad = (sprite.rotation * Math.PI) / 180;
        const newX = sprite.x + action.steps * Math.cos(rad);
        const newY = sprite.y + action.steps * Math.sin(rad);
        updateSprite(sprite.id, { x: newX, y: newY });
        await sleep(100);
        break;

      case "turn_clockwise":
        updateSprite(sprite.id, { rotation: sprite.rotation + action.degrees });
        await sleep(100);
        break;

      case "turn_anticlockwise":
        updateSprite(sprite.id, { rotation: sprite.rotation - action.degrees });
        await sleep(100);
        break;

      case "goto":
        updateSprite(sprite.id, { x: action.x, y: action.y });
        await sleep(100);
        break;

      case "say":
        updateSprite(sprite.id, { message: action.message, messageType: "say" });
        await sleep(action.duration * 1000);
        updateSprite(sprite.id, { message: "" });
        break;

      case "think":
        updateSprite(sprite.id, { message: action.message, messageType: "think" });
        await sleep(action.duration * 1000);
        updateSprite(sprite.id, { message: "" });
        break;

      case "repeat":
        // Repeat will loop through nested actions if we implement nesting
        break;

      default:
        break;
    }
  };

  const executeActions = async (sprite) => {
    const currentActions = [...sprite.actions];

    for (let i = 0; i < currentActions.length; i++) {
      if (!animationRef.current[sprite.id]) break; // Stop if animation cancelled

      const action = currentActions[i];

      if (action.type === "repeat") {
        // Execute repeat loop
        for (let j = 0; j < action.times; j++) {
          if (!animationRef.current[sprite.id]) break;

          // Execute all previous actions in the repeat loop
          for (let k = 0; k < i; k++) {
            const currentSprite = sprites.find((s) => s.id === sprite.id);
            await executeAction(currentSprite, currentActions[k]);
            await sleep(10); // Small delay for collision check
            checkAndHandleCollisions(sprite.id);
          }
        }
      } else {
        const currentSprite = sprites.find((s) => s.id === sprite.id);
        await executeAction(currentSprite, action);
        await sleep(10); // Small delay for collision check
        checkAndHandleCollisions(sprite.id);
      }
    }

    // Clean up animation ref
    delete animationRef.current[sprite.id];
  };

  const checkAndHandleCollisions = (currentSpriteId) => {
    const currentSprite = sprites.find((s) => s.id === currentSpriteId);
    if (!currentSprite) return;

    sprites.forEach((otherSprite) => {
      if (
        currentSprite.id !== otherSprite.id &&
        checkCollision(currentSprite, otherSprite)
      ) {
        // HERO FEATURE: Swap animations on collision
        const temp = [...currentSprite.actions];
        updateSprite(currentSprite.id, { actions: [...otherSprite.actions] });
        updateSprite(otherSprite.id, { actions: temp });
      }
    });
  };

  const handlePlay = () => {
    setIsPlaying(true);

    // Execute all sprites in parallel using Promise.all
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