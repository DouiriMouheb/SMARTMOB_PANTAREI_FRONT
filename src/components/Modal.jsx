
const sizeClasses = {
  md: 'max-w-md',
  lg: 'max-w-lg', 
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  open,
  title,
  children,
  footer,
  size = '2xl',
  className = '',
  showHeader = true,
  onBackdropClick,
}) {
  if (!open) return null;
  
  const handleBackdropClick = (e) => {
    if (onBackdropClick) onBackdropClick(e);
  };

  return (
    <div
      className={`fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-[100] p-2`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl border border-slate-200 w-full ${className || sizeClasses[size]} max-h-[90vh] min-h-fit overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && title && (
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-lg font-bold text-center text-black">{title}</h3>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {footer && (
          <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
