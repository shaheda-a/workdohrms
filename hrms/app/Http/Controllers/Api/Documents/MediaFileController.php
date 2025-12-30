<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MediaFileController extends Controller
{
    use ApiResponse;

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

        return $this->success($files);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'files' => 'required|array',
            'files.*' => 'file|max:51200', // 50MB max per file
            'directory_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
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

        return $this->created($uploadedFiles, count($uploadedFiles).' file(s) uploaded successfully');
    }

    public function show(MediaFile $mediaFile)
    {
        $mediaFile->load(['directory', 'uploader']);

        return $this->success($mediaFile);
    }

    public function update(Request $request, MediaFile $mediaFile)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $mediaFile->update($request->only('name'));

        return $this->success($mediaFile, 'File renamed successfully');
    }

    public function destroy(MediaFile $mediaFile)
    {
        // Delete from storage
        if ($mediaFile->file_path) {
            Storage::disk('public')->delete($mediaFile->file_path);
        }

        $mediaFile->delete();

        return $this->noContent('File deleted successfully');
    }

    public function download(MediaFile $mediaFile)
    {
        if (! Storage::disk('public')->exists($mediaFile->file_path)) {
            return $this->error('File not found', 404);
        }

        return Storage::disk('public')->download($mediaFile->file_path, $mediaFile->name);
    }

    public function move(Request $request, MediaFile $mediaFile)
    {
        $validator = Validator::make($request->all(), [
            'directory_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $mediaFile->directory_id = $request->directory_id;
        $mediaFile->save();

        return $this->success($mediaFile->load('directory'), 'File moved successfully');
    }

    public function share(Request $request, MediaFile $mediaFile)
    {
        $validator = Validator::make($request->all(), [
            'shared_with' => 'nullable|array',
            'shared_with.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $mediaFile->is_shared = true;
        $mediaFile->shared_with = $request->shared_with ?? [];
        $mediaFile->save();

        return $this->success($mediaFile, 'File shared successfully');
    }

    public function unshare(MediaFile $mediaFile)
    {
        $mediaFile->is_shared = false;
        $mediaFile->shared_with = null;
        $mediaFile->save();

        return $this->success($mediaFile, 'File unshared successfully');
    }
}
