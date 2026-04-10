const sizeClasses = {
    sm: "w-8 h-8 rounded-[10px]",
    md: "w-10 h-10 rounded-[12px]",
    lg: "w-12 h-12 rounded-[14px]",
};

const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
};

const BrandLogo = ({
	size = "md",
	showLabel = true,
	label = "Media Vip",
	className = "",
	labelClassName = "",
}) => {
    const iconSize = iconSizes[size] || iconSizes.md;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div
                className={`shrink-0 ${sizeClasses[size] || sizeClasses.md} bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-sm ring-1 ring-white/10 dark:ring-slate-900/10`}
                aria-hidden="true"
            >
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
                    <path
                        d="M7 7.5L12 5.5L17 7.5V16.5L12 18.5L7 16.5V7.5Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7 7.5L12 11.2L17 7.5"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="7" cy="7.5" r="1.65" fill="currentColor" />
                    <circle cx="12" cy="5.5" r="1.65" fill="currentColor" />
                    <circle cx="17" cy="7.5" r="1.65" fill="currentColor" />
                    <circle cx="12" cy="18.5" r="1.65" fill="currentColor" />
                </svg>
            </div>

            {showLabel && (
                <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${labelClassName}`}>
                    {label}
                </span>
            )}
        </div>
    );
};

export default BrandLogo;
