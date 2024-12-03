type Props = { message: string; severity: "error" | "success" | "message" };

export function AttendanceRedirectPage({ message, severity }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen px-4 bg-background">
      <div className="flex flex-col gap-4 items-center">
        <p
          className={`${severity === "error"
              ? "text-red-400 border-l-red-400"
              : "text-foreground border-l-foreground"
            } text-lg border-l-2 text-center font-semibold pl-2`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
