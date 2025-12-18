<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\LetterTemplate;
use Illuminate\Http\Request;

class LetterTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = LetterTemplate::with('author');

        if ($request->filled('type')) {
            $query->ofType($request->type);
        }
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $templates = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $templates]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'template_type' => 'required|in:joining,experience,noc,offer,termination,other',
            'language' => 'nullable|string|max:10',
            'content' => 'required|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Set default placeholders
        $validated['placeholders'] = LetterTemplate::getDefaultPlaceholders();
        $validated['author_id'] = $request->user()->id;

        // If setting as default, unset other defaults of same type
        if ($validated['is_default'] ?? false) {
            LetterTemplate::ofType($validated['template_type'])
                ->update(['is_default' => false]);
        }

        $template = LetterTemplate::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Letter template created',
            'data' => $template,
        ], 201);
    }

    public function show(LetterTemplate $letterTemplate)
    {
        return response()->json([
            'success' => true,
            'data' => $letterTemplate->load('author'),
        ]);
    }

    /**
     * Get available placeholders.
     */
    public function placeholders()
    {
        return response()->json([
            'success' => true,
            'data' => LetterTemplate::getDefaultPlaceholders(),
        ]);
    }

    public function update(Request $request, LetterTemplate $letterTemplate)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'template_type' => 'sometimes|required|in:joining,experience,noc,offer,termination,other',
            'language' => 'nullable|string|max:10',
            'content' => 'sometimes|required|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (($validated['is_default'] ?? false) && ! $letterTemplate->is_default) {
            LetterTemplate::ofType($validated['template_type'] ?? $letterTemplate->template_type)
                ->where('id', '!=', $letterTemplate->id)
                ->update(['is_default' => false]);
        }

        $letterTemplate->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Letter template updated',
            'data' => $letterTemplate->fresh(),
        ]);
    }

    public function destroy(LetterTemplate $letterTemplate)
    {
        if ($letterTemplate->generatedLetters()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete template with existing generated letters',
            ], 422);
        }

        $letterTemplate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Letter template deleted',
        ]);
    }
}
