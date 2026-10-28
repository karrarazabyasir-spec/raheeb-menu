import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار أي ملف" }, { status: 400 });
    }

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "الملف المرفوع يجب أن يكون صورة" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `items/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage bucket 'menu-images'
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("menu-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json({ error: "فشل رفع الصورة إلى السحابة" }, { status: 500 });
    }

    // Get public accessible URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName,
    });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الصورة" }, { status: 500 });
  }
}
