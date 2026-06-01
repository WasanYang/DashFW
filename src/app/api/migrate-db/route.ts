import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // 1. Fetch all clients
    const clients = await db.collection('clients').find().toArray();

    // 2. Identify companies (where isCompany === true)
    const companyDocs = clients.filter((c) => c.isCompany === true);
    
    let companiesCreated = 0;
    let clientsUpdated = 0;

    for (const compDoc of companyDocs) {
      const companyName = compDoc.companyName || compDoc.name;
      
      // Create a Company record based on the placeholder client
      const newCompany = {
        name: companyName,
        email: compDoc.email,
        phone: compDoc.phone,
        avatarUrl: compDoc.avatarUrl,
        socials: compDoc.socials,
        customFields: compDoc.customFields,
        address: compDoc.address,
        city_state: compDoc.city_state,
        country: compDoc.country,
        zip: compDoc.zip,
        timezone: compDoc.timezone,
        bio: compDoc.bio,
        archived: compDoc.archived,
        notes: compDoc.notes,
        status: 'Active'
      };

      // Check if company already exists to avoid duplicates on re-runs
      const existing = await db.collection('companies').findOne({ name: companyName });
      let companyId;
      if (existing) {
        companyId = existing._id;
      } else {
        const result = await db.collection('companies').insertOne(newCompany);
        companyId = result.insertedId;
        companiesCreated++;
      }

      // 3. Find all clients that belong to this company (by companyName or notes)
      // and update them with the companyId
      const associatedClients = clients.filter(c => 
        !c.isCompany && 
        (c.companyName === companyName || (c.notes && c.notes.toLowerCase().includes(`company: ${companyName.toLowerCase()}`)))
      );

      for (const client of associatedClients) {
        await db.collection('clients').updateOne(
          { _id: new ObjectId(client._id) },
          { $set: { companyId: companyId.toString() } }
        );
        clientsUpdated++;
      }

      // 4. Delete the placeholder client doc (optional, but requested for cleanup)
      await db.collection('clients').deleteOne({ _id: new ObjectId(compDoc._id) });
    }

    return NextResponse.json({
      message: 'Migration complete',
      companiesCreated,
      clientsUpdated,
      deletedPlaceholders: companyDocs.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Migration failed', details: (error as Error).message },
      { status: 500 },
    );
  }
}
