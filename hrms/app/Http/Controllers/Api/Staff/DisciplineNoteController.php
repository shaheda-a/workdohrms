<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\DisciplineNote;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DisciplineNoteController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = DisciplineNote::with(['staffMember', 'issuedToUser', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        $notes = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($notes);
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

        return $this->created($note->load(['staffMember', 'issuedToUser']), 'Discipline note created');
    }

    public function update(Request $request, DisciplineNote $disciplineNote)
    {
        $validated = $request->validate([
            'subject' => 'sometimes|required|string|max:255',
            'issue_date' => 'sometimes|required|date',
            'details' => 'nullable|string',
        ]);

        $disciplineNote->update($validated);

        return $this->success($disciplineNote->fresh(['staffMember', 'issuedToUser']), 'Discipline note updated');
    }

    public function destroy(DisciplineNote $disciplineNote)
    {
        $disciplineNote->delete();

        return $this->noContent('Discipline note deleted');
    }
}
