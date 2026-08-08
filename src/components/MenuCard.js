"use client";

export default function MenuCard({ item }) {
  return (
    <div className="menu-card">
      {item.image && (
        <div className="menu-card-img-wrapper">
          <img src={item.image} alt={item.name} className="menu-card-img" />
        </div>
      )}
      <div className="menu-card-content">
        <div className="card-top">
          <span className="card-name">{item.name}</span>
          <span className="card-price">{item.price}</span>
        </div>
        {item.description && (
          <p className="card-description">{item.description}</p>
        )}
      </div>
    </div>
  );
}
