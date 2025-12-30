<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Offer;
use App\Models\OfferTemplate;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OfferController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Offer::with(['candidate', 'jobPosting', 'template', 'creator']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->candidate_id) {
            $query->where('candidate_id', $request->candidate_id);
        }

        if ($request->job_posting_id) {
            $query->where('job_posting_id', $request->job_posting_id);
        }

        $offers = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return $this->success($offers);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'candidate_id' => 'required|exists:candidates,id',
            'job_posting_id' => 'nullable|exists:job_postings,id',
            'template_id' => 'nullable|exists:offer_templates,id',
            'job_title' => 'required|string|max:255',
            'salary' => 'required|numeric|min:0',
            'start_date' => 'required|date|after:today',
            'expiry_date' => 'required|date|after:today',
            'benefits' => 'nullable|array',
            'terms_conditions' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $candidate = Candidate::find($request->candidate_id);

        // Generate content from template if provided
        $content = $request->terms_conditions;
        if ($request->template_id) {
            $template = OfferTemplate::find($request->template_id);
            if ($template) {
                $content = str_replace(
                    ['{{candidate_name}}', '{{job_title}}', '{{salary}}', '{{start_date}}'],
                    [$candidate->name, $request->job_title, $request->salary, $request->start_date],
                    $template->content
                );
            }
        }

        $offer = Offer::create([
            'candidate_id' => $request->candidate_id,
            'job_posting_id' => $request->job_posting_id,
            'template_id' => $request->template_id,
            'job_title' => $request->job_title,
            'salary' => $request->salary,
            'start_date' => $request->start_date,
            'expiry_date' => $request->expiry_date,
            'benefits' => $request->benefits,
            'terms_conditions' => $request->terms_conditions,
            'content' => $content,
            'status' => 'draft',
            'created_by' => auth()->id(),
        ]);

        return $this->created($offer->load('candidate'), 'Offer created successfully');
    }

    public function show(Offer $offer)
    {
        $offer->load(['candidate', 'jobPosting', 'template', 'creator']);

        return $this->success($offer);
    }

    public function update(Request $request, Offer $offer)
    {
        if (! in_array($offer->status, ['draft'])) {
            return $this->error('Can only update draft offers', 400);
        }

        $validator = Validator::make($request->all(), [
            'job_title' => 'sometimes|required|string|max:255',
            'salary' => 'sometimes|numeric|min:0',
            'start_date' => 'sometimes|date',
            'expiry_date' => 'sometimes|date',
            'benefits' => 'nullable|array',
            'terms_conditions' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $offer->update($request->all());

        return $this->success($offer, 'Offer updated successfully');
    }

    public function destroy(Offer $offer)
    {
        if ($offer->status === 'accepted') {
            return $this->error('Cannot delete accepted offers', 400);
        }

        $offer->delete();

        return $this->noContent('Offer deleted successfully');
    }

    public function send(Offer $offer)
    {
        if ($offer->status !== 'draft') {
            return $this->error('Offer already sent', 400);
        }

        $offer->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        // Update candidate status
        $offer->candidate->update(['status' => 'offered']);

        // TODO: Send email notification to candidate

        return $this->success($offer, 'Offer sent successfully');
    }

    public function accept(Request $request, Offer $offer)
    {
        if ($offer->status !== 'sent') {
            return $this->error('Can only accept sent offers', 400);
        }

        if ($offer->expiry_date < now()) {
            return $this->error('Offer has expired', 400);
        }

        $offer->update([
            'status' => 'accepted',
            'responded_at' => now(),
            'response_notes' => $request->notes,
        ]);

        // Update candidate status
        $offer->candidate->update(['status' => 'hired']);

        return $this->success($offer, 'Offer accepted');
    }

    public function reject(Request $request, Offer $offer)
    {
        if ($offer->status !== 'sent') {
            return $this->error('Can only reject sent offers', 400);
        }

        $offer->update([
            'status' => 'rejected',
            'responded_at' => now(),
            'response_notes' => $request->notes,
        ]);

        // Update candidate status
        $offer->candidate->update(['status' => 'rejected']);

        return $this->success($offer, 'Offer rejected');
    }

    public function withdraw(Offer $offer)
    {
        if (! in_array($offer->status, ['draft', 'sent'])) {
            return $this->error('Cannot withdraw this offer', 400);
        }

        $offer->update(['status' => 'withdrawn']);

        return $this->success($offer, 'Offer withdrawn successfully');
    }

    public function pending()
    {
        $pending = Offer::pending()
            ->with(['candidate', 'jobPosting'])
            ->orderBy('expiry_date', 'asc')
            ->get();

        return $this->success($pending);
    }

    public function expired()
    {
        $expired = Offer::expired()
            ->with(['candidate', 'jobPosting'])
            ->orderBy('expiry_date', 'desc')
            ->get();

        return $this->success($expired);
    }
}
