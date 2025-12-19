import jwt from 'jsonwebtoken';
import Faculty from '../models/Faculty.js';
import Admin from '../models/Admin.js'; // Import Admin model

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            console.log("No token found in cookies");
            return res.status(401).send({ error: 'Please authenticate.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        let user;
        // Try to find user as Faculty
        user = await Faculty.findById(decoded.id).select('-password');

        if (!user) {
            // If not found as Faculty, try to find as Admin
            user = await Admin.findById(decoded.id).select('-password');
        }

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

export default auth;

