<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Models\RecognitionRecord;
use Illuminate\Http\Request;

class RecognitionRecordController extends Controller
{
    public function index(Request $request)
    {
        $query = RecognitionRecord::with(['staffMember', 'category', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('category_id')) {
            $query->where('recognition_category_id', $request->category_id);
        }

        $records = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $records]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'recognition_category_id' => 'required|exists:recognition_categories,id',
            'recognition_date' => 'required|date',
            'reward' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $record = RecognitionRecord::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Recognition record created',
            'data' => $record->load(['staffMember', 'category']),
        ], 201);
    }

    public function show(RecognitionRecord $recognitionRecord)
    {
        return response()->json([
            'success' => true,
            'data' => $recognitionRecord->load(['staffMember', 'category', 'author']),
        ]);
    }

    public function update(Request $request, RecognitionRecord $recognitionRecord)
    {
        $validated = $request->validate([
            'recognition_category_id' => 'sometimes|required|exists:recognition_categories,id',
            'recognition_date' => 'sometimes|required|date',
            'reward' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $recognitionRecord->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Recognition record updated',
            'data' => $recognitionRecord->fresh(['staffMember', 'category']),
        ]);
    }

    public function destroy(RecognitionRecord $recognitionRecord)
    {
        $recognitionRecord->delete();

        return response()->json([
            'success' => true,
            'message' => 'Recognition record deleted',
        ]);
    }
}
