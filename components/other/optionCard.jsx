function OptionCard({ option, onDelete }) {
  const optionKey = option.id || option.index;
  const imageUrl = option.image_url || option.imageUrl;

  return (
    <div
      key={optionKey}
      className="relative flex min-h-[180px] min-w-[180px] flex-col items-center justify-center rounded-lg border border-border bg-card p-3 shadow-[0_1px_4px_rgba(26,31,54,0.04)]"
    >
      {onDelete && (
        <button
          type="button"
          className="absolute right-2 top-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
          onClick={() => onDelete(optionKey)}
        >
          ✕
        </button>
      )}

      {imageUrl ? (
        <>
          <img src={imageUrl} alt="option" className="h-40 object-contain" />
          <span className="mt-2 rounded-[6px] bg-secondary px-2 py-0.5 text-sm font-medium text-foreground">
            {option.title}
          </span>
        </>
      ) : (
        <span className="rounded-[6px] bg-secondary px-3 py-1 text-xl font-medium text-foreground">
          {option.title}
        </span>
      )}

      {option.description && (
        <div className="mt-2 px-1 text-center text-sm text-muted-foreground">
          {option.description}
        </div>
      )}
    </div>
  );
}

export default OptionCard;
