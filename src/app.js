const express=require("express")
require("./db/mongoose")
const userRouter=require("./router/userrouter")
const taskRouter=require("./router/taskrouter")

const app=new express()
const port=process.env.PORT

app.use(express.json())
app.use('/users',userRouter)
app.use('/tasks',taskRouter)

app.listen(port,()=>console.log(`Working on port ${port}`))



