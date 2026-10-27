import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function ProgrammeSeancePage({ params }: Props) {
  const { sessionId } = await params;
  redirect(`/app/programme?session=${sessionId}`);
}
