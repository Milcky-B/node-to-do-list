const mongoose= require("mongoose")
const validator=require("validator")
const bCrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const Task=require("../model/tasks")

const userSchema=new mongoose.Schema({
    name: {
        type: String,
        trim:true,
        required:[true,'Why you have no name?']
    },
    age:{
        type: Number,
        validate (value){
            if (value<0){
                throw new Error("Age needs to be positive")
            }
        }
    },
    email:{
        type: String,
        unique:true,
        required: true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)) throw new Error("Invalid Email")
        }
    },
    password:{
        type:String,
        trim:true,
        required:true,
        minlength:6,
        validate(value){
            if(value.toLowerCase().includes("password")) throw new Error("Password can't be password dumby")
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},{timestamps:true})

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

//invoked by instances of a model only
userSchema.methods.generateJWT= async function(){
    const token=jwt.sign({_id:this._id.toString()},process.env.JWT_SECRET)
    this.tokens=this.tokens.concat({token})
    await this.save()
    return token
}

userSchema.methods.toJSON=function(){
    
    const userObject=this.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.__v
    delete userObject.avatar
    return userObject;
}

userSchema.methods.removeTasks=async function(){
    const tasks=await Task.find({owner:this._id});
    tasks.forEach(task=>task.deleteOne())
}

//invoked by the model itself
userSchema.statics.findByEmail=async (email,password)=>{
    const user=await User.findOne({email});
    if(!user){
        throw new Error("Unable to login");
    }

    const isSame=await bCrypt.compare(password,user.password)
    if(!isSame){
        throw new Error("Unable to login");
    }

    return user;
}

userSchema.pre('save',async function (next){
    //it was 1288888888 remeber
    if(this.isModified('password')){
        const passwd=await bCrypt.hash(this.password,8)
        this.password=passwd
    }
    next()
})

const User=mongoose.model('User',userSchema)

module.exports=User