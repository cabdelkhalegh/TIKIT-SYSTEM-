export const dynamic = 'force-dynamic';

// Campaign Brief - Extract structured fields from raw brief text or file
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { extractBrief } from '@/lib/brief-extractor';

export const POST = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: params.id },
      select: { campaignId: true, campaignName: true },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    // Accept either JSON body with { text } or multipart form with file
    const contentType = req.headers.get('content-type') || '';
    let briefText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const text = formData.get('text') as string | null;

      if (file) {
        // Read file content as text (supports .txt, .pdf text layer, .docx plain text)
        const buffer = await file.arrayBuffer();
        briefText = new TextDecoder('utf-8').decode(buffer);
      } else if (text) {
        briefText = text;
      }
    } else {
      // JSON body
      const body = await req.json();
      briefText = body.text || '';
    }

    if (!briefText.trim()) {
      return errorResponse('Brief text is required. Provide "text" in the body or upload a file.', 400);
    }

    const { fields, method } = await extractBrief(briefText);

    return successResponse(
      {
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        extraction_method: method,
        fields,
      },
      'Brief extracted successfully'
    );
  } catch (error: any) {
    console.error('Error extracting brief:', error);
    return errorResponse('Failed to extract brief');
  }
});

// PUT - Apply extracted brief fields back to the campaign
export const PUT = withAuth(async (req: NextRequest, { params }: any) => {
  try {
    const body = await req.json();
    const { fields } = body;

    if (!fields) {
      return errorResponse('Fields object is required', 400);
    }

    // Build update data from brief fields
    const updateData: any = {};

    if (fields.campaign_goals) {
      // Parse goals into objectives array
      const goals = fields.campaign_goals
        .split(/[,;\n]/)
        .map((g: string) => g.trim())
        .filter(Boolean);
      updateData.campaignObjectives = JSON.stringify(goals);
    }

    if (fields.target_audience) {
      const audience = {
        demographics: { description: fields.target_audience },
        interests: [],
      };
      updateData.targetAudienceJson = JSON.stringify(audience);
    }

    if (fields.budget_hint) {
      // Try to extract a number from budget hint
      const numMatch = fields.budget_hint.match(/[\d,.]+/);
      if (numMatch) {
        const budgetNum = parseFloat(numMatch[0].replace(/,/g, ''));
        if (!isNaN(budgetNum)) {
          updateData.totalBudget = budgetNum;
        }
      }
    }

    if (fields.campaign_goals && !updateData.campaignDescription) {
      // Use goals + deliverables as enriched description
      const parts = [fields.campaign_goals];
      if (fields.deliverables) parts.push('Deliverables: ' + fields.deliverables);
      if (fields.key_messages) parts.push('Key Messages: ' + fields.key_messages);
      updateData.campaignDescription = parts.join('\n\n');
    }

    const campaign = await prisma.campaign.update({
      where: { campaignId: params.id },
      data: updateData,
      include: { client: true },
    });

    return successResponse(campaign, 'Brief applied to campaign successfully');
  } catch (error: any) {
    console.error('Error applying brief:', error);
    if (error.code === 'P2025') {
      return errorResponse('Campaign not found', 404);
    }
    return errorResponse('Failed to apply brief to campaign');
  }
});
