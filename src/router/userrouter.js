const express=require("express")
const sharp=require("sharp")
const multer=require("multer")
const upload=multer({
    limits:{
        //works as bytes
        fileSize:1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(new Error('Unsupported File Format'))
        cb(undefined,true)

    }
})
const User=require('../db/model/users')
const auth=require("../middleware/middlewareAuth")
const sendEmail=require("../emails/account")

const router= new express.Router()

router.post('/', async (req,res)=>{
    const user=new User(req.body)
    try {
        await user.save()
        sendEmail.createAccount(user.email,user.name)
        const token=await user.generateJWT()
        res.send({user,token});
    } catch (err) {
        res.status(404).send(err.message);
    }
})

router.post('/login',async(req,res)=>{
    try {
        const user=await User.findByEmail(req.body.email,req.body.password);
        const token=await user.generateJWT()
        res.send({user,token});
    } catch (err) {
        res.status(400).send();
    }
})

router.get('/',async (req,res)=>{
    try {
        const users=await User.find({})
        res.send(users)
    } catch (err) {
        res.status(500).send("Network Problems")
    }
})

router.get('/me', auth,async (req,res)=>{
    res.send(req.user)
})

router.post('/logout',auth,async(req,res)=>{
    try {
        req.user.tokens=req.user.tokens.filter((token)=>{
           return token.token!=req.token
        })
        await req.user.save()
        res.send("Logout Successful")
    } catch (err) {
        res.status(500).send()
    }
})

router.post('/logoutall',auth,async(req,res)=>{
    try {
        req.user.tokens=[]
        await req.user.save()
        res.send("All sessions are terminated")
    } catch (err) {
        res.status(500).send()
    }
})



router.patch("/me",auth,async(req,res)=>{
    const updates=Object.keys(req.body)

    try {
        updates.forEach((update)=>req.user[update]=req.body[update])
        await req.user.save()
        res.send(req.user)
       
    } catch (err) {
        res.status(400).send(err.message)
    }
})

router.delete("/me",auth,async(req,res)=>{
    try {
        const user=await User.findById(req.user._id)
        await user.removeTasks();
        await user.deleteOne();
        sendEmail.deleteAccount(user.email,user.name);
        res.send(`${user.name} deleted`)
    } catch (err) {
        res.status(500).send()
    }
})

router.post('/me/pfp',auth,upload.single('avatar'),async(req,res)=>{
    const outputBuffer=await sharp(req.file.buffer).resize({width:450,height:450}).png().toBuffer()
    req.user.avatar=outputBuffer
    await req.user.save()
    res.send("Uploaded")
},(err,req,res,next)=>{
    res.status(400).send({error:err.message})
    next
})

router.delete('/me/pfp',auth,async(req,res)=>{
    req.user.avatar=undefined
    await req.user.save()
    res.send("Profile picture removed")
})

router.get('/me/pfp/:id',async(req,res)=>{
    try {
        const user=await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)
    } catch (err) {
        res.status(404).send()
    }
})

module.exports=router