import { FormMessage, Message } from "@/components/form-message";

export default async function NotVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<Message>;
}) {
  const message = await searchParams;
  return (
    <>
      <FormMessage message={message} />
    </>
  );
}
