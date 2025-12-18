import jwt from 'jsonwebtoken';
import Faculty from '../models/Faculty.js';

const auth = async (req, res, next) => {
    try {
        // console.log("*********************** Authentication Middleware ***********************");
        // console.log("request : ",req.cookies.token);
        // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& response : ",res);
        const token = req.cookies.token;
        if (!token) {
            console.log("No token found in cookies");
            return res.status(401).send({ error: 'Please authenticate.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await Faculty.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

export default auth;
