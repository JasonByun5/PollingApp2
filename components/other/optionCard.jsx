function OptionCard({ option, onDelete }) {
  const optionKey = option.id || option.index;
  const imageUrl = option.image_url || option.imageUrl;

  return (
    <div
      key={optionKey}
      className="relative flex w-full min-h-[160px] min-w-0 flex-col items-center justify-center rounded-lg border border-border bg-card p-3 shadow-[0_1px_4px_rgba(26,31,54,0.04)] sm:min-h-[180px]"
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
          <img
            src={imageUrl}
            alt={option.title || "option"}
            className="h-32 max-w-full object-contain sm:h-40"
          />
          <span className="mt-2 rounded-[6px] bg-secondary px-2 py-0.5 text-sm font-medium text-foreground">
            {option.title}
          </span>
        </>
      ) : (
        <span className="rounded-[6px] bg-secondary px-3 py-1 text-lg font-medium text-foreground sm:text-xl">
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
