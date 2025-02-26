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
        const { badgeId,badgeImage, description } = body;

        if (!badgeId ) {
            return NextResponse.json({ message: "BadgeId is not found" }, { status: 400 });
        }
        if(!badgeImage){
            return NextResponse.json({ message: "Badge Image is not found" }, { status: 400 });
        }
        
        if(!description){
            return NextResponse.json({ message: "Description is not found" }, { status: 400 });
        }
if(!Types.ObjectId.isValid(badgeId)) {
            return NextResponse.json({ message: "Invalid badgeId" }, { status: 400 });
        }

        await connect();
        const updatedAdmin = await Badge.findByIdAndUpdate(badgeId, { badgeImage: badgeImage, description: description }, { new: true });

        return NextResponse.json({ message: "Badge updated successfully", Admin: updatedAdmin }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: "Error in updating Badge", error: error.message }, { status: 500 });
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
                return NextResponse.json({message:"Invalid adminId"},{status:400});
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


