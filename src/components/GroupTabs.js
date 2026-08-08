"use client";

export default function GroupTabs({ activeGroup, onGroupChange, groups = [] }) {
  return (
    <div className="group-tabs-wrapper">
      <div className="group-tabs">
        {groups.map((group) => (
          <button
            key={group.id}
            className={`group-tab${activeGroup === group.id ? " active" : ""}`}
            onClick={() => onGroupChange(group.id)}
            aria-pressed={activeGroup === group.id}
          >
            <span className="group-tab-icon">{group.icon}</span>
            {group.label}
          </button>
        ))}
      </div>
    </div>
  );
}
