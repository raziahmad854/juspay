import React, { useRef } from "react";
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
  // Which sprites are currently animating
  const animationRef = useRef({});
  // Flattened (runtime) actions after handling repeat
  const runtimeActionsRef = useRef({});
  // Live sprite state, for collision checking and debug
  const spriteStatesRef = useRef({});
  // Track which pairs have already swapped once
  const swappedPairsRef = useRef(new Set());

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const checkCollision = (state1, state2) => {
    const dx = state1.x - state2.x;
    const dy = state1.y - state2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // You can keep this log if you want:
    // console.log(`Distance ${state1.name} - ${state2.name}: ${distance.toFixed(2)}`);
    return distance < 80; // Threshold for "touching"
  };

  const executeActionWithState = async (spriteState, action) => {
    const safeRotation =
      typeof spriteState.rotation === "number" ? spriteState.rotation : 0;

    switch (action.type) {
      case "goto": {
        const x = Number(action.x ?? 0);
        const y = Number(action.y ?? 0);

        updateSprite(spriteState.id, { x, y });
        spriteState.x = x;
        spriteState.y = y;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };

        await sleep(100);
        break;
      }

      case "move": {
        const steps = Number(
          action.steps ??
            action.value ??
            action.distance ??
            0
        );
        const rad = (safeRotation * Math.PI) / 180;
        const newX = spriteState.x + steps * Math.cos(rad);
        const newY = spriteState.y + steps * Math.sin(rad);

        updateSprite(spriteState.id, { x: newX, y: newY });
        spriteState.x = newX;
        spriteState.y = newY;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };

        await sleep(100);
        break;
      }

      case "turn_clockwise": {
        const degrees = Number(action.degrees ?? 0);
        const newRotation = safeRotation + degrees;

        updateSprite(spriteState.id, { rotation: newRotation });
        spriteState.rotation = newRotation;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };

        await sleep(100);
        break;
      }

      case "turn_anticlockwise": {
        const degrees = Number(action.degrees ?? 0);
        const newRotation = safeRotation - degrees;

        updateSprite(spriteState.id, { rotation: newRotation });
        spriteState.rotation = newRotation;
        spriteStatesRef.current[spriteState.id] = { ...spriteState };

        await sleep(100);
        break;
      }

      case "say": {
        updateSprite(spriteState.id, {
          message: action.message,
          messageType: "say",
        });
        spriteState.message = action.message;
        spriteState.messageType = "say";
        spriteStatesRef.current[spriteState.id] = { ...spriteState };

        await sleep(Number(action.duration ?? 1) * 1000);

        updateSprite(spriteState.id, { message: "", messageType: "" });
        spriteState.message = "";
        spriteState.messageType = "";
        spriteStatesRef.current[spriteState.id] = { ...spriteState };
        break;
      }

      case "think": {
        updateSprite(spriteState.id, {
          message: action.message,
          messageType: "think",
        });
        spriteState.message = action.message;
        spriteState.messageType = "think";
        spriteStatesRef.current[spriteState.id] = { ...spriteState };

        await sleep(Number(action.duration ?? 1) * 1000);

        updateSprite(spriteState.id, { message: "", messageType: "" });
        spriteState.message = "";
        spriteState.messageType = "";
        spriteStatesRef.current[spriteState.id] = { ...spriteState };
        break;
      }

      case "repeat":
        // Handled when expanding; nothing here
        break;

      default:
        break;
    }

    return spriteState;
  };

  /**
   * Expand actions so repeat becomes copies of the previous non-repeat action.
   * Example:
   *  [goto, move, repeat(30)]
   *  -> [goto, move, move, move, ..., move] (30 extra moves)
   */
  const expandActionsForRuntime = (actions) => {
    const out = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      if (action.type === "repeat") {
        const prev = actions[i - 1];
        if (!prev || prev.type === "repeat") {
          // Invalid repeat; skip
          continue;
        }

        const times = Number(
          action.times ??
            action.count ??
            action.value ??
            0
        );

        for (let t = 0; t < times; t++) {
          out.push({ ...prev });
        }
      } else {
        out.push(action);
      }
    }

    return out;
  };

  /**
   * Check collisions for a given sprite against all others.
   * On first collision between a pair, swap their runtime action arrays.
   */
  const checkAndHandleCollisions = (currentSpriteId) => {
    const currentState = spriteStatesRef.current[currentSpriteId];
    if (!currentState) return;

    Object.keys(spriteStatesRef.current).forEach((otherId) => {
      if (otherId === currentSpriteId) return;

      const otherState = spriteStatesRef.current[otherId];
      if (!otherState) return;

      if (!checkCollision(currentState, otherState)) return;

      const key = [currentSpriteId, otherId].sort().join("-");
      if (swappedPairsRef.current.has(key)) return;

      swappedPairsRef.current.add(key);

      // Swap the runtime action lists of the two sprites
      const temp = runtimeActionsRef.current[currentSpriteId];
      runtimeActionsRef.current[currentSpriteId] =
        runtimeActionsRef.current[otherId];
      runtimeActionsRef.current[otherId] = temp;

      // Optional debug:
      // console.log(`Swapped actions between ${currentState.name} and ${otherState.name}`);
    });
  };

  /**
   * Execute all actions for a sprite, sequentially.
   */
  const executeActions = async (sprite) => {
    let localSpriteState = {
      id: sprite.id,
      name: sprite.name,
      x: sprite.x,
      y: sprite.y,
      rotation:
        typeof sprite.rotation === "number" ? sprite.rotation : 0,
      message: sprite.message,
      messageType: sprite.messageType,
    };

    spriteStatesRef.current[sprite.id] = { ...localSpriteState };

    await sleep(10); // small sync delay so all sprites register

    let index = 0;

    while (animationRef.current[sprite.id]) {
      const actions = runtimeActionsRef.current[sprite.id] || [];
      if (index >= actions.length) break;

      const action = actions[index];

      // Optional logging:
      // console.log(
      //   `[${sprite.name}] BEFORE #${index}`,
      //   { x: localSpriteState.x, y: localSpriteState.y, rotation: localSpriteState.rotation },
      //   "action:",
      //   action
      // );

      localSpriteState = await executeActionWithState(
        localSpriteState,
        action
      );

      spriteStatesRef.current[sprite.id] = { ...localSpriteState };
      checkAndHandleCollisions(sprite.id);

      // Optional logging:
      // console.log(
      //   `[${sprite.name}] AFTER #${index}`,
      //   { x: localSpriteState.x, y: localSpriteState.y, rotation: localSpriteState.rotation }
      // );

      index++;
    }

    delete animationRef.current[sprite.id];
    delete spriteStatesRef.current[sprite.id];
  };

  /**
   * Play: expand actions, then run them for each sprite.
   */
  const handlePlay = async () => {
    setIsPlaying(true);

    runtimeActionsRef.current = {};
    spriteStatesRef.current = {};
    swappedPairsRef.current = new Set();

    sprites.forEach((sprite) => {
      const actions = sprite.actions || [];
      const flat = expandActionsForRuntime(actions);
      runtimeActionsRef.current[sprite.id] = flat;
      // Optional debug:
      // console.log(`[${sprite.name}] runtime actions:`, flat);
    });

    await sleep(30);

    const animations = sprites
      .filter(
        (s) =>
          runtimeActionsRef.current[s.id] &&
          runtimeActionsRef.current[s.id].length > 0
      )
      .map((sprite) => {
        animationRef.current[sprite.id] = true;
        return executeActions(sprite);
      });

    Promise.all(animations).finally(() => {
      setIsPlaying(false);
    });
  };

  /**
   * Stop: cancel all animations and clear messages.
   */
  const handleStop = () => {
    setIsPlaying(false);

    Object.keys(animationRef.current).forEach((key) => {
      delete animationRef.current[key];
    });

    sprites.forEach((sprite) => {
      updateSprite(sprite.id, { message: "", messageType: "" });
    });

    spriteStatesRef.current = {};
    swappedPairsRef.current = new Set();
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
