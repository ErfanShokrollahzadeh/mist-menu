"use client";

export default function MenuCard({ item }) {
  return (
    <div className="menu-card">
      <div className="card-top">
        <span className="card-name">{item.name}</span>
        <span className="card-price">{item.price}</span>
      </div>
      {item.description && (
        <p className="card-description">{item.description}</p>
      )}
    </div>
  );
}
