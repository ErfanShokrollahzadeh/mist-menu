"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Hero from "@/components/Hero";
import NavBar from "@/components/NavBar";
import GroupTabs from "@/components/GroupTabs";
import CategoryPills from "@/components/CategoryPills";
import CategorySection from "@/components/CategorySection";
import SearchBar from "@/components/SearchBar";
import BackToTop from "@/components/BackToTop";
import MistParticles from "@/components/MistParticles";
import Footer from "@/components/Footer";
import { menuGroups as menuGroupsTR, menuData as menuDataTR } from "@/data/menu";
import { menuGroupsEN, menuDataEN } from "@/data/menuEn";

export default function Home() {
  const { lang, t } = useLanguage();
  const menuGroups = lang === "tr" ? menuGroupsTR : menuGroupsEN;
  const menuData = lang === "tr" ? menuDataTR : menuDataEN;

  const [activeGroup, setActiveGroup] = useState(menuGroupsTR[0].id);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* Current group's category names */
  const currentGroup = menuGroups.find((g) => g.id === activeGroup);
  const groupCategories = currentGroup ? currentGroup.categories : [];

  /* Filter menu data by active group, active category, and search query */
  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return menuData
      .filter((section) => {
        /* Must belong to current group */
        if (!groupCategories.includes(section.category)) return false;

        /* If a specific category is selected, only show that */
        if (activeCategory && section.category !== activeCategory) return false;

        /* If searching, only include sections that have matching items */
        if (q) {
          const hasMatch = section.items.some(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
          );
          return hasMatch;
        }

        return true;
      })
      .map((section) => {
        /* If searching, filter items within each section */
        if (q) {
          return {
            ...section,
            items: section.items.filter(
              (item) =>
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q)
            ),
          };
        }
        return section;
      });
  }, [activeGroup, activeCategory, searchQuery, groupCategories, menuData]);

  const handleGroupChange = (groupId) => {
    setActiveGroup(groupId);
    setActiveCategory(null);
    setSearchQuery("");
    /* Smooth scroll to menu start */
    setTimeout(() => {
      const el = document.getElementById("menuStart");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSearchQuery("");
    if (cat) {
      setTimeout(() => {
        const el = document.getElementById(
          `cat-${cat.replace(/\s+/g, "-")}`
        );
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  const totalItems = filteredSections.reduce(
    (sum, s) => sum + s.items.length,
    0
  );

  return (
    <>
      <MistParticles />
      <Hero />
      <NavBar />

      <div id="menuStart" />
      <GroupTabs activeGroup={activeGroup} onGroupChange={handleGroupChange} groups={menuGroups} />
      <CategoryPills
        categories={groupCategories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery("")}
        placeholder={t('searchPlaceholder')}
      />

      <main className="menu-container">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <CategorySection
              key={section.category}
              category={section.category}
              items={section.items}
            />
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>{t('noResults')}</h3>
            <p>
              {searchQuery
                ? (lang === 'tr' ? `"${searchQuery}" için sonuç bulunamadı.` : `No results found for "${searchQuery}".`)
                : t('noResultsDesc')}
            </p>
          </div>
        )}
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}
