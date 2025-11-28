import React, { useState } from "react";

export default function MidArea({ sprites, selectedSpriteId, updateSpriteActions }) {
  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const actionData = e.dataTransfer.getData("action");
    if (actionData) {
      const action = JSON.parse(actionData);
      updateSpriteActions(selectedSpriteId, [
        ...selectedSprite.actions,
        { ...action, id: Date.now() },
      ]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleActionDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleActionDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null) return;

    const newActions = [...selectedSprite.actions];
    const [draggedAction] = newActions.splice(draggedIndex, 1);
    newActions.splice(dropIndex, 0, draggedAction);

    updateSpriteActions(selectedSpriteId, newActions);
    setDraggedIndex(null);
  };

  const removeAction = (index) => {
    const newActions = selectedSprite.actions.filter((_, i) => i !== index);
    updateSpriteActions(selectedSpriteId, newActions);
  };

  const updateAction = (index, field, value) => {
    const newActions = [...selectedSprite.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    updateSpriteActions(selectedSpriteId, newActions);
  };

  const renderAction = (action, index) => {
    const bgColor = {
      move: "bg-blue-500",
      turn_clockwise: "bg-blue-500",
      turn_anticlockwise: "bg-blue-500",
      goto: "bg-blue-500",
      say: "bg-purple-500",
      think: "bg-purple-500",
      repeat: "bg-yellow-500",
    }[action.type];

    return (
      <div
        key={action.id}
        draggable
        onDragStart={(e) => handleActionDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleActionDrop(e, index)}
        className={`${bgColor} text-white px-3 py-2 my-2 text-sm rounded cursor-move relative group`}
      >
        <button
          onClick={() => removeAction(index)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>

        {action.type === "move" && (
          <div className="flex items-center">
            Move
            <input
              type="number"
              value={action.steps}
              onChange={(e) => updateAction(index, "steps", parseInt(e.target.value))}
              className="mx-2 w-16 text-black text-center rounded px-1"
            />
            steps
          </div>
        )}

        {action.type === "turn_clockwise" && (
          <div className="flex items-center">
            Turn ↻
            <input
              type="number"
              value={action.degrees}
              onChange={(e) => updateAction(index, "degrees", parseInt(e.target.value))}
              className="mx-2 w-16 text-black text-center rounded px-1"
            />
            degrees
          </div>
        )}

        {action.type === "turn_anticlockwise" && (
          <div className="flex items-center">
            Turn ↺
            <input
              type="number"
              value={action.degrees}
              onChange={(e) => updateAction(index, "degrees", parseInt(e.target.value))}
              className="mx-2 w-16 text-black text-center rounded px-1"
            />
            degrees
          </div>
        )}

        {action.type === "goto" && (
          <div className="flex items-center">
            Go to x:
            <input
              type="number"
              value={action.x}
              onChange={(e) => updateAction(index, "x", parseInt(e.target.value))}
              className="mx-1 w-14 text-black text-center rounded px-1"
            />
            y:
            <input
              type="number"
              value={action.y}
              onChange={(e) => updateAction(index, "y", parseInt(e.target.value))}
              className="mx-1 w-14 text-black text-center rounded px-1"
            />
          </div>
        )}

        {action.type === "say" && (
          <div className="flex items-center">
            Say
            <input
              type="text"
              value={action.message}
              onChange={(e) => updateAction(index, "message", e.target.value)}
              className="mx-2 w-20 text-black text-center rounded px-1"
            />
            for
            <input
              type="number"
              value={action.duration}
              onChange={(e) => updateAction(index, "duration", parseFloat(e.target.value))}
              className="mx-2 w-12 text-black text-center rounded px-1"
            />
            secs
          </div>
        )}

        {action.type === "think" && (
          <div className="flex items-center">
            Think
            <input
              type="text"
              value={action.message}
              onChange={(e) => updateAction(index, "message", e.target.value)}
              className="mx-2 w-20 text-black text-center rounded px-1"
            />
            for
            <input
              type="number"
              value={action.duration}
              onChange={(e) => updateAction(index, "duration", parseFloat(e.target.value))}
              className="mx-2 w-12 text-black text-center rounded px-1"
            />
            secs
          </div>
        )}

        {action.type === "repeat" && (
          <div>
            <div className="flex items-center">
              Repeat
              <input
                type="number"
                value={action.times}
                onChange={(e) => updateAction(index, "times", parseInt(e.target.value))}
                className="mx-2 w-12 text-black text-center rounded px-1"
              />
              times
            </div>
            <div className="ml-4 mt-1 text-xs text-gray-200">
              (Contains nested actions)
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-1 h-full overflow-auto p-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="mb-4 font-bold text-lg">
        {selectedSprite?.name || "Select a sprite"}
      </div>

      {selectedSprite?.actions.length === 0 ? (
        <div className="text-gray-400 text-center mt-20">
          Drag blocks here to create actions
        </div>
      ) : (
        <div>{selectedSprite?.actions.map((action, index) => renderAction(action, index))}</div>
      )}
    </div>
  );
}