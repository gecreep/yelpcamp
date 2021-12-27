const mongoose=require('mongoose')
const Schema=mongoose.Schema
const Review=require('./review')
const CampgroundSchema=new Schema({
    title:String,
    location:String,
    description:String,
    price:Number,
    image:String,
    reviews:[{
        type:Schema.Types.ObjectId,
        ref:'Review'
    }]
});
CampgroundSchema.post('findOneAndDelete', async function(doc){
    if(doc){
        await Review.deleteMany({
            id:{ $in:doc.reviews}
        })
    }
})
module.exports=mongoose.model('campground',CampgroundSchema)