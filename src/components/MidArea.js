import React, { useState } from "react";

export default function MidArea({
  sprites,
  selectedSpriteId,
  updateSpriteActions,
}) {
  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId);
  const [draggedIndex, setDraggedIndex] = useState(null); // root actions
  const [draggedChild, setDraggedChild] = useState(null); // { repeatIndex, childIndex }

  if (!selectedSprite) {
    return (
      <div className="flex-1 h-full overflow-auto p-4">
        <div className="mb-4 font-bold text-lg">Select a sprite</div>
      </div>
    );
  }

  const rootActions = selectedSprite.actions || [];

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // numeric input helper: allow empty string or number
  const handleNumberChange = (raw, setValue) => {
    if (raw === "") {
      setValue("");
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    setValue(n);
  };

  // ---------- ROOT-LEVEL: add new actions from Sidebar ----------

  const handleRootDrop = (e) => {
    e.preventDefault();

    const actionData = e.dataTransfer.getData("action");
    if (!actionData) {
      // ignore drops that are just reordering children etc.
      return;
    }

    const action = JSON.parse(actionData);
    const newActions = [
      ...rootActions,
      { ...action, id: Date.now() },
    ];
    updateSpriteActions(selectedSpriteId, newActions);
  };

  // ---------- ROOT-LEVEL: reorder existing actions ----------

  const handleActionDragStart = (e, index) => {
    setDraggedIndex(index);
    setDraggedChild(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleActionDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null) return;

    const newActions = [...rootActions];
    const [draggedAction] = newActions.splice(draggedIndex, 1);
    newActions.splice(dropIndex, 0, draggedAction);

    updateSpriteActions(selectedSpriteId, newActions);
    setDraggedIndex(null);
  };

  const removeAction = (index) => {
    const newActions = rootActions.filter((_, i) => i !== index);
    updateSpriteActions(selectedSpriteId, newActions);
  };

  const updateAction = (index, field, value) => {
    const newActions = [...rootActions];
    newActions[index] = { ...newActions[index], [field]: value };
    updateSpriteActions(selectedSpriteId, newActions);
  };

  // ---------- REPEAT CHILDREN: add / reorder / remove / update ----------

  const handleChildDragStart = (e, repeatIndex, childIndex) => {
    setDraggedChild({ repeatIndex, childIndex });
    setDraggedIndex(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleChildDrop = (e, repeatIndex, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const actionData = e.dataTransfer.getData("action");
    const newActions = [...rootActions];
    const repeatAction = { ...newActions[repeatIndex] };
    const children = [...(repeatAction.children || [])];

    // Case 1: new child from sidebar
    if (actionData) {
      const action = JSON.parse(actionData);
      children.splice(dropIndex, 0, { ...action, id: Date.now() });
      repeatAction.children = children;
      newActions[repeatIndex] = repeatAction;
      updateSpriteActions(selectedSpriteId, newActions);
      return;
    }

    // Case 2: reorder existing child
    if (!draggedChild) return;
    const { repeatIndex: fromRepeat, childIndex: fromIndex } = draggedChild;
    if (fromRepeat !== repeatIndex) {
      setDraggedChild(null);
      return;
    }

    if (fromIndex < 0 || fromIndex >= children.length) {
      setDraggedChild(null);
      return;
    }

    const [moved] = children.splice(fromIndex, 1);

    let targetIndex = dropIndex;
    if (fromIndex < dropIndex) {
      targetIndex = dropIndex - 1;
    }
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > children.length) targetIndex = children.length;

    children.splice(targetIndex, 0, moved);

    repeatAction.children = children;
    newActions[repeatIndex] = repeatAction;
    updateSpriteActions(selectedSpriteId, newActions);
    setDraggedChild(null);
  };

  const handleRepeatContainerDrop = (e, repeatIndex, childrenCount) => {
    // dropping onto yellow repeat block background -> append to end
    handleChildDrop(e, repeatIndex, childrenCount);
  };

  const updateChildAction = (repeatIndex, childIndex, field, value) => {
    const newActions = [...rootActions];
    const repeatAction = { ...newActions[repeatIndex] };
    const children = [...(repeatAction.children || [])];

    children[childIndex] = {
      ...children[childIndex],
      [field]: value,
    };

    repeatAction.children = children;
    newActions[repeatIndex] = repeatAction;
    updateSpriteActions(selectedSpriteId, newActions);
  };

  const removeChildAction = (repeatIndex, childIndex) => {
    const newActions = [...rootActions];
    const repeatAction = { ...newActions[repeatIndex] };
    const children = [...(repeatAction.children || [])];

    repeatAction.children = children.filter((_, i) => i !== childIndex);
    newActions[repeatIndex] = repeatAction;
    updateSpriteActions(selectedSpriteId, newActions);
  };

  // ---------- RENDER HELPERS ----------

  const renderSimpleActionContent = (action, onChangeField) => {
    if (action.type === "move") {
      return (
        <div className="flex items-center">
          Move
          <input
            type="number"
            value={action.steps ?? ""}
            onChange={(e) =>
              handleNumberChange(e.target.value, (v) =>
                onChangeField("steps", v)
              )
            }
            className="mx-2 w-16 text-black text-center rounded px-1"
          />
          steps
        </div>
      );
    }

    if (action.type === "turn_clockwise") {
      return (
        <div className="flex items-center">
          Turn ↻
          <input
            type="number"
            value={action.degrees ?? ""}
            onChange={(e) =>
              handleNumberChange(e.target.value, (v) =>
                onChangeField("degrees", v)
              )
            }
            className="mx-2 w-16 text-black text-center rounded px-1"
          />
          degrees
        </div>
      );
    }

    if (action.type === "turn_anticlockwise") {
      return (
        <div className="flex items-center">
          Turn ↺
          <input
            type="number"
            value={action.degrees ?? ""}
            onChange={(e) =>
              handleNumberChange(e.target.value, (v) =>
                onChangeField("degrees", v)
              )
            }
            className="mx-2 w-16 text-black text-center rounded px-1"
          />
          degrees
        </div>
      );
    }

    if (action.type === "goto") {
      return (
        <div className="flex items-center">
          Go to x:
          <input
            type="number"
            value={action.x ?? ""}
            onChange={(e) =>
              handleNumberChange(e.target.value, (v) =>
                onChangeField("x", v)
              )
            }
            className="mx-1 w-14 text-black text-center rounded px-1"
          />
          y:
          <input
            type="number"
            value={action.y ?? ""}
            onChange={(e) =>
              handleNumberChange(e.target.value, (v) =>
                onChangeField("y", v)
              )
            }
            className="mx-1 w-14 text-black text-center rounded px-1"
          />
        </div>
      );
    }

    if (action.type === "say") {
      return (
        <div className="flex items-center">
          Say
          <input
            type="text"
            value={action.message ?? ""}
            onChange={(e) => onChangeField("message", e.target.value)}
            className="mx-2 w-20 text-black text-center rounded px-1"
          />
          for
          <input
            type="number"
            value={action.duration ?? ""}
            onChange={(e) =>
              handleNumberChange(e.target.value, (v) =>
                onChangeField("duration", v)
              )
            }
            className="mx-2 w-12 text-black text-center rounded px-1"
          />
          secs
        </div>
      );
    }

    if (action.type === "think") {
      return (
        <div className="flex items-center">
          Think
          <input
            type="text"
            value={action.message ?? ""}
            onChange={(e) => onChangeField("message", e.target.value)}
            className="mx-2 w-20 text-black text-center rounded px-1"
          />
          for
          <input
            type="number"
            value={action.duration ?? ""}
            onChange={(e) =>
              handleNumberChange(e.target.value, (v) =>
                onChangeField("duration", v)
              )
            }
            className="mx-2 w-12 text-black text-center rounded px-1"
          />
          secs
        </div>
      );
    }

    return <div>Unknown action</div>;
  };

  const renderChildAction = (action, repeatIndex, childIndex) => {
    const bgColor = {
      move: "bg-blue-400",
      turn_clockwise: "bg-blue-400",
      turn_anticlockwise: "bg-blue-400",
      goto: "bg-blue-400",
      say: "bg-purple-400",
      think: "bg-purple-400",
    }[action.type];

    return (
      <div
        key={action.id}
        draggable
        onDragStart={(e) =>
          handleChildDragStart(e, repeatIndex, childIndex)
        }
        onDragOver={handleDragOver}
        className={`${bgColor} text-white px-3 py-1 my-1 text-xs rounded relative`}
      >
        <button
          onClick={() => removeChildAction(repeatIndex, childIndex)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
        >
          ×
        </button>

        {renderSimpleActionContent(action, (field, value) =>
          updateChildAction(repeatIndex, childIndex, field, value)
        )}
      </div>
    );
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

    if (action.type === "repeat") {
      const children = action.children || [];

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

          <div className="flex items-center">
            Repeat
            <input
              type="number"
              value={action.times ?? ""}
              onChange={(e) =>
                handleNumberChange(e.target.value, (v) =>
                  updateAction(index, "times", v)
                )
              }
              className="mx-2 w-12 text-black text-center rounded px-1"
            />
            times
          </div>

          <div
            className="ml-4 mt-2 p-2 bg-yellow-600 rounded"
            onDragOver={handleDragOver}
            onDrop={(e) =>
              handleRepeatContainerDrop(e, index, children.length)
            }
          >
            {children.length === 0 ? (
              <div className="text-xs text-gray-200">
                Drop actions here to repeat them
              </div>
            ) : (
              <>
                {children.map((child, childIndex) => (
                  <React.Fragment key={child.id}>
                    {/* droppable gap above each child */}
                    <div
                      className="h-1"
                      onDragOver={handleDragOver}
                      onDrop={(e) =>
                        handleChildDrop(e, index, childIndex)
                      }
                    />
                    {renderChildAction(child, index, childIndex)}
                  </React.Fragment>
                ))}
                {/* gap at the end */}
                <div
                  className="h-1"
                  onDragOver={handleDragOver}
                  onDrop={(e) =>
                    handleChildDrop(e, index, children.length)
                  }
                />
              </>
            )}
          </div>
        </div>
      );
    }

    // non-repeat actions
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

        {renderSimpleActionContent(action, (field, value) =>
          updateAction(index, field, value)
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-1 h-full overflow-auto p-4"
      onDragOver={handleDragOver}
      onDrop={handleRootDrop}
    >
      <div className="mb-4 font-bold text-lg">
        {selectedSprite.name}
      </div>

      {rootActions.length === 0 ? (
        <div className="text-gray-400 text-center mt-20">
          Drag blocks here to create actions
        </div>
      ) : (
        <div>
          {rootActions.map((action, index) => renderAction(action, index))}
        </div>
      )}
    </div>
  );
}
