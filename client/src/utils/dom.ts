export function dismissOnBackdropClick(onClose: () => void) {
  return (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
}
