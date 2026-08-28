import './Toast.css'

function Toast({ message }) {
  return (
    <div className={message ? 'toast show' : 'toast'} role="status" aria-live="polite">
      {message}
    </div>
  )
}

export default Toast
