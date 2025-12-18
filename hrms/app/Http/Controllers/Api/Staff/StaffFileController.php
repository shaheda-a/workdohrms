<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\StaffFile;
use App\Models\StaffMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StaffFileController extends Controller
{
    /**
     * Display files for a staff member.
     */
    public function index(Request $request, StaffMember $staffMember)
    {
        $files = $staffMember->files()->with('fileCategory')->get();

        return response()->json([
            'success' => true,
            'data' => $files,
        ]);
    }

    /**
     * Upload a file for staff member.
     */
    public function store(Request $request, StaffMember $staffMember)
    {
        $validated = $request->validate([
            'file_category_id' => 'required|exists:file_categories,id',
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('staff-files/'.$staffMember->id, 'public');

        $staffFile = StaffFile::create([
            'staff_member_id' => $staffMember->id,
            'file_category_id' => $validated['file_category_id'],
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => $staffFile->load('fileCategory'),
        ], 201);
    }

    /**
     * Download a staff file.
     */
    public function show(StaffMember $staffMember, StaffFile $file)
    {
        if ($file->staff_member_id !== $staffMember->id) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($file->file_path, $file->original_name);
    }

    /**
     * Delete a staff file.
     */
    public function destroy(StaffMember $staffMember, StaffFile $file)
    {
        if ($file->staff_member_id !== $staffMember->id) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully',
        ]);
    }
}
