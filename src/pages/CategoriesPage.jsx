import { useState } from 'react'
import AddCategoryModal from '../components/categories/AddCategoryModal.jsx'
import CategoryCard from '../components/categories/CategoryCard.jsx'
import './MangaPage.css'
import './CategoriesPage.css'

function CategoriesPage({ categories, setCategories, onNavigateCategory, showToast }) {
  const [activeCategoryType, setActiveCategoryType] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const visibleCategories = categories.filter(
    (category) => activeCategoryType === 'all' || category.types.includes(activeCategoryType),
  )

  function addCategory(category) {
    setCategories((currentCategories) => [...currentCategories, category])
    showToast('✅ 新增成功！分類已建立')
  }

  function deleteCategory(name) {
    setCategories((currentCategories) =>
      currentCategories.filter((category) => category.name !== name),
    )
  }

  return (
    <main className="categories-page">
      <div className="filters" aria-label="分類篩選">
        {[
          ['all', '全部'],
          ['manga', '📖 追漫'],
          ['book', '📚 實體書'],
        ].map(([value, label]) => (
          <button
            className={activeCategoryType === value ? 'filter-pill on' : 'filter-pill'}
            type="button"
            key={value}
            onClick={() => setActiveCategoryType(value)}
          >
            {label}
          </button>
        ))}
        <button className="filter-pill add-pill" type="button" onClick={() => setIsModalOpen(true)}>＋ 新增分類</button>
      </div>

      <div className="board">
        {visibleCategories.map((category) => (
          <CategoryCard
            key={category.name}
            category={category}
            onNavigate={onNavigateCategory}
            onDelete={deleteCategory}
          />
        ))}
      </div>

      <button className="fab-add show" type="button" aria-label="新增分類" onClick={() => setIsModalOpen(true)}>＋</button>
      <AddCategoryModal
        isOpen={isModalOpen}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onAdd={addCategory}
      />
    </main>
  )
}

export default CategoriesPage
