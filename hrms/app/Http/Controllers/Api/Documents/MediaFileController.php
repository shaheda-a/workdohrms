<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MediaFileController extends Controller
{
    public function index(Request $request)
    {
        $query = MediaFile::with(['directory', 'uploader']);

        if ($request->directory_id) {
            $query->where('directory_id', $request->directory_id);
        }

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->file_type) {
            $query->where('file_type', $request->file_type);
        }

        if ($request->shared_only) {
            $query->where('is_shared', true);
        }

        $files = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $files,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'files' => 'required|array',
            'files.*' => 'file|max:51200', // 50MB max per file
            'directory_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $uploadedFiles = [];

        foreach ($request->file('files') as $file) {
            $path = $file->store('media-library', 'public');

            $mediaFile = MediaFile::create([
                'name' => $file->getClientOriginalName(),
                'directory_id' => $request->directory_id,
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => auth()->id(),
            ]);

            $uploadedFiles[] = $mediaFile;
        }

        return response()->json([
            'success' => true,
            'message' => count($uploadedFiles).' file(s) uploaded successfully',
            'data' => $uploadedFiles,
        ], 201);
    }

    public function show(MediaFile $mediaFile)
    {
        $mediaFile->load(['directory', 'uploader']);

        return response()->json([
            'success' => true,
            'data' => $mediaFile,
        ]);
    }

    public function update(Request $request, MediaFile $mediaFile)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mediaFile->update($request->only('name'));

        return response()->json([
            'success' => true,
            'message' => 'File renamed successfully',
            'data' => $mediaFile,
        ]);
    }

    public function destroy(MediaFile $mediaFile)
    {
        // Delete from storage
        if ($mediaFile->file_path) {
            Storage::disk('public')->delete($mediaFile->file_path);
        }

        $mediaFile->delete();

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully',
        ]);
    }

    public function download(MediaFile $mediaFile)
    {
        if (! Storage::disk('public')->exists($mediaFile->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        return Storage::disk('public')->download($mediaFile->file_path, $mediaFile->name);
    }

    public function move(Request $request, MediaFile $mediaFile)
    {
        $validator = Validator::make($request->all(), [
            'directory_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mediaFile->directory_id = $request->directory_id;
        $mediaFile->save();

        return response()->json([
            'success' => true,
            'message' => 'File moved successfully',
            'data' => $mediaFile->load('directory'),
        ]);
    }

    public function share(Request $request, MediaFile $mediaFile)
    {
        $validator = Validator::make($request->all(), [
            'shared_with' => 'nullable|array',
            'shared_with.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mediaFile->is_shared = true;
        $mediaFile->shared_with = $request->shared_with ?? [];
        $mediaFile->save();

        return response()->json([
            'success' => true,
            'message' => 'File shared successfully',
            'data' => $mediaFile,
        ]);
    }

    public function unshare(MediaFile $mediaFile)
    {
        $mediaFile->is_shared = false;
        $mediaFile->shared_with = null;
        $mediaFile->save();

        return response()->json([
            'success' => true,
            'message' => 'File unshared successfully',
            'data' => $mediaFile,
        ]);
    }
}
