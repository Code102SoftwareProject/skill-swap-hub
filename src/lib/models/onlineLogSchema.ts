import { IMessage } from "@/types/chat";
import mongoose,{Document,Schema} from "mongoose";

interface IonlineLog extends Document{
    userId: mongoose.Types.ObjectId;
    lastOnline:Date;
}

const OnlineLogSchema: Schema <IonlineLog> =new Schema<IonlineLog>({
    userId:{
       type:mongoose.Schema.Types.ObjectId,
       ref:'User',
       required:true
    },
    lastOnline:{
        type:Date,
        default:Date.now(),
        required:true
    }
})


OnlineLogSchema.index({userId:1})
OnlineLogSchema.index({lastOnline:-1})

export default mongoose.models.OnlineLog || mongoose.model<IonlineLog>('OnlineLog',OnlineLogSchema);