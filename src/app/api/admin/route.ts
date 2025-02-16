import connect from "@/lib/db";
import {NextResponse} from "next/server";
import Admin from "@/lib/modals/adminSchema"

export const GET=async(req: Request, res: Response) => {
    try{
        await connect();
        const admins=await Admin.find();
        return NextResponse.json(admins, { status: 200 });
    }catch(error:any){
        return new NextResponse("Error in fetching admin" + error.message,{status:500});

    }};
