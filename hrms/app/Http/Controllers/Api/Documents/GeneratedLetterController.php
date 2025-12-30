<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\GeneratedLetter;
use App\Models\LetterTemplate;
use App\Models\StaffMember;
use App\Models\SystemConfiguration;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class GeneratedLetterController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = GeneratedLetter::with(['staffMember', 'template', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('template_type')) {
            $query->whereHas('template', function ($q) use ($request) {
                $q->where('template_type', $request->template_type);
            });
        }

        $letters = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($letters);
    }

    /**
     * Generate a letter for a staff member.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'letter_template_id' => 'required|exists:letter_templates,id',
            'issue_date' => 'nullable|date',
        ]);

        $staffMember = StaffMember::with(['officeLocation', 'division', 'jobTitle'])->findOrFail($validated['staff_member_id']);
        $template = LetterTemplate::findOrFail($validated['letter_template_id']);

        // Build placeholder data
        $companyName = SystemConfiguration::getValue('company_name', 'Company Name');
        $companyAddress = SystemConfiguration::getValue('company_address', 'Company Address');

        $placeholderData = [
            '{staff_name}' => $staffMember->full_name,
            '{staff_code}' => $staffMember->staff_code,
            '{email}' => $staffMember->personal_email ?? $staffMember->user?->email ?? '',
            '{job_title}' => $staffMember->jobTitle?->title ?? '',
            '{division}' => $staffMember->division?->title ?? '',
            '{office_location}' => $staffMember->officeLocation?->title ?? '',
            '{hire_date}' => $staffMember->hire_date?->format('F d, Y') ?? '',
            '{exit_date}' => '', // Will be filled for termination/experience letters
            '{issue_date}' => ($validated['issue_date'] ?? now())->format('F d, Y'),
            '{company_name}' => $companyName,
            '{company_address}' => $companyAddress,
            '{reference_number}' => GeneratedLetter::generateReference(),
        ];

        // Replace placeholders in content
        $renderedContent = str_replace(
            array_keys($placeholderData),
            array_values($placeholderData),
            $template->content
        );

        // Create generated letter
        $letter = GeneratedLetter::create([
            'staff_member_id' => $staffMember->id,
            'letter_template_id' => $template->id,
            'reference_number' => $placeholderData['{reference_number}'],
            'rendered_content' => $renderedContent,
            'issue_date' => $validated['issue_date'] ?? now(),
            'author_id' => $request->user()->id,
        ]);

        return $this->created($letter->load(['staffMember', 'template']), 'Letter generated successfully');
    }

    /**
     * Preview letter HTML.
     */
    public function preview(GeneratedLetter $generatedLetter)
    {
        return response($generatedLetter->rendered_content)
            ->header('Content-Type', 'text/html');
    }

    public function destroy(GeneratedLetter $generatedLetter)
    {
        $generatedLetter->delete();

        return $this->noContent('Generated letter deleted');
    }
}
