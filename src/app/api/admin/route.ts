import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Admin from "@/lib/models/adminSchema";
import { NextRequest } from "next/server";
import { Types } from 'mongoose';

export const GET = async (req: Request) => {
    try {
        await connect();
        const admins = await Admin.find();
        return NextResponse.json(admins, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: "Error in fetching admin", error: error.message },
            { status: 500 }
        );
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        await connect();
        const newAdmin = new Admin(body);
        await newAdmin.save();

        return NextResponse.json({ message: "Admin is created", Admin: newAdmin }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error in creating admin", error: error.message }, { status: 500 });
    }
};

export const PATCH = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { adminId,password } = body;

        if (!adminId || !password) {
            return NextResponse.json({ message: "AdminId or Password is not found" }, { status: 400 });
        }

if(!Types.ObjectId.isValid(adminId)) {
            return NextResponse.json({ message: "Invalid adminId" }, { status: 400 });
        }

        await connect();
        const updatedAdmin = await Admin.findByIdAndUpdate(adminId, { password: password }, { new: true });

        return NextResponse.json({ message: "Admin updated successfully", Admin: updatedAdmin }, { status: 200 });
        } catch (error: any) {
            return NextResponse.json({ message: "Error in updating admin", error: error.message }, { status: 500 });
        }

    };


    export const DELETE = async (req: NextRequest) => {
        try{
            const {searchParams}= new URL(req.url);
            const adminId=searchParams.get('adminId');
            if(!adminId){
                return NextResponse.json({message:"AdminId is not found"},{status:400});
            }
            if(!Types.ObjectId.isValid(adminId)){
                return NextResponse.json({message:"Invalid adminId"},{status:400});
            }

            await connect();
            const deletedAdmin=await Admin.findByIdAndDelete(new Types.ObjectId(adminId));

            if(!deletedAdmin){
                return NextResponse.json({message:"Admin not found in the database"},{status:404});
            }
            return NextResponse.json({message:"Admin deleted successfully",Admin:deletedAdmin},{status:200});

        }
        catch(error:any){
            return NextResponse.json({message:"Error in deleting admin",error:error.message},{status:500});

    }
}
