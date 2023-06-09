import React, { useEffect } from 'react';

const MatrixRain = () => {
    useEffect(() => {
        const canvas = document.getElementById('matrix-rain');
        const context = canvas.getContext('2d');
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@$#%^&*()';
        const columns = canvas.width / 20;
        const drops = [];
        for(let i = 0; i < columns; i++)
            drops[i] = 1;

        function draw() {
            context.fillStyle = 'rgba(0, 0, 0, 0.05)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#0F0';
            context.font = '20px Courier';
            for(let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                context.fillText(text, i * 20, drops[i] * 20);
                if(drops[i] * 20 > canvas.height && Math.random() > 0.975)
                    drops[i] = 0;
                drops[i]++;
            }
        }

        const matrixInterval = setInterval(draw, 33);

        return () => {
            clearInterval(matrixInterval);
        }
    }, []);

    return (
        <canvas id="matrix-rain" className="matrix-rain"></canvas>
    );
};

export default MatrixRain;
