"use server";

export type UploadImageState = {
  success: boolean;
  url: string | null;
  error: string | null;
};

export async function uploadImageAction(
  prevState: UploadImageState,
  formData: FormData
): Promise<UploadImageState> {
  const file = formData.get("image") as File;
  if (!file) {
    return { success: false, url: null, error: "No file provided" };
  }

  // Mock upload logic returning a high-quality placeholder image
  return {
    success: true,
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    error: null,
  };
}
