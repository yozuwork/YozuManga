import { useRef, useState } from 'react'
import { FiBookOpen, FiCheckCircle, FiClipboard, FiEdit3, FiShoppingBag } from 'react-icons/fi'
import './SecondhandPage.css'

const tabs = [
  { id: 'pending', label: '待處理', icon: FiBookOpen, title: '讓好書，繼續下一段故事。', description: '待整理、待上架與待寄出的二手書，都會收在這裡。' },
  { id: 'completed', label: '已完成', icon: FiCheckCircle, title: '每一本書，都有新的歸屬。', description: '這裡用來整理已完成的二手書交易紀錄。' },
  { id: 'workflow', label: '流程與方法', icon: FiClipboard, title: '整理好流程，出清更從容。', description: '集中整理書況檢查、拍照、上架與包裝寄送的方法。' },
  { id: 'notes', label: '筆記本', icon: FiEdit3, title: '把想到的，先記下來。', description: '這裡用來收錄二手書整理心得、定價想法與交易備忘。' },
  { id: 'platforms', label: '拍賣平台', icon: FiShoppingBag, title: '幫書找到合適的下一站。', description: '集中整理常用的拍賣平台與賣場資訊。' },
]

export default function SecondhandPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const tabRefs = useRef([])
  const selectedTab = tabs.find((tab) => tab.id === activeTab)
  const Icon = selectedTab.icon

  function handleTabKeyDown(event, index) {
    let nextIndex
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    else return
    event.preventDefault()
    setActiveTab(tabs[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <main className="secondhand-page" aria-label="二手書專區">
      <div className="secondhand-tabs" role="tablist" aria-label="二手書分頁">
        {tabs.map((tab, index) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              ref={(element) => { tabRefs.current[index] = element }}
              id={`secondhand-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`secondhand-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`secondhand-tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <TabIcon aria-hidden="true" />{tab.label}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => (
        <section
          key={tab.id}
          id={`secondhand-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`secondhand-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="secondhand-panel"
        >
          {activeTab === tab.id && <>
            <div className="secondhand-panel-heading"><h2>{tab.label}</h2><span>二手書手帳</span></div>
            <div className="secondhand-empty">
              <div className="secondhand-empty-icon"><Icon aria-hidden="true" /></div>
              <h3>{tab.title}</h3>
              <p>{tab.description}</p>
              <span className="secondhand-empty-label">目前尚無內容</span>
            </div>
          </>}
        </section>
      ))}
    </main>
  )
}
