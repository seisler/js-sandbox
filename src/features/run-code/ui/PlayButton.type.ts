export type PlayButtonProps = {
  onclick: (_e: MouseEvent & { currentTarget: HTMLButtonElement }) => Promise<void>;
  isDisabled: boolean;
}