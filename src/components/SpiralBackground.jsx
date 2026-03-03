import React from 'react';
import { motion } from 'framer-motion';

const SpiralBackground = () => {
    return (
        <div className="bg-spiral">
            <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                <path 
                    d="M400,400 m0,-300 a300,300 0 1,1 0,600 a300,300 0 1,1 0,-600 m0,100 a200,200 0 1,0 0,400 a200,200 0 1,0 0,-400 m0,100 a100,100 0 1,1 0,200 a100,100 0 1,1 0,-200 m0,50 a50,50 0 1,0 0,100 a50,50 0 1,0 0,-100" 
                    fill="none" 
                    stroke="var(--accent-gold)" 
                    strokeWidth="1" 
                    opacity="0.3"
                />
            </svg>
        </div>
    );
};

export default SpiralBackground;
