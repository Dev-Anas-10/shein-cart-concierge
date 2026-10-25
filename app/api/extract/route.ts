import { NextRequest, NextResponse } from 'next/server';
import { extractSheinGoods, extractSheinUrl } from '@/lib/shein-extractor';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = body.text || body.url;

    if (!rawInput || typeof rawInput !== 'string') {
      return NextResponse.json(
        { error: 'Please provide the SHEIN cart link or share message.' },
        { status: 400 }
      );
    }

    const cleanLink = extractSheinUrl(rawInput);
    if (!cleanLink) {
      return NextResponse.json(
        {
          error:
            'Could not find a valid SHEIN link in your text. Make sure it contains a link like https://onelink.shein.com/... or https://shein.com/...',
        },
        { status: 400 }
      );
    }

    // Get current dynamic fee percent configured in settings
    const settings = await db.getSettings();
    const dynamicFeePercent = typeof body.dynamicFeePercent === 'number'
      ? body.dynamicFeePercent
      : settings.dynamicFeePercent || 20;

    const estimatedSubtotal = typeof body.estimatedSubtotal === 'number'
      ? body.estimatedSubtotal
      : (typeof body.estimatedSubtotal === 'string' && !isNaN(Number(body.estimatedSubtotal)))
      ? Number(body.estimatedSubtotal)
      : undefined;

    const estimatedItemsCount = typeof body.estimatedItemsCount === 'number'
      ? body.estimatedItemsCount
      : (typeof body.estimatedItemsCount === 'string' && !isNaN(Number(body.estimatedItemsCount)))
      ? Number(body.estimatedItemsCount)
      : undefined;

    const extracted = await extractSheinGoods(
      rawInput,
      dynamicFeePercent,
      estimatedSubtotal,
      estimatedItemsCount
    );

    return NextResponse.json({
      success: true,
      data: extracted,
    });
  } catch (err: any) {
    console.error('Extract API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to extract goods from SHEIN link' },
      { status: 500 }
    );
  }
}
