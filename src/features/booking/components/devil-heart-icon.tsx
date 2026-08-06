import { cn } from "@/lib/utils";

interface DevilHeartIconProps {
  className?: string;
  /** When false, renders only the heart mark (no purple circle). */
  withCircle?: boolean;
}

/** Flat devil-heart mark inspired by the brand icon reference. */
export function DevilHeartIcon({
  className,
  withCircle = true,
}: DevilHeartIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {withCircle ? (
        <>
          <circle cx="24" cy="24" r="24" fill="#9B5BAF" />
          <path
            d="M17 18L31 32L31 34L17 20V18Z"
            fill="#7A4589"
            opacity="0.7"
          />
        </>
      ) : null}
      <path
        d="M24 34.2C24 34.2 13.8 27.6 13.8 20.1C13.8 16.7 16.6 14.2 19.8 14.2C21.8 14.2 23.5 15.3 24 17C24.5 15.3 26.2 14.2 28.2 14.2C31.4 14.2 34.2 16.7 34.2 20.1C34.2 27.6 24 34.2 24 34.2Z"
        fill="white"
      />
      <path d="M18.4 15.8L17.2 12.4L21 14.2L18.4 15.8Z" fill="white" />
      <path d="M29.6 15.8L31.8 12.4L28 14.2L29.6 15.8Z" fill="white" />
      <path
        d="M28.8 27.8C30.4 29.2 32.3 30.2 34.4 30.6L33.6 32.8C31.3 32.1 29.2 30.8 27.6 29.1L28.8 27.8Z"
        fill="white"
      />
      <path d="M34.6 30.8L37 29.8L35.2 33.4L34.6 30.8Z" fill="white" />
    </svg>
  );
}
