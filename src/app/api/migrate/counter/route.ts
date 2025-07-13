import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import SessionCounterOffer from '@/lib/models/sessionCounterOfferSchema';
import { Types } from 'mongoose';

// POST - Migrate existing counter offers to include expectedEndDate
export async function POST(req: Request) {
  await connect();
  
  try {
    // Set the default end date to August 1, 2025
    const defaultEndDate = new Date('2025-08-01T00:00:00.000Z');
    
    // Use the Mongoose model's collection directly
    const collection = SessionCounterOffer.collection;
    const actualCollectionName = collection.name;
    
    console.log(`Using Mongoose collection: ${actualCollectionName}`);
    
    // First, check all documents to see their current state
    const allDocs = await collection.find({}).toArray();
    console.log('Total documents in collection:', allDocs.length);
    console.log('Sample document:', allDocs[0]);
    
    // Find documents that need the expectedEndDate field
    const docsNeedingUpdate = await collection.find({
      $or: [
        { expectedEndDate: { $exists: false } },
        { expectedEndDate: null }
      ]
    }).toArray();
    
    console.log('Documents needing update:', docsNeedingUpdate.length);

    if (docsNeedingUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No counter offers need migration',
        migratedCount: 0,
        allDocuments: allDocs.length,
        documentsWithExpectedEndDate: allDocs.filter(doc => doc.expectedEndDate).length
      }, { status: 200 });
    }

    // Update each document individually to ensure it works
    let modifiedCount = 0;
    let errors: any[] = [];
    
    for (const doc of docsNeedingUpdate) {
      try {
        const result = await collection.updateOne(
          { _id: doc._id },
          { 
            $set: { 
              expectedEndDate: defaultEndDate 
            } 
          }
        );
        
        if (result.modifiedCount > 0) {
          modifiedCount++;
          console.log(`Updated document ${doc._id}`);
        } else {
          console.log(`Document ${doc._id} was matched but not modified`);
        }
      } catch (error) {
        console.error(`Error updating document ${doc._id}:`, error);
        errors.push({ docId: doc._id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    // Verify the updates
    const verificationDocs = await collection.find({
      _id: { $in: docsNeedingUpdate.map(doc => doc._id) }
    }).toArray();
    
    const successfullyUpdated = verificationDocs.filter(doc => doc.expectedEndDate).length;
    
    // Also refresh the Mongoose model and check
    const mongooseCheck = await SessionCounterOffer.find({}).lean();
    const mongooseWithEndDate = mongooseCheck.filter(doc => doc.expectedEndDate).length;

    return NextResponse.json({
      success: true,
      message: `Migration completed. Updated ${modifiedCount} documents.`,
      migratedCount: modifiedCount,
      details: {
        totalDocuments: allDocs.length,
        documentsNeedingUpdate: docsNeedingUpdate.length,
        documentsModified: modifiedCount,
        successfullyUpdated: successfullyUpdated,
        mongooseModelCheck: mongooseWithEndDate,
        errors: errors,
        defaultEndDateSet: defaultEndDate.toISOString(),
        verificationSample: verificationDocs.slice(0, 2) // Show first 2 updated docs
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// GET - Check migration status
export async function GET(req: Request) {
  await connect();
  
  try {
    const totalCounterOffers = await SessionCounterOffer.countDocuments();
    const counterOffersWithoutEndDate = await SessionCounterOffer.countDocuments({
      expectedEndDate: { $exists: false }
    });
    const counterOffersWithNullEndDate = await SessionCounterOffer.countDocuments({
      expectedEndDate: null
    });
    const counterOffersWithEndDate = await SessionCounterOffer.countDocuments({
      expectedEndDate: { $exists: true, $ne: null }
    });

    const needsMigration = counterOffersWithoutEndDate + counterOffersWithNullEndDate;

    return NextResponse.json({
      success: true,
      migrationStatus: {
        totalCounterOffers,
        counterOffersWithEndDate,
        counterOffersWithoutEndDate,
        counterOffersWithNullEndDate,
        needsMigration,
        migrationRequired: needsMigration > 0,
        migrationPercentage: totalCounterOffers > 0 ? 
          Math.round((counterOffersWithEndDate / totalCounterOffers) * 100) : 100
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Migration status check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message
    }, { status: 500 });
  }
}
