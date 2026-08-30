import { useEffect, useState } from 'react'
import { FiLogIn } from 'react-icons/fi'
import appIcon from '../../asstes/images/icon.png'
import { loginWithGoogle, logout, subscribeAuth } from '../../services/authService.js'
import './AuthGate.css'

const allowedUid = import.meta.env.VITE_ALLOWED_FIREBASE_UID?.trim()

function getLoginErrorMessage(error) {
  if (error?.code === 'auth/popup-closed-by-user') return '登入視窗已關閉，請再試一次。'
  if (error?.code === 'auth/popup-blocked') return '登入視窗被瀏覽器封鎖，請允許彈出式視窗。'
  return 'Google 登入失敗，請稍後再試。'
}

function AuthGate({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => subscribeAuth(async (currentUser) => {
    if (!currentUser) {
      setUser(null)
      setLoading(false)
      return
    }

    if (!allowedUid) {
      setAuthError('尚未設定允許使用的 Firebase UID')
      await logout()
      setLoading(false)
      return
    }

    if (currentUser.uid !== allowedUid) {
      setAuthError('此帳號沒有使用權限')
      await logout()
      setLoading(false)
      return
    }

    setAuthError('')
    setUser(currentUser)
    setLoading(false)
  }), [])

  async function handleLogin() {
    setAuthError('')
    setIsLoggingIn(true)
    try {
      await loginWithGoogle()
    } catch (error) {
      setAuthError(getLoginErrorMessage(error))
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (loading) {
    return (
      <main className="auth-screen" aria-live="polite">
        <div className="auth-card auth-loading">正在確認登入狀態…</div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-pin" aria-hidden="true" />
          <div className="auth-mark" aria-hidden="true">
            <img src={appIcon} alt="" />
          </div>
          <h1 id="auth-title">柚子書庫</h1>
          <p>只有管理者可以進入</p>
          <button className="button-with-icon" type="button" onClick={handleLogin} disabled={isLoggingIn}>
            <FiLogIn aria-hidden="true" />
            {isLoggingIn ? '登入中…' : '使用 Google 登入'}
          </button>
          {authError && <div className="auth-error" role="alert">{authError}</div>}
        </section>
      </main>
    )
  }

  return children(user)
}

export default AuthGate
