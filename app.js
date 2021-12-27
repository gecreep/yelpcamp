const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,

    useUnifiedTopology: true
});
main().catch(err => console.log(err));
const db = mongoose.connection;
async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelp-camp');
}
db.once('open', function () {
    console.log('good')
})

const express = require('express');
const app = express();
const ejsMate = require('ejs-mate')
const path = require('path');
const { campgroundSchema, reviewSchema } = require('./schemas.js')

const Campground = require('./models/campground');
const methodOverride = require('method-override')
const catchAsync = require('./utils/catchAsync')
const errorHandler = require('./utils/errorHandler');
//const review = require('./models/review.js');
const Review = require('./models/review')
app.engine('ejs', ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.get('/', (req, res) => {
    res.render("home")
})
const validateCamground = (req, res, next) => {
    const campgroundSchema = Joi.object({
        campground: Joi.object({
            title: Joi.string().required(),
            price: Joi.number().required().min(0),
            image: Joi.string().required(),
            description: Joi.string().required(),
            location: Joi.string().required()
        }).required()
    })
    const { error } = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new errorHandler(msg, 400)
    } else {
        next();
    }
}

const validateReview=(req,res,next)=>{
    const { error } = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new errorHandler(msg, 400)
    } else {
        next();
    }
}
app.get('/campgrounds', async (req, res) => {
    const campgrounds = await Campground.find({});


    res.render('campgrounds/index', { campgrounds })
})
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new')



})
app.post('/campgrounds', validateCamground, catchAsync(async (req, res, next) => {


const campground=new Campground(req.body.campground)
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`)
}





))


app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
  

    res.render('campgrounds/show', { campground })
}))

app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);


    res.render('campgrounds/edit', { campground })
}))
app.put('/campgrounds/:id', validateCamground, catchAsync(async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { new: true })
    res.redirect(`/campgrounds/${campground._id}`)
}))

app.post('/campgrounds/:id/reviews', validateReview,catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async(req,res)=>{
 const {id, reviewId}=req.params;
 await Campground.findOneAndUpdate(id,{$pull:{reviews:reviewId}})
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`)
}))

app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds')


}));

app.all('*', (req, res, next) => {
    next(new errorHandler("page not found ", 404))
})
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'OH NO SOMETHING WENT WRONG!!!'
    res.status(statusCode).render('error', { err })

});

app.listen(5000, () => {
    console.log("onboard");
})
