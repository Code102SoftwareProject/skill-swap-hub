import mongoose,{Schema,Document}  from "mongoose";

interface ICode extends Document{
  code: string;
  codeDate:Date;
}


const CodeSchema: Schema<ICode> =new Schema({
  code:{type:String,required:true},
  codeDate:{type:Date,default:Date.now},
})

//pre
//indexes

export default mongoose.models.Code ||  mongoose.model<ICode>("Code",CodeSchema);