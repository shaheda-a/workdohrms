<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\StaffMember;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CandidateController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Candidate::withCount('applications');

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->source) {
            $query->where('source', $request->source);
        }
        if ($request->is_archived !== null) {
            $query->where('is_archived', $request->is_archived === 'true');
        } else {
            $query->where('is_archived', false);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%")
                    ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        $candidates = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($candidates);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:candidates,email',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string',
            'linkedin_url' => 'nullable|url',
            'source' => 'nullable|in:website,referral,job_portal,social_media,other',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Handle resume upload
        $data = $request->except('resume');
        if ($request->hasFile('resume')) {
            $data['resume_path'] = $request->file('resume')->store('resumes', 'public');
        }

        $candidate = Candidate::create($data);

        return $this->created($candidate, 'Candidate created successfully');
    }

    public function show(Candidate $candidate)
    {
        $candidate->load(['applications.job', 'applications.stage']);

        return $this->success($candidate);
    }

    public function update(Request $request, Candidate $candidate)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:candidates,email,'.$candidate->id,
            'status' => 'nullable|in:new,screening,interview,offered,hired,rejected',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $candidate->update($request->all());

        return $this->success($candidate, 'Candidate updated successfully');
    }

    public function destroy(Candidate $candidate)
    {
        $candidate->delete();

        return $this->noContent('Candidate deleted successfully');
    }

    public function archive(Candidate $candidate)
    {
        $candidate->update(['is_archived' => true]);

        return $this->success($candidate, 'Candidate archived successfully');
    }

    public function convertToEmployee(Request $request, Candidate $candidate)
    {
        $validator = Validator::make($request->all(), [
            'office_location_id' => 'required|exists:office_locations,id',
            'division_id' => 'required|exists:divisions,id',
            'job_title_id' => 'required|exists:job_titles,id',
            'employee_id' => 'required|string|unique:staff_members,employee_id',
            'join_date' => 'required|date',
            'base_salary' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Create staff member from candidate
        $staffMember = StaffMember::create([
            'first_name' => explode(' ', $candidate->name)[0],
            'last_name' => count(explode(' ', $candidate->name)) > 1
                ? implode(' ', array_slice(explode(' ', $candidate->name), 1))
                : '',
            'email' => $candidate->email,
            'phone' => $candidate->phone,
            'date_of_birth' => $candidate->date_of_birth,
            'gender' => $candidate->gender,
            'address' => $candidate->address,
            'office_location_id' => $request->office_location_id,
            'division_id' => $request->division_id,
            'job_title_id' => $request->job_title_id,
            'employee_id' => $request->employee_id,
            'join_date' => $request->join_date,
            'base_salary' => $request->base_salary,
            'employment_status' => 'active',
        ]);

        // Update candidate status
        $candidate->update(['status' => 'hired']);

        return $this->success($staffMember->load(['officeLocation', 'division', 'jobTitle']), 'Candidate converted to employee successfully');
    }
}
