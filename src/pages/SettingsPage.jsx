import { useEffect, useState } from 'react'
import { FiBook, FiBookOpen, FiGrid, FiLink, FiPlus, FiShoppingCart, FiX } from 'react-icons/fi'
import { useDialog } from '../components/common/DialogProvider.jsx'
import { statusColorHex, statusColorPalette } from '../data/initialData.js'
import { getSavedCardSize, saveCardSize } from '../utils/displayPreferences.js'
import { removeTemplateStatus, replaceTemplateStatus } from '../utils/cardTemplates.js'
import './SettingsPage.css'

const sectionConfig = [
  { type: 'manga', title: '追漫區', hint: '管理追漫卡片使用的閱讀標籤', icon: FiBookOpen },
  { type: 'book', title: '實體書區', hint: '管理實體書卡片使用的收藏與閱讀標籤', icon: FiBook },
  { type: 'cart', title: '購物車區', hint: '管理興趣書單卡片使用的階段標籤', icon: FiShoppingCart },
  { type: 'link', title: '外部連結區', hint: '管理外部連結卡片使用的分類標籤', icon: FiLink },
]

const defaultCartStatuses = [
  { name: '準備購買', color: 'pink' },
  { name: '有興趣', color: 'marker' },
  { name: '先收藏', color: 'mint' },
]

function StatusRow({ status, type, statusNames, onUpdate, onRemove }) {
  const [name, setName] = useState(status.name)

  useEffect(() => setName(status.name), [status.name])

  function commitName() {
    const nextName = name.trim()
    if (!nextName || (nextName !== status.name && statusNames.includes(nextName))) {
      setName(status.name)
      return
    }
    if (nextName !== status.name) onUpdate(status, { name: nextName }, type)
  }

  const nextColor = statusColorPalette[
    (statusColorPalette.indexOf(status.color) + 1) % statusColorPalette.length
  ]

  return (
    <div className={`cat-pill editable-status ${status.color}`}>
      <button
        className="color-swatch"
        type="button"
        title="點擊切換顏色"
        aria-label={`切換${status.name}顏色`}
        style={{ background: statusColorHex[status.color] }}
        onClick={() => onUpdate(status, { color: nextColor }, type)}
      />
      <input
        className="status-name-input"
        value={name}
        aria-label="標籤名稱"
        onChange={(event) => setName(event.target.value)}
        onBlur={commitName}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setName(status.name)
            event.currentTarget.blur()
          }
        }}
      />
      <button
        className="remove-btn"
        type="button"
        title="刪除標籤"
        aria-label={`刪除${status.name}`}
        onClick={() => onRemove(status, type)}
      >
        <FiX aria-hidden="true" />
      </button>
    </div>
  )
}

function StatusSection({ config, statuses, onAdd, onUpdate, onRemove }) {
  const [newName, setNewName] = useState('')
  const Icon = config.icon
  const sectionStatuses = statuses.filter((status) => status.types?.includes(config.type))
  const statusNames = sectionStatuses.map((status) => status.name)

  function addStatus() {
    const name = newName.trim()
    if (!name || statusNames.includes(name)) {
      setNewName('')
      return
    }
    onAdd({ name, color: statusColorPalette[sectionStatuses.length % statusColorPalette.length], types: [config.type] })
    setNewName('')
  }

  return (
    <section className="cat-section status-area-section">
      <h2><Icon aria-hidden="true" /> {config.title}</h2>
      <div className="hint">{config.hint}；點色點換色，直接修改文字即可改名</div>
      <div className="cat-list">
        {sectionStatuses.map((status) => (
          <StatusRow
            key={`${config.type}:${status.id}`}
            status={status}
            type={config.type}
            statusNames={statusNames}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
        {!sectionStatuses.length && <div className="empty-status-hint">這個分區還沒有自訂標籤</div>}
      </div>
      <div className="add-row scoped-add-row">
        <input
          value={newName}
          placeholder={`新增${config.title}標籤…`}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && addStatus()}
        />
        <button className="button-with-icon" type="button" onClick={addStatus}>
          <FiPlus aria-hidden="true" /> 新增
        </button>
      </div>
    </section>
  )
}

function SettingsPage({ readingStatuses, onAddStatus, onUpdateStatus, onRemoveStatus }) {
  const [defaultCardSize, setDefaultCardSize] = useState(getSavedCardSize)
  const { confirm, showMessage } = useDialog()

  function updateDefaultCardSize(event) {
    const nextSize = event.target.value
    if (!saveCardSize(nextSize)) return
    setDefaultCardSize(nextSize)
    showMessage('卡片預設大小已更新，返回書庫後就會套用。', {
      title: '顯示設定已儲存',
      variant: 'success',
    })
  }

  async function addStatus(data) {
    try {
      await onAddStatus(data)
      showMessage(`標籤「${data.name}」已新增。`, { title: '新增成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '新增失敗', variant: 'error' })
    }
  }

  async function updateStatus(status, changes, type) {
    try {
      await onUpdateStatus(status.id, changes, type)
      if (changes.name && changes.name !== status.name) {
        replaceTemplateStatus(type, status.name, changes.name)
      }
      showMessage('標籤已更新。', { title: '儲存成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '更新失敗', variant: 'error' })
    }
  }

  async function removeStatus(status, type) {
    const didConfirm = await confirm(`確定要從${sectionConfig.find((item) => item.type === type)?.title}刪除「${status.name}」嗎？`, {
      title: '刪除標籤',
      variant: 'danger',
      confirmLabel: '刪除',
    })
    if (!didConfirm) return
    try {
      const didRemove = await onRemoveStatus(status.id, type)
      if (didRemove) removeTemplateStatus(type, status.name)
      showMessage(
        didRemove ? `標籤「${status.name}」已刪除。` : '每個分區至少需要保留一個標籤。',
        { title: didRemove ? '刪除成功' : '無法刪除', variant: didRemove ? 'success' : 'warning' },
      )
    } catch (error) {
      showMessage(error.message, { title: '刪除失敗', variant: 'error' })
    }
  }

  async function createDefaultCartStatuses() {
    for (const status of defaultCartStatuses) {
      if (!readingStatuses.some((item) => item.types?.includes('cart') && item.name === status.name)) {
        await addStatus({ ...status, types: ['cart'] })
      }
    }
  }

  return (
    <main className="settings-page">
      <div className="cat-wrap">
        <section className="cat-section display-settings-section">
          <h2><FiGrid aria-hidden="true" /> 顯示設定</h2>
          <div className="hint">設定追漫、實體書與興趣書單預設使用的卡片大小</div>
          <label className="settings-select-row" htmlFor="default-card-size">
            <span><strong>預設卡片大小</strong><small>清單頁的快速切換也會同步更新此設定</small></span>
            <select id="default-card-size" value={defaultCardSize} onChange={updateDefaultCardSize}>
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </label>
        </section>

        {sectionConfig.map((config) => (
          <StatusSection
            key={config.type}
            config={config}
            statuses={readingStatuses}
            onAdd={addStatus}
            onUpdate={updateStatus}
            onRemove={removeStatus}
          />
        ))}

        {!readingStatuses.some((status) => status.types?.includes('cart')) && (
          <button className="create-default-tags" type="button" onClick={createDefaultCartStatuses}>
            建立購物車預設標籤
          </button>
        )}
      </div>
    </main>
  )
}

export default SettingsPage
