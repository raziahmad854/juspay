import React from "react";
import Icon from "./Icon";

export default function Sidebar() {
  const handleDragStart = (e, actionType, defaultValue = {}) => {
    e.dataTransfer.setData(
      "action",
      JSON.stringify({ type: actionType, ...defaultValue })
    );
  };

  return (
    <div className="w-60 flex-none h-full overflow-y-auto flex flex-col items-start p-2 border-r border-gray-200">
      {/* Motion Category */}
      <div className="font-bold mb-2 mt-2">Motion</div>

      <div
        draggable
        onDragStart={(e) => handleDragStart(e, "move", { steps: 10 })}
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        Move
        <input
          type="number"
          defaultValue="10"
          className="mx-2 w-12 text-black text-center rounded"
          onClick={(e) => e.stopPropagation()}
        />
        steps
      </div>

      <div
        draggable
        onDragStart={(e) => handleDragStart(e, "turn_clockwise", { degrees: 15 })}
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        Turn
        <Icon name="redo" size={15} className="text-white mx-2" />
        <input
          type="number"
          defaultValue="15"
          className="mx-2 w-12 text-black text-center rounded"
          onClick={(e) => e.stopPropagation()}
        />
        degrees
      </div>

      <div
        draggable
        onDragStart={(e) =>
          handleDragStart(e, "turn_anticlockwise", { degrees: 15 })
        }
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        Turn
        <Icon name="undo" size={15} className="text-white mx-2" />
        <input
          type="number"
          defaultValue="15"
          className="mx-2 w-12 text-black text-center rounded"
          onClick={(e) => e.stopPropagation()}
        />
        degrees
      </div>

      <div
        draggable
        onDragStart={(e) => handleDragStart(e, "goto", { x: 0, y: 0 })}
        className="flex flex-row flex-wrap bg-blue-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        Go to x:
        <input
          type="number"
          defaultValue="0"
          className="mx-1 w-12 text-black text-center rounded"
          onClick={(e) => e.stopPropagation()}
        />
        y:
        <input
          type="number"
          defaultValue="0"
          className="mx-1 w-12 text-black text-center rounded"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Looks Category */}
      <div className="font-bold mb-2 mt-4">Looks</div>

      <div
        draggable
        onDragStart={(e) =>
          handleDragStart(e, "say", { message: "Hello!", duration: 2 })
        }
        className="flex flex-row flex-wrap bg-purple-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        Say
        <input
          type="text"
          defaultValue="Hello!"
          className="mx-2 w-16 text-black text-center rounded px-1"
          onClick={(e) => e.stopPropagation()}
        />
        for
        <input
          type="number"
          defaultValue="2"
          className="mx-2 w-12 text-black text-center rounded"
          onClick={(e) => e.stopPropagation()}
        />
        secs
      </div>

      <div
        draggable
        onDragStart={(e) =>
          handleDragStart(e, "think", { message: "Hmm...", duration: 2 })
        }
        className="flex flex-row flex-wrap bg-purple-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        Think
        <input
          type="text"
          defaultValue="Hmm..."
          className="mx-2 w-16 text-black text-center rounded px-1"
          onClick={(e) => e.stopPropagation()}
        />
        for
        <input
          type="number"
          defaultValue="2"
          className="mx-2 w-12 text-black text-center rounded"
          onClick={(e) => e.stopPropagation()}
        />
        secs
      </div>

      {/* Control Category */}
      <div className="font-bold mb-2 mt-4">Control</div>

      <div
        draggable
        onDragStart={(e) => handleDragStart(e, "repeat", { times: 10 })}
        className="flex flex-col bg-yellow-500 text-white px-2 py-1 my-2 text-sm cursor-pointer rounded"
      >
        <div className="flex flex-row items-center">
          Repeat
          <input
            type="number"
            defaultValue="10"
            className="mx-2 w-12 text-black text-center rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="mt-1 ml-4 text-xs text-gray-200">
          (Drag actions here)
        </div>
      </div>
    </div>
  );
}