export type MenuProps = {
  id: string,
  class: string,
  ariaLabel: string,
  items: MenuItem[],
  onfocusout: (e: FocusEvent & { currentTarget: HTMLUListElement }) => void,
  domRef: HTMLUListElement | undefined
}

export type MenuItem = {
  id: string,
  label: string,
  onclick: () => void,
}