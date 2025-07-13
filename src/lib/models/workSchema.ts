import mongoose,{Schema, Document, mongo} from 'mongoose';
import  User  from './userSchema';
import Session from './sessionSchema';

interface IWorkFile {
    fileName: string;
    fileURL: string;
    fileTitle: string;
    uploadedAt: Date;
}

interface IWork extends Document {
    session: mongoose.Types.ObjectId;
    provideUser: mongoose.Types.ObjectId;
    receiveUser: mongoose.Types.ObjectId;
    workURL: string; // Keep for backwards compatibility
    workFiles: IWorkFile[]; // New field for multiple files
    workDescription: string;
    provideDate: Date;
    acceptanceStatus: 'pending' | 'accepted' | 'rejected';
    rejectionReason: string;
    rating: number;
    remark: string;
}



const workFileSchema = new Schema<IWorkFile>({
    fileName: { type: String, required: true },
    fileURL: { type: String, required: true },
    fileTitle: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

const workSchema = new Schema<IWork>(
    {
        session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
        provideUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        receiveUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        workURL: { type: String, default: "" }, // Keep for backwards compatibility
        workFiles: {
            type: [workFileSchema],
            validate: {
                validator: function(files: IWorkFile[]) {
                    return files.length <= 5; // Maximum 5 files
                },
                message: 'Maximum 5 files allowed per work submission'
            },
            default: []
        },
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