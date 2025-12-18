<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\MediaDirectory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MediaDirectoryController extends Controller
{
    public function index(Request $request)
    {
        $query = MediaDirectory::with('creator');

        if ($request->parent_id) {
            $query->where('parent_id', $request->parent_id);
        } else {
            $query->whereNull('parent_id'); // Root directories
        }

        $directories = $query->withCount(['children', 'files'])->get();

        return response()->json([
            'success' => true,
            'data' => $directories,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $directory = MediaDirectory::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'created_by' => auth()->id(),
        ]);

        // Update path
        $directory->path = $directory->full_path;
        $directory->save();

        return response()->json([
            'success' => true,
            'message' => 'Directory created successfully',
            'data' => $directory,
        ], 201);
    }

    public function show(MediaDirectory $mediaDirectory)
    {
        $mediaDirectory->load(['parent', 'children', 'files']);

        return response()->json([
            'success' => true,
            'data' => $mediaDirectory,
        ]);
    }

    public function update(Request $request, MediaDirectory $mediaDirectory)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mediaDirectory->update($request->only('name'));
        $mediaDirectory->path = $mediaDirectory->full_path;
        $mediaDirectory->save();

        return response()->json([
            'success' => true,
            'message' => 'Directory renamed successfully',
            'data' => $mediaDirectory,
        ]);
    }

    public function destroy(MediaDirectory $mediaDirectory)
    {
        // This will cascade delete all children and files
        $mediaDirectory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Directory deleted successfully',
        ]);
    }

    public function move(Request $request, MediaDirectory $mediaDirectory)
    {
        $validator = Validator::make($request->all(), [
            'parent_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Prevent moving to own child
        if ($request->parent_id) {
            $parent = MediaDirectory::find($request->parent_id);
            if ($parent && str_starts_with($parent->path, $mediaDirectory->path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot move directory into its own subdirectory',
                ], 400);
            }
        }

        $mediaDirectory->parent_id = $request->parent_id;
        $mediaDirectory->path = $mediaDirectory->full_path;
        $mediaDirectory->save();

        return response()->json([
            'success' => true,
            'message' => 'Directory moved successfully',
            'data' => $mediaDirectory,
        ]);
    }
}
