interface PageProps {
  params: Promise<{ videoId: string }>;
}

const page = async ({ params }: PageProps) => {
  const { videoId } = await params;
  return <div>Video Id Page {videoId}</div>;
};
export default page;
