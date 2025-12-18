<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\DisciplineNote;
use Illuminate\Http\Request;

class DisciplineNoteController extends Controller
{
    public function index(Request $request)
    {
        $query = DisciplineNote::with(['staffMember', 'issuedToUser', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        $notes = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $notes]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'issued_to_user_id' => 'required|exists:users,id',
            'subject' => 'required|string|max:255',
            'issue_date' => 'required|date',
            'details' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $note = DisciplineNote::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Discipline note created',
            'data' => $note->load(['staffMember', 'issuedToUser']),
        ], 201);
    }

    public function show(DisciplineNote $disciplineNote)
    {
        return response()->json([
            'success' => true,
            'data' => $disciplineNote->load(['staffMember', 'issuedToUser', 'author']),
        ]);
    }

    public function update(Request $request, DisciplineNote $disciplineNote)
    {
        $validated = $request->validate([
            'subject' => 'sometimes|required|string|max:255',
            'issue_date' => 'sometimes|required|date',
            'details' => 'nullable|string',
        ]);

        $disciplineNote->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Discipline note updated',
            'data' => $disciplineNote->fresh(['staffMember', 'issuedToUser']),
        ]);
    }

    public function destroy(DisciplineNote $disciplineNote)
    {
        $disciplineNote->delete();

        return response()->json([
            'success' => true,
            'message' => 'Discipline note deleted',
        ]);
    }
}
