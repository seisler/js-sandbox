export type MenuProps = {
  id: string,
  class: string,
  ariaLabel: string,
  items: MenuItem[],
  onFocusOut: (e: FocusEvent & { currentTarget: HTMLUListElement }) => void,
  domRef: HTMLUListElement | undefined
}

export type MenuItem = {
  id: string,
  text: string,
}