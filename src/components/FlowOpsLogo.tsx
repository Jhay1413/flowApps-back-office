interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm:  'text-lg',
  md:  'text-2xl',
  lg:  'text-3xl',
  xl:  'text-4xl',
}

export function FlowOpsLogo({ size = 'md' }: Props) {
  return (
    <span className={`font-bold tracking-tight select-none ${sizes[size]}`}>
      <span className="text-sky-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>F</span>
      <span className="text-foreground">lowOps</span>
    </span>
  )
}
