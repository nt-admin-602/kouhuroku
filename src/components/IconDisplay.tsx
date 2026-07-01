import { getIconEmoji, getIconUri } from '../utils/icons'

interface Props {
  iconKey: string
  size?: number
  className?: string
}

/**
 * icons.json の uri が設定されていれば <img> を、
 * なければ絵文字 <span> を返す共通アイコンコンポーネント。
 * ボウル・炭・フレーバー・HMS すべてで使用する。
 */
export function IconDisplay({ iconKey, size = 20, className }: Props) {
  const uri = getIconUri(iconKey)
  const emoji = getIconEmoji(iconKey)

  if (uri) {
    return (
      <img
        src={uri}
        alt={emoji}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }}
        draggable={false}
      />
    )
  }

  return (
    <span aria-hidden="true" className={className}>
      {emoji}
    </span>
  )
}
