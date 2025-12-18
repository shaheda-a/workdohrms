<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OfferTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OfferTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = OfferTemplate::query();

        if ($request->active_only !== 'false') {
            $query->where('is_active', true);
        }

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $templates = $query->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // If setting as default, unset other defaults
        if ($request->is_default) {
            OfferTemplate::where('is_default', true)->update(['is_default' => false]);
        }

        $template = OfferTemplate::create([
            'name' => $request->name,
            'content' => $request->content,
            'variables' => OfferTemplate::getAvailableVariables(),
            'is_default' => $request->is_default ?? false,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Offer template created successfully',
            'data' => $template
        ], 201);
    }

    public function show(OfferTemplate $offerTemplate)
    {
        $offerTemplate->available_variables = OfferTemplate::getAvailableVariables();
        return response()->json([
            'success' => true,
            'data' => $offerTemplate
        ]);
    }

    public function update(Request $request, OfferTemplate $offerTemplate)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // If setting as default, unset other defaults
        if ($request->is_default) {
            OfferTemplate::where('id', '!=', $offerTemplate->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $offerTemplate->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Offer template updated successfully',
            'data' => $offerTemplate
        ]);
    }

    public function destroy(OfferTemplate $offerTemplate)
    {
        if ($offerTemplate->offers()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete template with existing offers'
            ], 400);
        }

        $offerTemplate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offer template deleted successfully'
        ]);
    }

    public function variables()
    {
        return response()->json([
            'success' => true,
            'data' => OfferTemplate::getAvailableVariables()
        ]);
    }
}
