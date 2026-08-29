import { useState } from 'react'
import { FiBookOpen, FiPlus, FiX } from 'react-icons/fi'
import { useDialog } from '../components/common/DialogProvider.jsx'
import { statusColorHex, statusColorPalette } from '../data/initialData.js'
import './SettingsPage.css'

function getTypeValue(types) {
  if (types.includes('manga') && types.includes('book')) return 'both'
  return types.includes('manga') ? 'manga' : 'book'
}

function getTypes(value) {
  return value === 'both' ? ['manga', 'book'] : [value]
}

function SettingsPage({
  readingStatuses,
  onAddStatus,
  onUpdateStatus,
  onRemoveStatus,
}) {
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusType, setNewStatusType] = useState('both')
  const { confirm, showMessage } = useDialog()

  async function cycleStatusColor(status) {
    const nextIndex = (statusColorPalette.indexOf(status.color) + 1) % statusColorPalette.length
    try {
      await onUpdateStatus(status.id, { color: statusColorPalette[nextIndex] })
    } catch (error) {
      showMessage(error.message, { title: '更新失敗', variant: 'error' })
    }
  }

  async function updateStatusType(status, value) {
    try {
      await onUpdateStatus(status.id, { types: getTypes(value) })
    } catch (error) {
      showMessage(error.message, { title: '更新失敗', variant: 'error' })
    }
  }

  async function addStatus() {
    const name = newStatusName.trim()
    if (!name || readingStatuses.some((status) => status.name === name)) {
      setNewStatusName('')
      return
    }

    try {
      await onAddStatus({
        name,
        color: statusColorPalette[readingStatuses.length % statusColorPalette.length],
        types: getTypes(newStatusType),
      })
      setNewStatusName('')
      showMessage(`閱讀狀態「${name}」已新增。`, { title: '新增成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '新增失敗', variant: 'error' })
    }
  }

  async function removeStatus(status) {
    const didConfirm = await confirm(`確定要移除閱讀狀態「${status.name}」嗎？`, {
      title: '移除閱讀狀態',
      variant: 'danger',
      confirmLabel: '移除',
    })
    if (!didConfirm) return

    try {
      const didRemove = await onRemoveStatus(status.id)
      showMessage(
        didRemove ? `閱讀狀態「${status.name}」已移除。` : '至少需要保留一個閱讀狀態。',
        {
          title: didRemove ? '移除成功' : '無法移除',
          variant: didRemove ? 'success' : 'warning',
        },
      )
    } catch (error) {
      showMessage(error.message, { title: '移除失敗', variant: 'error' })
    }
  }

  return (
    <main className="settings-page">
      <div className="cat-wrap">
        <section className="cat-section">
          <h2><FiBookOpen aria-hidden="true" /> 閱讀狀態</h2>
          <div className="hint">管理追漫、實體書可選擇的閱讀狀態，可分別決定套用範圍</div>

          <div className="cat-list">
            {readingStatuses.map((status) => (
              <div className={`cat-pill ${status.color}`} key={status.id}>
                <button
                  className="color-swatch"
                  type="button"
                  title="點擊切換顏色"
                  aria-label={`切換${status.name}顏色`}
                  style={{ background: statusColorHex[status.color] }}
                  onClick={() => cycleStatusColor(status)}
                />
                <span>{status.name}</span>
                <select
                  className="status-type-select"
                  title="套用範圍"
                  aria-label={`${status.name}套用範圍`}
                  value={getTypeValue(status.types)}
                  onChange={(event) => updateStatusType(status, event.target.value)}
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
                  onClick={() => removeStatus(status)}
                >
                  <FiX aria-hidden="true" />
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
            <button className="button-with-icon" type="button" onClick={addStatus}>
              <FiPlus aria-hidden="true" /> 新增
            </button>
          </div>
        </section>

      </div>
    </main>
  )
}

export default SettingsPage
