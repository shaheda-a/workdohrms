<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Models\RecognitionRecord;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RecognitionRecordController extends Controller
{
    use ApiResponse;

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

        return $this->success($records);
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

        return $this->created($record->load(['staffMember', 'category']), 'Recognition record created');
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

        return $this->success($recognitionRecord->fresh(['staffMember', 'category']), 'Recognition record updated');
    }

    public function destroy(RecognitionRecord $recognitionRecord)
    {
        $recognitionRecord->delete();

        return $this->noContent('Recognition record deleted');
    }
}
