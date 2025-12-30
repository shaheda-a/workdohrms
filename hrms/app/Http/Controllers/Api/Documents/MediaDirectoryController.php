<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\MediaDirectory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MediaDirectoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = MediaDirectory::with('creator');

        if ($request->parent_id) {
            $query->where('parent_id', $request->parent_id);
        } else {
            $query->whereNull('parent_id'); // Root directories
        }

        $directories = $query->withCount(['children', 'files'])->get();

        return $this->success($directories);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $directory = MediaDirectory::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'created_by' => auth()->id(),
        ]);

        // Update path
        $directory->path = $directory->full_path;
        $directory->save();

        return $this->created($directory, 'Directory created successfully');
    }

    public function show(MediaDirectory $mediaDirectory)
    {
        $mediaDirectory->load(['parent', 'children', 'files']);

        return $this->success($mediaDirectory);
    }

    public function update(Request $request, MediaDirectory $mediaDirectory)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $mediaDirectory->update($request->only('name'));
        $mediaDirectory->path = $mediaDirectory->full_path;
        $mediaDirectory->save();

        return $this->success($mediaDirectory, 'Directory renamed successfully');
    }

    public function destroy(MediaDirectory $mediaDirectory)
    {
        // This will cascade delete all children and files
        $mediaDirectory->delete();

        return $this->noContent('Directory deleted successfully');
    }

    public function move(Request $request, MediaDirectory $mediaDirectory)
    {
        $validator = Validator::make($request->all(), [
            'parent_id' => 'nullable|exists:media_directories,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Prevent moving to own child
        if ($request->parent_id) {
            $parent = MediaDirectory::find($request->parent_id);
            if ($parent && str_starts_with($parent->path, $mediaDirectory->path)) {
                return $this->error('Cannot move directory into its own subdirectory', 400);
            }
        }

        $mediaDirectory->parent_id = $request->parent_id;
        $mediaDirectory->path = $mediaDirectory->full_path;
        $mediaDirectory->save();

        return $this->success($mediaDirectory, 'Directory moved successfully');
    }
}
