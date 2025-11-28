import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";

export default function App() {
  const [sprites, setSprites] = useState([
    {
      id: "sprite-1",
      name: "Sprite 1",
      x: 0,
      y: 0,
      rotation: 0,
      actions: [],
      message: "",
      messageTimeout: null,
    },
  ]);

  const [selectedSpriteId, setSelectedSpriteId] = useState("sprite-1");
  const [isPlaying, setIsPlaying] = useState(false);

  const addSprite = () => {
    const newSprite = {
      id: `sprite-${Date.now()}`,
      name: `Sprite ${sprites.length + 1}`,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      rotation: 0,
      actions: [],
      message: "",
      messageTimeout: null,
    };
    setSprites([...sprites, newSprite]);
    setSelectedSpriteId(newSprite.id);
  };

  const deleteSprite = (id) => {
    if (sprites.length === 1) return; // Keep at least one sprite
    setSprites(sprites.filter((s) => s.id !== id));
    if (selectedSpriteId === id) {
      setSelectedSpriteId(sprites[0].id);
    }
  };

  const updateSpriteActions = (spriteId, actions) => {
    setSprites(
      sprites.map((sprite) =>
        sprite.id === spriteId ? { ...sprite, actions } : sprite
      )
    );
  };

  const updateSprite = (spriteId, updates) => {
    setSprites(
      sprites.map((sprite) =>
        sprite.id === spriteId ? { ...sprite, ...updates } : sprite
      )
    );
  };

  const resetSprites = () => {
    setSprites(
      sprites.map((sprite) => ({
        ...sprite,
        x: 0,
        y: 0,
        rotation: 0,
        message: "",
        messageTimeout: null,
      }))
    );
    setIsPlaying(false);
  };

  return (
    <div className="bg-blue-100 pt-6 font-sans">
      <div className="h-screen overflow-hidden flex flex-row">
        <div className="flex-1 h-screen overflow-hidden flex flex-row bg-white border-t border-r border-gray-200 rounded-tr-xl mr-2">
          <Sidebar />
          <MidArea
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            updateSpriteActions={updateSpriteActions}
          />
        </div>
        <div className="w-1/3 h-screen overflow-hidden flex flex-row bg-white border-t border-l border-gray-200 rounded-tl-xl ml-2">
          <PreviewArea
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            setSelectedSpriteId={setSelectedSpriteId}
            addSprite={addSprite}
            deleteSprite={deleteSprite}
            updateSprite={updateSprite}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            resetSprites={resetSprites}
          />
        </div>
      </div>
    </div>
  );
}