import mongoose,{Schema, Document, mongo} from 'mongoose';
import  User  from './userSchema';
import Session from './sessionSchema';

interface IWork extends Document {
    session: mongoose.Types.ObjectId;
    provideUser: mongoose.Types.ObjectId;
    receiveUser: mongoose.Types.ObjectId;
    workURL: string;
    workDescription: string;
    provideDate: Date;
    acceptanceStatus: 'pending' | 'accepted' | 'rejected';
    rejectionReason: string;
    rating: number;
    remark: string;
}



const workSchema = new Schema<IWork>(
    {
        session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
        provideUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        receiveUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        workURL: { type: String, required: true },
        workDescription: { type: String, required: true },
        provideDate: { type: Date, default: Date.now },
        acceptanceStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        rejectionReason: { type: String, default:"" },
        rating:{type:Number,default:-1},
        remark:{type:String,default:""}
    },
    {
        timestamps:true
    }
)

export default mongoose.models.Work || mongoose.model<IWork>('Work', workSchema);