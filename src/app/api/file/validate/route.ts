import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > 5) {
      return NextResponse.json(
        { success: false, message: 'Maximum 5 files allowed per submission' },
        { status: 400 }
      );
    }

    // Validate each file
    const maxSize = 100 * 1024 * 1024; // 100MB
    const validationResults = [];

    for (const [index, file] of files.entries()) {
      const result = {
        fileName: file.name,
        size: file.size,
        sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        valid: true,
        error: null as string | null
      };

      // Check file size
      if (file.size > maxSize) {
        result.valid = false;
        result.error = `File exceeds 100MB limit (${result.sizeFormatted})`;
      }

      // Check if file is empty
      if (file.size === 0) {
        result.valid = false;
        result.error = 'File is empty';
      }

      validationResults.push(result);
    }

    const hasErrors = validationResults.some(result => !result.valid);

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors ? 'Some files have validation errors' : 'All files are valid',
      results: validationResults,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      totalSizeFormatted: `${(files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1)} MB`
    });

  } catch (error: any) {
    console.error('File validation error:', error);
    return NextResponse.json(
      { success: false, message: 'File validation failed' },
      { status: 500 }
    );
  }
}
