"use client";

export default function CategoryPills({
  categories,
  activeCategory,
  onCategoryChange,
}) {
  return (
    <div className="category-pills-wrapper">
      <div className="category-pills">
        <button
          className={`category-pill${activeCategory === null ? " active" : ""}`}
          onClick={() => onCategoryChange(null)}
        >
          Tümü
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-pill${activeCategory === cat ? " active" : ""}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
