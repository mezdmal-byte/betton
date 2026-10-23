/** Original vectors exported from Figma page 25. Text and controls remain native React. */
const assets = import.meta.glob('./onboarding-assets/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function OnboardingArtImage({ node, width, height, className }: {
  node: string
  width: number
  height: number
  className?: string
}) {
  return <img className={className} src={assets[`./onboarding-assets/node-${node.replace(':', '-')}.svg`]} width={width} height={height} alt="" aria-hidden="true" draggable={false} />
}
