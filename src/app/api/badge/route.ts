import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Badge from "@/lib/models/badgeSchema";
import { NextRequest } from "next/server";
import { Types } from 'mongoose';

export const GET = async (req: Request) => {
    try {
        await connect();
        const badges = await Badge.find();
        return NextResponse.json(badges, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: "Error in fetching Badge", error: error.message },
            { status: 500 }
        );
    }
};


export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        await connect();
        const newBadge = new Badge(body);
        await newBadge.save();

        return NextResponse.json({ message: "Badge is created", Admin: newBadge}, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error in creating Badge", error: error.message }, { status: 500 });
    }
};

export const PATCH = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { badgeId, badgeImage, criteria, description } = body;

        if (!badgeId) {
            return NextResponse.json({ message: "BadgeId is not found" }, { status: 400 });
        }
        
        // Check for fields to update
        const updateData: any = {};
        
        if (badgeImage) {
            updateData.badgeImage = badgeImage;
        }
        
        if (criteria) {
            updateData.criteria = criteria;
        }
        
        if (description) {
            updateData.description = description;
        }
        
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No fields provided for update" }, { status: 400 });
        }

        if(!Types.ObjectId.isValid(badgeId)) {
            return NextResponse.json({ message: "Invalid BadgeId" }, { status: 400 });
        }

        await connect();
        const updatedBadge = await Badge.findByIdAndUpdate(
            badgeId, 
            updateData,
            { new: true }
        );

        if (!updatedBadge) {
            return NextResponse.json({ message: "Badge not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            message: "Badge updated successfully", 
            badge: updatedBadge 
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ 
            message: "Error in updating Badge", 
            error: error.message 
        }, { status: 500 });
    }
};

export const DELETE = async (req: NextRequest) => {
    try{
        const {searchParams}= new URL(req.url);
        const badgeId=searchParams.get('badgeId');
        if(!badgeId){
            return NextResponse.json({message:"BadgeId is not found"},{status:400});
        }
        if(!Types.ObjectId.isValid(badgeId)){
            return NextResponse.json({message:"Invalid Badge Id"},{status:400});
        }

        await connect();
        const deletedBadge=await Badge.findByIdAndDelete(new Types.ObjectId(badgeId));

        if(!deletedBadge){
            return NextResponse.json({message:"Badge not found in the database"},{status:404});
        }
        return NextResponse.json({message:"Badge deleted successfully",Badge:deletedBadge},{status:200});

    }
    catch(error:any){
        return NextResponse.json({message:"Error in deleting Badge",error:error.message},{status:500});

    }
}


