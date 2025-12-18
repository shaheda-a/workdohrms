<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Offer;
use App\Models\OfferTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OfferController extends Controller
{
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

        return response()->json([
            'success' => true,
            'data' => $offers,
        ]);
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
            return response()->json(['errors' => $validator->errors()], 422);
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

        return response()->json([
            'success' => true,
            'message' => 'Offer created successfully',
            'data' => $offer->load('candidate'),
        ], 201);
    }

    public function show(Offer $offer)
    {
        $offer->load(['candidate', 'jobPosting', 'template', 'creator']);

        return response()->json([
            'success' => true,
            'data' => $offer,
        ]);
    }

    public function update(Request $request, Offer $offer)
    {
        if (! in_array($offer->status, ['draft'])) {
            return response()->json([
                'success' => false,
                'message' => 'Can only update draft offers',
            ], 400);
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
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $offer->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Offer updated successfully',
            'data' => $offer,
        ]);
    }

    public function destroy(Offer $offer)
    {
        if ($offer->status === 'accepted') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete accepted offers',
            ], 400);
        }

        $offer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offer deleted successfully',
        ]);
    }

    public function send(Offer $offer)
    {
        if ($offer->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Offer already sent',
            ], 400);
        }

        $offer->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        // Update candidate status
        $offer->candidate->update(['status' => 'offer']);

        // TODO: Send email notification to candidate

        return response()->json([
            'success' => true,
            'message' => 'Offer sent successfully',
            'data' => $offer,
        ]);
    }

    public function accept(Request $request, Offer $offer)
    {
        if ($offer->status !== 'sent') {
            return response()->json([
                'success' => false,
                'message' => 'Can only accept sent offers',
            ], 400);
        }

        if ($offer->expiry_date < now()) {
            return response()->json([
                'success' => false,
                'message' => 'Offer has expired',
            ], 400);
        }

        $offer->update([
            'status' => 'accepted',
            'responded_at' => now(),
            'response_notes' => $request->notes,
        ]);

        // Update candidate status
        $offer->candidate->update(['status' => 'hired']);

        return response()->json([
            'success' => true,
            'message' => 'Offer accepted',
            'data' => $offer,
        ]);
    }

    public function reject(Request $request, Offer $offer)
    {
        if ($offer->status !== 'sent') {
            return response()->json([
                'success' => false,
                'message' => 'Can only reject sent offers',
            ], 400);
        }

        $offer->update([
            'status' => 'rejected',
            'responded_at' => now(),
            'response_notes' => $request->notes,
        ]);

        // Update candidate status
        $offer->candidate->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Offer rejected',
            'data' => $offer,
        ]);
    }

    public function withdraw(Offer $offer)
    {
        if (! in_array($offer->status, ['draft', 'sent'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot withdraw this offer',
            ], 400);
        }

        $offer->update(['status' => 'withdrawn']);

        return response()->json([
            'success' => true,
            'message' => 'Offer withdrawn successfully',
            'data' => $offer,
        ]);
    }

    public function pending()
    {
        $pending = Offer::pending()
            ->with(['candidate', 'jobPosting'])
            ->orderBy('expiry_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pending,
        ]);
    }

    public function expired()
    {
        $expired = Offer::expired()
            ->with(['candidate', 'jobPosting'])
            ->orderBy('expiry_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $expired,
        ]);
    }
}
