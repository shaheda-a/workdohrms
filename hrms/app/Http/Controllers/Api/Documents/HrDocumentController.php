<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\DocumentAcknowledgment;
use App\Models\HrDocument;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HrDocumentController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = HrDocument::with(['category', 'uploader']);

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->requires_acknowledgment) {
            $query->where('requires_acknowledgment', true);
        }

        if ($request->active_only !== 'false') {
            $query->where('is_active', true);
        }

        $documents = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $documents,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:document_categories,id',
            'description' => 'nullable|string',
            'file' => 'required|file|max:20480', // 20MB max
            'version' => 'nullable|string|max:50',
            'requires_acknowledgment' => 'nullable|boolean',
            'expiry_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $path = $file->store('hr-documents', 'public');

        $document = HrDocument::create([
            'name' => $request->name,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'file_path' => $path,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'version' => $request->version ?? '1.0',
            'uploaded_by' => auth()->id(),
            'requires_acknowledgment' => $request->requires_acknowledgment ?? false,
            'expiry_date' => $request->expiry_date,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'data' => $document->load('category'),
        ], 201);
    }

    public function show(HrDocument $hrDocument)
    {
        $hrDocument->load(['category', 'uploader', 'acknowledgments.staffMember']);

        // Add acknowledgment stats
        $hrDocument->acknowledgment_stats = [
            'total_acknowledged' => $hrDocument->acknowledgments->count(),
            'acknowledged_by' => $hrDocument->acknowledgments->pluck('staff_member_id'),
        ];

        return response()->json([
            'success' => true,
            'data' => $hrDocument,
        ]);
    }

    public function update(Request $request, HrDocument $hrDocument)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'nullable|exists:document_categories,id',
            'description' => 'nullable|string',
            'version' => 'nullable|string|max:50',
            'requires_acknowledgment' => 'nullable|boolean',
            'expiry_date' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $hrDocument->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully',
            'data' => $hrDocument,
        ]);
    }

    public function destroy(HrDocument $hrDocument)
    {
        // Delete file from storage
        if ($hrDocument->file_path) {
            Storage::disk('public')->delete($hrDocument->file_path);
        }

        $hrDocument->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully',
        ]);
    }

    public function download(HrDocument $hrDocument)
    {
        if (! Storage::disk('public')->exists($hrDocument->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        return Storage::disk('public')->download(
            $hrDocument->file_path,
            $hrDocument->name.'.'.$hrDocument->file_type
        );
    }

    public function acknowledge(Request $request, HrDocument $hrDocument)
    {
        $staffMemberId = auth()->user()->staffMember?->id;

        if (! $staffMemberId) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found',
            ], 400);
        }

        // Check if already acknowledged
        $existing = DocumentAcknowledgment::where('document_id', $hrDocument->id)
            ->where('staff_member_id', $staffMemberId)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Document already acknowledged',
            ], 400);
        }

        $acknowledgment = DocumentAcknowledgment::create([
            'document_id' => $hrDocument->id,
            'staff_member_id' => $staffMemberId,
            'acknowledged_at' => now(),
            'ip_address' => $request->ip(),
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document acknowledged successfully',
            'data' => $acknowledgment,
        ]);
    }

    public function acknowledgments(HrDocument $hrDocument)
    {
        $acknowledgments = $hrDocument->acknowledgments()
            ->with('staffMember')
            ->orderBy('acknowledged_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $acknowledgments,
        ]);
    }

    public function pendingAcknowledgments()
    {
        $staffMemberId = auth()->user()->staffMember?->id;

        if (! $staffMemberId) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $pending = HrDocument::where('requires_acknowledgment', true)
            ->where('is_active', true)
            ->whereDoesntHave('acknowledgments', function ($query) use ($staffMemberId) {
                $query->where('staff_member_id', $staffMemberId);
            })
            ->with('category')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pending,
        ]);
    }
}
