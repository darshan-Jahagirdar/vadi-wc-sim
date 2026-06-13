import { flagUrl } from '../data/teams'

/** Country flag from flagcdn.com. Falls back to an invisible box if the
 *  image can't load so layout never jumps. */
export function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <img
      className={`flag${className ? ' ' + className : ''}`}
      src={flagUrl(code, 80)}
      loading="lazy"
      alt=""
      aria-hidden="true"
      onError={(e) => {
        e.currentTarget.style.visibility = 'hidden'
      }}
    />
  )
}
