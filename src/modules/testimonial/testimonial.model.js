const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    image: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, {
    timestamps: true,
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = { Testimonial };
