import { useState } from 'react'
import { statusColorHex, statusColorPalette } from '../data/initialData.js'
import './SettingsPage.css'

function getTypeValue(types) {
  if (types.includes('manga') && types.includes('book')) return 'both'
  return types.includes('manga') ? 'manga' : 'book'
}

function getTypes(value) {
  return value === 'both' ? ['manga', 'book'] : [value]
}

function SettingsPage({ readingStatuses, setReadingStatuses, onRemoveStatus }) {
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusType, setNewStatusType] = useState('both')

  function cycleStatusColor(name) {
    setReadingStatuses((currentStatuses) =>
      currentStatuses.map((status) => {
        if (status.name !== name) return status
        const nextIndex = (statusColorPalette.indexOf(status.color) + 1) % statusColorPalette.length
        return { ...status, color: statusColorPalette[nextIndex] }
      }),
    )
  }

  function updateStatusType(name, value) {
    setReadingStatuses((currentStatuses) =>
      currentStatuses.map((status) =>
        status.name === name ? { ...status, types: getTypes(value) } : status,
      ),
    )
  }

  function addStatus() {
    const name = newStatusName.trim()
    if (!name || readingStatuses.some((status) => status.name === name)) {
      setNewStatusName('')
      return
    }

    setReadingStatuses((currentStatuses) => [
      ...currentStatuses,
      {
        name,
        color: statusColorPalette[currentStatuses.length % statusColorPalette.length],
        types: getTypes(newStatusType),
      },
    ])
    setNewStatusName('')
  }

  return (
    <main className="settings-page">
      <div className="cat-wrap">
        <section className="cat-section">
          <h2>📖 閱讀狀態</h2>
          <div className="hint">管理追漫、實體書可選擇的閱讀狀態，可分別決定套用範圍</div>

          <div className="cat-list">
            {readingStatuses.map((status) => (
              <div className={`cat-pill ${status.color}`} key={status.name}>
                <button
                  className="color-swatch"
                  type="button"
                  title="點擊切換顏色"
                  aria-label={`切換${status.name}顏色`}
                  style={{ background: statusColorHex[status.color] }}
                  onClick={() => cycleStatusColor(status.name)}
                />
                <span>{status.name}</span>
                <select
                  className="status-type-select"
                  title="套用範圍"
                  aria-label={`${status.name}套用範圍`}
                  value={getTypeValue(status.types)}
                  onChange={(event) => updateStatusType(status.name, event.target.value)}
                >
                  <option value="both">追漫＋實體書</option>
                  <option value="manga">僅追漫</option>
                  <option value="book">僅實體書</option>
                </select>
                <button
                  className="remove-btn"
                  type="button"
                  title="移除"
                  aria-label={`移除${status.name}`}
                  onClick={() => onRemoveStatus(status.name)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="add-row">
            <input
              value={newStatusName}
              placeholder="新增閱讀狀態，例如：等連載出全…"
              onChange={(event) => setNewStatusName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addStatus()}
            />
            <select value={newStatusType} onChange={(event) => setNewStatusType(event.target.value)}>
              <option value="both">追漫＋實體書</option>
              <option value="manga">僅追漫</option>
              <option value="book">僅實體書</option>
            </select>
            <button type="button" onClick={addStatus}>＋ 新增</button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SettingsPage
